# Disclosure of Companies - D-RAG Dashboard

A static dashboard for visualizing D-RAG (Document Retrieval-Augmented Generation) analysis results of agricultural companies' risk disclosures.

## Overview

This dashboard displays baseline validation analysis from the D-RAG system, showing how agricultural companies disclose environmental, health, and transition risks in their annual reports.

## Tech Stack

- **Astro 5.14.5** - Static Site Generator
- **Chart.js 4.5.1** - Data Visualization
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type Safety

## Project Structure

```
drag-dashboard/
├── public/
│   ├── data/
│   │   ├── results/          # DRAG JSON analysis files
│   │   └── source_documents/ # Original PDF reports
│   └── favicon.svg
├── src/
│   ├── components/           # Reusable UI components
│   ├── layouts/              # Page layouts
│   ├── pages/                # Routes (index, [company], [year])
│   ├── utils/                # Data loading & processing
│   └── styles/               # Global CSS
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Building

```bash
npm run build
```

This builds the site to `dist/` folder. The `--force` flag ensures cache is cleared and data is fresh.

### Preview Build

```bash
npm run preview
```

### Clean Cache

```bash
npm run clean
```

### Full Rebuild

```bash
npm run rebuild
```

## Data Setup

### Adding DRAG Results

1. Place DRAG JSON files in `public/data/results/`
2. Files must follow naming pattern: `{Company}_{Year}_DRAG_{timestamp}.json`
3. Run `npm run build` to regenerate the site

### Adding Source Documents

1. Place PDF annual reports in `public/data/source_documents/`
2. Files should follow naming: `{Company}_{Year}_Annual_Report.pdf`

## Features

- **Company Overview**: View all analyzed companies with yearly breakdowns
- **Timeline Charts**: Visualize risk disclosure trends over time
- **Matrix View**: Question × Year heatmap of classifications
- **Category Analysis**: Environmental, Health, and Transition risk summaries
- **Question Detail**: Deep dive into individual question responses
- **Dark Theme**: Built-in dark mode support

## Classification System

- **YES (3 points)**: Full disclosure with quantification
- **PARTIAL (2 points)**: Disclosure without full quantification
- **UNCLEAR (1 point)**: Ambiguous or unclear disclosure
- **NONE (0 points)**: No disclosure found

## Deployment

The dashboard generates static HTML/CSS/JS. Deploy the `dist/` folder to any static hosting:

- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

## License

Proprietary - For internal use only

## Support

For issues or questions, contact the development team.
