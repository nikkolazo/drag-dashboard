import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// Question Metadata Interfaces
// ============================================================================

export interface CanonicalQuestion {
  id: string;
  sector: 'P' | 'F' | 'PF';
  category: string;
  text: string;
  verbatim?: boolean;
  require_source?: boolean;
  classification_scale?: string[];
  require_financial_quantification?: boolean;
  notes?: string;
}

export interface QuestionVariant extends CanonicalQuestion {
  canonical_id: string;
  adaptation_reason?: string;
  applicable_companies?: string[];
}

export interface QuestionsMetadata {
  _meta: {
    description: string;
    version: string;
    last_updated: string;
    total_canonical_questions: number;
    sector_codes: {
      P: string;
      F: string;
      PF: string;
    };
  };
  canonical_questions: CanonicalQuestion[];
  company_specific_variants: {
    [companyName: string]: QuestionVariant[];
  };
}

// ============================================================================
// Analysis Result Interfaces
// ============================================================================

export interface Evidence {
  quote?: string;
  source?: string;
  page?: number;
  financial_amounts?: string[];
  evidence_number?: number;
  source_url?: string;
  text?: string;
}

export interface Answer {
  classification: 'NONE' | 'UNCLEAR' | 'PARTIAL' | 'YES';
  classification_justification: string;
  financial_quantification?: string;
  evidence: Evidence[];
  summary?: string;
}

export interface Question {
  question_id: string;
  question_text: string;
  category?: string;
  priority?: string;
  answer: Answer;
}

export interface AnalysisMetadata {
  company: string;
  fiscal_year: string;
  analysis_date: string;
  model_used: string;
  documents_analyzed: string[];
  total_questions: number;
  processing_time_seconds?: number;
  estimated_cost?: string;
}

export interface AnalysisResult {
  metadata: AnalysisMetadata;
  questions: Question[];
}

/**
 * Deduplicate results: Keep only latest per company/year
 */
function deduplicateResults(results: AnalysisResult[]): AnalysisResult[] {
  const grouped = new Map<string, AnalysisResult>();

  for (const result of results) {
    const key = `${result.metadata.company}_${result.metadata.fiscal_year}`;
    const existing = grouped.get(key);

    if (!existing || result.metadata.analysis_date > existing.metadata.analysis_date) {
      grouped.set(key, result);
    }
  }

  return Array.from(grouped.values());
}

/**
 * Deduplicate questions within a result
 */
function deduplicateQuestions(result: AnalysisResult): AnalysisResult {
  const seen = new Set<string>();
  const uniqueQuestions: Question[] = [];

  for (const question of result.questions) {
    if (!seen.has(question.question_id)) {
      seen.add(question.question_id);
      uniqueQuestions.push(question);
    }
  }

  return {
    ...result,
    questions: uniqueQuestions,
    metadata: {
      ...result.metadata,
      total_questions: uniqueQuestions.length
    }
  };
}

/**
 * Load all DRAG result files from public/data/results/
 */
export async function loadAllResults(): Promise<AnalysisResult[]> {
  const resultsDir = join(process.cwd(), 'public', 'data', 'results');

  try {
    const files = await readdir(resultsDir);

    // Filter to only DRAG JSON files
    // TODO: Add CSV support in the future
    const jsonFiles = files.filter(f =>
      f.endsWith('.json') && f.includes('DRAG')
    );

    const results: AnalysisResult[] = [];

    for (const file of jsonFiles) {
      const filePath = join(resultsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as any;

      // Normalize the data structure
      // 1. Rename 'analysis_results' to 'questions'
      if (data.analysis_results && !data.questions) {
        data.questions = data.analysis_results;
        delete data.analysis_results;
      }

      // 2. Normalize fiscal_year field (DRAG files use 'year')
      if (!data.metadata.fiscal_year && data.metadata.year) {
        data.metadata.fiscal_year = data.metadata.year;
      }

      // 3. Ensure model_used is set to D-RAG
      if (!data.metadata.model_used) {
        data.metadata.model_used = 'D-RAG';
      }

      // 4. Add total_questions if missing
      if (!data.metadata.total_questions) {
        data.metadata.total_questions = data.questions?.length || data.completeness_summary?.total_questions || 0;
      }

      // 5. Normalize UNSURE to UNCLEAR in all questions
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((q: any) => {
          if (q.answer && q.answer.classification === 'UNSURE') {
            q.answer.classification = 'UNCLEAR';
          }
        });
      }

      results.push(data as AnalysisResult);
    }

    // Deduplicate results and questions
    const dedupedResults = deduplicateResults(results);
    const fullyDeduped = dedupedResults.map(r => deduplicateQuestions(r));

    return fullyDeduped;
  } catch (error) {
    console.error('Error loading results:', error);
    return [];
  }
}

