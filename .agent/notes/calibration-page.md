# Calibration Page — Progress Notes

> Last updated: 2025-02-25

## Architecture

### Page: `src/app/calibration/page.tsx`

- A/B retrieval testing: **Text Search (BM25)** vs **Hybrid Search** side-by-side
- Left sidebar: query textarea, Alpha slider, Top K slider, Run Query button
- Two result columns with clickable cards opening slide-out detail panel
- Uses `useTextSearch` / `useHybridSearch` hooks from `@/lib/api/hooks`

### Component: `src/components/ChunkDetailPanel.tsx`

- 520px slide-out panel (right), same pattern as `NewJobPanel`
- `animate-slide-in-right` / `animate-slide-out-right`, backdrop + Escape to close
- Sections: Score, Hybrid breakdown, Matched terms, Source, Full content, Highlighted Matches, Metadata

## API Contract (Search Endpoints)

### `POST /api/v1/search/text`

### `POST /api/v1/search/hybrid`

**Result fields:**
| Field | Text | Hybrid | Notes |
|-------|------|--------|-------|
| `chunk_id` | ✅ | ✅ | UUID |
| `job_id` | ✅ | ✅ | UUID |
| `chunk_index` | ✅ | ✅ | integer |
| `content` | ✅ | ✅ | plain text |
| `content_source_name` | ✅ | ✅ | real filename (e.g. `report.docx`) |
| `highlighted_content` | ✅ | — | HTML with `<mark>` tags |
| `matched_terms` | ✅ | — | string array |
| `similarity_score` | ✅ | — | float |
| `hybrid_score` | — | ✅ | float |
| `vector_score` | — | ✅ | float |
| `text_score` | — | ✅ | float |
| `fusion_method` | — | ✅ | string |
| `rank` | ✅ | ✅ | integer |
| `metadata` | ✅ | ✅ | `{[key: string]: unknown}` |

**Response wrapper:** `results[]`, `search_time_ms` / `query_time_ms`, `total`

## Key Implementation Notes

- **Scores**: Use `similarity_score` (text) / `hybrid_score` (hybrid) — NOT `score`
- **Source name**: Check `content_source_name` first (top-level), fallback to `metadata.file_name`
- **Highlights**: `highlighted_content` uses `<mark>` HTML tags, render with `dangerouslySetInnerHTML`
- **Mark styling**: `[&_mark]:bg-primary/20 [&_mark]:font-bold [&_mark]:px-0.5`
