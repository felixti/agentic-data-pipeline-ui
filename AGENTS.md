# Swiss System Control Plane - Agentic Data Pipeline UI

## Project Overview

This is a **Next.js 16** web application called "Swiss System Control Plane" - an Agentic Data Pipeline UI. The project follows a distinctive **Swiss Style/International Typographic Style** design system characterized by:

- High-contrast black/white color scheme with orange (#ff4400) accent
- Sharp, rectangular aesthetics (zero border radius)
- Heavy borders and grid-based layouts
- Monospace typography for data, sans-serif for headings
- Material Symbols Outlined for iconography

The application provides a control plane interface for monitoring and managing data pipeline operations including ingestion, vector inspection, calibration, configuration, and topology visualization.

## Technology Stack

| Category           | Technology                | Version                  |
| ------------------ | ------------------------- | ------------------------ |
| Framework          | Next.js                   | 16.1.6                   |
| Language           | TypeScript                | 5.9.3                    |
| UI Library         | React                     | 19.2.4                   |
| Styling            | Tailwind CSS              | 4.2.0                    |
| PostCSS            | @tailwindcss/postcss      | 4.2.0                    |
| Linting/Formatting | Biome                     | 2.4.4                    |
| Package Manager    | pnpm                      | (inferred from lockfile) |
| Fonts              | Inter, JetBrains Mono     | Google Fonts             |
| Icons              | Material Symbols Outlined | Google Fonts             |

## Project Structure

```
/
├── src/app/                    # Next.js App Router pages
│   ├── layout.tsx              # Root layout with navigation header
│   ├── page.tsx                # 01 MONITOR - Dashboard/Job Queue (default route)
│   ├── globals.css             # Global styles, Tailwind directives, custom CSS
│   ├── calibration/
│   │   └── page.tsx            # 02 CALIBRATION - A/B Retrieval Testing
│   ├── vector-inspector/
│   │   └── page.tsx            # 03 VECTORS - Vector Inspector
│   ├── configuration/
│   │   └── page.tsx            # 04 CONFIG - Pipeline Configuration
│   ├── topology/
│   │   └── page.tsx            # 05 TOPOLOGY - System Architecture
│   └── integration/
│       └── page.tsx            # 06 INTEGRATION - API Integration Guide
├── stitch_assets/              # External HTML reference files and screenshots
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.mjs             # Next.js configuration (default/empty)
├── tailwind.config.ts          # Tailwind CSS theme customization
├── postcss.config.mjs          # PostCSS configuration
├── biome.json                  # Biome linter/formatter configuration
├── clean_lint.js               # Post-lint cleanup script
├── fix_lint.js                 # Pre-lint auto-fix script
└── download_stitch.sh          # Script to download external assets
```

## Build and Development Commands

> **Note:** This project uses **pnpm** as the package manager. Do not use npm.

```bash
# Install dependencies
pnpm install

# Start development server (default: http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint check with Biome
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Format code with Biome
pnpm format
```

## Code Style Guidelines

### Linting and Formatting (Biome)

The project uses **Biome** (v2.4.4) for both linting and formatting. Configuration is in `biome.json`:

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for JavaScript
- **CSS**: CSS Modules enabled, Tailwind directives supported
- **Auto-organize imports**: Enabled

### TypeScript Configuration

- **Target**: ES5
- **Module**: ESNext with Bundler resolution
- **JSX**: react-jsx transform
- **Path Alias**: `@/*` maps to `./src/*`
- **Strict mode**: Enabled

### Design System Conventions

#### Color Palette (from tailwind.config.ts)

```
primary:    #ff4400  (Orange accent)
signal:     #f94706  (Signal/highlight)
background-light: #ffffff
background-dark:  #000000
ink:        #000000  (Text/borders)
surface:    #F4F4F4  (Muted backgrounds)
muted:      #999999  (Secondary text)
```

#### Typography

- **Display/Headings**: Inter font family
- **Monospace/Data**: JetBrains Mono font family
- **Icons**: Material Symbols Outlined

#### Border and Radius

- Default border width: 1px
- Heavy borders: 4px (`border-4` or `border-b-4`)
- **All border radius is 0** (sharp corners everywhere)

#### Common CSS Classes Pattern

```tsx
// Card/container pattern
className="border border-ink p-6 bg-white"

// Hover interaction pattern
className="hover:bg-surface hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]"

// Typography patterns
className="font-mono text-sm"           // Data/code
text-[11px] font-bold tracking-widest   // Labels/headers
uppercase                                 // Most text is uppercase
```

### Accessibility Requirements

- All `<button>` elements must have `type="button"` attribute
- All `<svg>` elements should have `aria-hidden="true"`
- Form inputs should have associated `<label>` elements with `htmlFor`

### Utility Scripts

The project includes two Node.js utility scripts for automated fixes:

1. **`fix_lint.js`** - Run before linting to auto-fix common issues:
   - Adds `type="button"` to buttons without type
   - Adds `aria-hidden="true"` to SVG elements

2. **`clean_lint.js`** - Run after linting to clean up duplicates:
   - Removes duplicate `aria-hidden="true"` attributes

## Page Structure

The application has 6 main sections accessible via the top navigation:

1. **01 MONITOR** (`/`) - Operational dashboard with metrics cards and job queue table
2. **02 CALIBRATION** (`/calibration`) - A/B testing interface for retrieval strategies
3. **03 VECTORS** (`/vector-inspector`) - Vector database inspection tool
4. **04 CONFIG** (`/configuration`) - Pipeline configuration (chunking strategies)
5. **05 TOPOLOGY** (`/topology`) - System architecture visualization
6. **06 INTEGRATION** (`/integration`) - API integration documentation

## External Assets

The `/stitch_assets/` directory contains reference HTML files and screenshots downloaded from external sources. These are used as design references and documentation:

- `refined_operational_monitor.html` + screenshot
- `refined_rag_calibration_console.html` + screenshot
- `refined_vector_inspector.html` + screenshot
- `refined_pipeline_configuration.html` + screenshot
- `refined_05_topology.html` + screenshot
- `swiss_system_integration_guide.html` + screenshot

Use `download_stitch.sh` to re-download these assets if needed.

## Testing

Currently, the project does **not** have automated tests configured. Testing is done manually through browser verification.

## Deployment

This is a standard Next.js application that can be deployed to:

- Vercel (recommended for Next.js)
- Any platform supporting Node.js (Docker, AWS, etc.)

Build output is in the `.next/` directory.

## Security Considerations

- The application uses Google Fonts loaded from CDN (`fonts.googleapis.com`)
- No environment variables or secrets are currently configured
- All pages are client-side rendered (no API routes)

## Development Tips

1. **Always run `fix_lint.js` before committing** to ensure buttons and SVGs have proper attributes
2. **Use the path alias `@/`** for imports from `src/` directory
3. **Follow the Swiss Style aesthetic**: Sharp corners, heavy borders, uppercase text, monospace for data
4. **Custom scrollbar styling** is defined in `globals.css` - use standard scrollable containers
5. **Custom form elements** (checkboxes, range inputs) have custom styling in `globals.css`

## API Integration

### Base URL Configuration

The API client supports both client-side and server-side rendering:

| Environment | Base URL                                      |
| ----------- | --------------------------------------------- |
| Browser     | `/proxy` (Next.js rewrite)                    |
| Server      | `process.env.NEXT_PUBLIC_API_URL` or fallback |

### Authentication

All API requests require an `X-API-Key` header:

```typescript
// Stored in localStorage
const apiKey = localStorage.getItem("ag_api_key");
```

### Key Endpoints

#### 1. File Upload

```
POST /api/v1/upload
Content-Type: multipart/form-data

Form Fields:
- files: File[] (required) - Multiple files supported
- priority: "low" | "normal" | "high" (optional, default: "normal")
- pipeline_id: string (optional) - Pipeline configuration UUID
- destination_ids: string (optional) - JSON array of destination UUIDs
- metadata: string (optional) - JSON object as string (supports chunk_strategy, chunk_size, chunk_overlap overrides)

Response: 202 Accepted
{
  "data": {
    "jobs": [...],
    "total": 2
  },
  "meta": { "request_id": "...", "timestamp": "...", "api_version": "v1" }
}
```

#### 2. Create Job (Manual)

```
POST /api/v1/jobs
Content-Type: application/json

{
  "source_type": "upload" | "url" | "s3" | "azure_blob" | "sharepoint",
  "source_uri": "string",
  "file_name": "string" (optional),
  "file_size": number (optional),
  "mime_type": "string" (optional),
  "priority": "low" | "normal" | "high" (optional),
  "mode": "sync" | "async" (optional, default: "async"),
  "external_id": "string" (optional),
  "metadata": object (optional) // Supports advanced overrides: chunk_strategy, chunk_size, chunk_overlap
}
```

#### 3. List Jobs

```
GET /api/v1/jobs?page=1&limit=20&sort_by=created_at&sort_order=desc
```

#### 4. Health Check

```
GET /health
```

### React Query Hooks

Located in `src/lib/api/hooks.ts`:

| Hook               | Purpose                       |
| ------------------ | ----------------------------- |
| `useJobs()`        | Fetch and cache job list      |
| `useHealth()`      | System health status          |
| `useUploadFiles()` | Upload files with retry logic |
| `useCreateJob()`   | Create manual ingestion jobs  |
| `useIngestUrl()`   | Ingest from URL               |
| `useJobChunks()`   | Fetch document chunks         |

### Error Handling

All hooks include comprehensive error handling:

```typescript
try {
  await uploadMutation.mutateAsync({ files, priority: "high" });
} catch (error) {
  // Error.message contains user-friendly message
  // Network errors trigger automatic retry (3 attempts)
}
```

## Known Issues / TODOs

- Job details panel is present in DOM but not functional (id="job-details-panel")
- No error boundaries or loading states implemented at page level
- File upload progress tracking not implemented