/**
 * Load results for a specific company
 */
export async function loadCompanyResults(company: string): Promise<AnalysisResult[]> {
  const allResults = await loadAllResults();
  return allResults.filter(r => r.metadata.company.toLowerCase() === company.toLowerCase());
}

/**
 * Load results for a specific company and year
 */
export async function loadYearResult(company: string, year: string): Promise<AnalysisResult | null> {
  const companyResults = await loadCompanyResults(company);
  return companyResults.find(r => r.metadata.fiscal_year === year) || null;
}

/**
 * Get all unique companies from results
 */
export async function getAvailableCompanies(): Promise<string[]> {
  const allResults = await loadAllResults();
  const companies = new Set(allResults.map(r => r.metadata.company));
  return Array.from(companies).sort();
}

/**
 * Get all years available for a company
 */
export async function getCompanyYears(company: string): Promise<string[]> {
  const companyResults = await loadCompanyResults(company);
  const years = companyResults.map(r => r.metadata.fiscal_year);
  return Array.from(new Set(years)).sort();
}

// ============================================================================
// Questions Metadata Loading
// ============================================================================

let cachedQuestionsMetadata: QuestionsMetadata | null = null;

export async function loadQuestionsMetadata(): Promise<QuestionsMetadata> {
  if (cachedQuestionsMetadata) {
    return cachedQuestionsMetadata;
  }

  const questionsPath = join(process.cwd(), 'public', 'data', 'questions.json');
  const content = await readFile(questionsPath, 'utf-8');
  cachedQuestionsMetadata = JSON.parse(content);
  return cachedQuestionsMetadata!;
}

/**
 * Get base question ID (strips variants like -A, -B)
 */
export function getBaseQuestionId(questionId: string): string {
  return questionId.split('-')[0];
}

/**
 * Determine company sector based on canonical questions and variants
 */
export async function getCompanySector(company: string): Promise<'P' | 'F' | 'PF'> {
  const metadata = await loadQuestionsMetadata();
  const companyVariants = metadata.company_specific_variants[company];

  if (!companyVariants || companyVariants.length === 0) {
    // If no company-specific variants, assume PF (both)
    return 'PF';
  }

  const sectors = new Set(companyVariants.map(v => v.sector));

  if (sectors.has('P') && sectors.has('F')) return 'PF';
  if (sectors.has('P')) return 'P';
  if (sectors.has('F')) return 'F';

  return 'PF';
}

/**
 * Calculate applicable questions for a company
 */
export async function calculateApplicableQuestions(company: string, allQuestions: Question[]) {
  const metadata = await loadQuestionsMetadata();
  const companySector = await getCompanySector(company);

  // Filter canonical questions by sector
  const applicableCanonical = metadata.canonical_questions.filter(
    q => q.sector === 'PF' || q.sector === companySector
  );

  // Get company-specific variants
  const companyVariants = metadata.company_specific_variants[company] || [];

  return {
    companySector,
    applicableCanonical,
    companyVariants,
    totalApplicable: applicableCanonical.length + companyVariants.length,
    totalCanonical: applicableCanonical.length,
    totalVariants: companyVariants.length
  };
}
