# Expert & Import Feature Implementation Plan

## Final Decisions Summary

| # | Decision | Value |
|---|----------|-------|
| 1 | Upload max size | **5 MB** |
| 2 | Expert form UX | **Enhanced modal** (AddExpertModal.tsx) |
| 3 | Expert select in project form | **Inline expansion** (collapsible sub-form) |
| 4 | Validation priority | Format check first, then **API call** |
| 5 | Mandatory fields | **Email** + at least one of **Google Scholar URL** / **ORCID URL** |
| 6 | Data source tracking | **JSONB column** (`import_metadata`) |
| 7 | Coordinate simplification | **200 points** max, Douglas-Peucker |
| 8 | Auto-circle default | **25 km radius**, **32-point** polygon, not user-configurable |
| 9 | Fuzzy search fields | name, institution, country, email, expertise (2 char min, 10 results max) |
| 10 | Conflict resolution | **Field-by-field with checkboxes** |
| 11 | Success flow | **Auto-select + confirmation + collapse** (all) |
| 12 | Upload error handling | **Specific reason + format hint + example link** (all) |
| 13 | Email DB constraint | **NOT NULL** + **CHECK** (format validation) |
| 14 | Scholar validation | **SerpAPI** (`/search?engine=google_scholar_author`) |
| 15 | Testing | Full: **unit + integration + E2E** |

---

## Phase 1: Database Schema Changes

### 1.1 Update `supabase/schema-v3-draft.sql` — `experts` table

**Changes:**
- `email` → `varchar NOT NULL`
- Add `CHECK` constraint for email format
- Remove conditional unique index on `email` (replace with standard unique index)
- Add `import_metadata jsonb NOT NULL DEFAULT '{}'::jsonb`

```sql
create table public.experts (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  institution text not null,
  country text not null,
  degree text,
  headline text,
  expertise_subtitle text,
  bio text,
  expertise text[] not null default '{}',
  publications integer not null default 0 check (publications >= 0),
  email varchar not null,
  linkedin text,
  scopus text,
  orcid text,
  google_scholar text,
  avatar_url text,
  import_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

create unique index experts_email_unique_idx on public.experts (lower(email));
```

**Also add to `app_experts` view:** Pass through `import_metadata`.

### 1.2 Update `src/types/database.ts`

- `ExpertRow.email`: `string` (NOT `string | null`)
- `ExpertRow.import_metadata`: `Json`
- `ExpertInsert.email`: `string`
- `ExpertInsert.import_metadata`: `Json`

### 1.3 Update `src/types/expert.ts` — `ExpertSchema`

```typescript
export const ExpertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  institution: z.string().min(1),
  country: z.string().min(1),
  degree: z.string().optional(),
  headline: z.string().min(10).max(200).optional(),
  expertiseSubtitle: z.string().min(3).max(200).optional(),
  bio: z.string().min(1).max(2000),
  expertise: z.array(z.string().min(1)),
  publications: z.number().int().min(0).optional(),
  projects: z.number().int().min(0).optional(),
  email: z.string().email('Valid email is required'),
  linkedin: z.string().url().optional(),
  scopus: z.string().url().optional(),
  orcid: z.string().url().optional(),
  googleScholar: z.string().url().optional(),
  avatarUrl: ProfileImageUrlSchema.optional(),
  isCitizenScience: z.boolean().optional(),
  importMetadata: z.record(z.unknown()).optional(),
});
```

### 1.4 Add `ExpertFormSchema` (for the creation form with cross-field validation)

New schema in `src/types/expert.ts`:

```typescript
export const ExpertFormSchema = ExpertSchema.extend({
  email: z.string().email('Valid email is required'),
  orcid: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  googleScholar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
}).refine(
  (data) => data.orcid || data.googleScholar,
  { message: 'At least one of Google Scholar URL or ORCID URL is required' }
);

export type ExpertFormData = z.infer<typeof ExpertFormSchema>;
```

---

## Phase 2: Services Layer

### 2.1 Create `src/services/orcidService.ts`

- `extractOrcidId(url: string): string | null` — Parse ORCID ID from URL
- `getProfile(orcidId: string): Promise<OrcidProfile | null>` — Fetch from ORCID public API (`https://pub.orcid.org/v3.0/{id}`)
- `isValidOrcidUrl(url: string): boolean`

Response schema:
```typescript
export type OrcidProfile = {
  orcidId: string;
  name: string;
  biography?: string;
  keywords?: string[];
  country?: string;
  institution?: string;
};
```

### 2.2 Create `src/services/serpapiService.ts`

- `extractScholarId(url: string): string | null` — Already exists in scholarService.ts, merge/extend
- `getProfile(scholarId: string): Promise<ScholarProfile | null>` — Fetch via SerpAPI (`https://serpapi.com/search?engine=google_scholar_author&author_id={id}&api_key={key}`)
- Note: SerpAPI key stored in `.env` as `VITE_SERPAPI_KEY`

### 2.3 Refactor `src/services/scholarService.ts`

Move `extractScholarId`, `isValidScholarUrl` into the new serpapiService and either keep scholarService as thin wrapper or merge entirely. Keep backward compat.

### 2.4 Update `src/services/apiService.ts`

- Update `addExpert()` to include `import_metadata` in the insert
- Update `toExpertData()` to map `import_metadata`

### 2.5 Create `src/services/importValidator.ts`

Central validation service that:
1. Validates URL formats for Google Scholar and ORCID
2. If format valid, calls respective API
3. Returns structured validation results with profile data if found
4. Tracks what fields were auto-filled vs. user-entered

---

## Phase 3: Store & Types Updates

### 3.1 Update `src/store/appStore.ts`

Add new state:
```typescript
ui: {
  // existing...
  isAddExpertOpen: boolean;
  expertImportDialog: {
    isOpen: boolean;
    importedData: Partial<ExpertData> | null;
    existingData: Partial<ExpertData> | null;
  } | null;
}

// New actions:
setAddExpertOpen: (open: boolean) => void;
setExpertImportDialog: (dialog: AppState['ui']['expertImportDialog']) => void;
```

### 3.2 Update `src/utils/fuzzySearch.ts`

Add `email` to expert search keys:
```typescript
export const filterExpertsBySearch = (experts: ExpertData[], searchTerm: string) => filterWithFuse(experts, searchTerm, {
  keys: [
    { name: 'name', weight: 0.28 },
    { name: 'institution', weight: 0.18 },
    { name: 'headline', weight: 0.16 },
    { name: 'expertiseSubtitle', weight: 0.12 },
    { name: 'expertise', weight: 0.1 },
    { name: 'country', weight: 0.08 },
    { name: 'email', weight: 0.05 },  // NEW
    { name: 'bio', weight: 0.03 },
  ],
});
```

### 3.3 Update `src/types/database.ts`

Add `import_metadata` to `ExpertRow` and `ExpertInsert`.

---

## Phase 4: Components

### 4.1 Create `src/components/modals/AddExpertModal.tsx` (enhanced modal)

**Structure:**
- Uses existing `Modal` component with `size="lg"`
- Tab/form layout with react-hook-form + zod (ExpertFormSchema)
- Two-column layout for fields

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | ✅ | min 1, max 200 |
| Institution | text | ✅ | min 1 |
| Country | text | ✅ | min 1 |
| Degree | text | ❌ | — |
| Headline | text | ❌ | min 10, max 200 |
| Bio | textarea | ✅ | min 1, max 2000 |
| Expertise | tag input | ✅ | array of strings |
| Publications | number | ❌ | int >= 0 |
| Email | email | ✅ | valid email format |
| LinkedIn | url | ❌ | valid URL |
| Scopus | url | ❌ | valid URL |
| ORCID | url | ❌* | valid URL + API validation |
| Google Scholar | url | ❌* | valid URL + API validation |

*\*At least one of ORCID or Google Scholar required*

**Behavior:**
1. User fills in fields
2. On URL blur for ORCID/Google Scholar → validate format immediately
3. If format valid → show "Validate" button → calls API → shows preview of fetched data
4. If API returns data → presents field-by-field comparison dialog:
   - For each field: current (user-entered) vs. imported value
   - Checkbox per field to select which imported values to apply
   - Default: all checked
5. On submit:
   - Validate cross-field constraint (email + at least one social URL)
   - Call `apiService.addExpert()` with `import_metadata` set to `{source, importedAt, url, fields}`
   - Call `store.addExpert()` for local state
6. Success → status message + close modal + refresh expert list

**Source tracking:**
```typescript
importMetadata: {
  source: 'manual' | 'google_scholar' | 'orcid',
  importedAt: '2026-05-14T...',
  url: 'https://...',
  validatedFields: ['name', 'institution', 'country', ...],
}
```

### 4.2 Create `src/components/modals/ImportConflictDialog.tsx`

Reusable dialog component for field-by-field conflict resolution.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `existing: Record<string, { label: string; value: string }[]>`
- `imported: Record<string, { label: string; value: string }[]>`
- `onConfirm: (selectedFields: string[]) => void`

**Renders:**
- Table with column: Field | Current Value | Imported Value | Use Imported? (checkbox)
- Select All / Deselect All toggle
- Cancel / Confirm buttons

### 4.3 Inline Expert Creation — Update `src/components/modals/AddProjectModal.tsx`

**Add expandable section after the expert dropdown:**

```
[Leading Expert *]
[dropdown of existing experts]
┌─────────────────────────────────────────────┐
│ [+] Create new expert                       │
│  (click to expand inline)                   │
└─────────────────────────────────────────────┘
```

**When expanded:**
```
[Leading Expert *]
[dropdown of existing experts]

┌─────────────────────────────────────────────┐
│ [─] Create new expert                       │
│                                             │
│ Name*: [________]  Institution*: [________] │
│ Country*: [________]  Email*: [________]    │
│ Google Scholar: [________________]          │
│ ORCID: [________________]                   │
│ Bio*: [___________________________]         │
│                                             │
│ [Create Expert]  [Cancel]                   │
└─────────────────────────────────────────────┘
```

**Behavior:**
1. User types email + at least one social URL
2. On submit → validates locally
3. On success → auto-select the new expert in dropdown, show brief green confirmation, collapse the section
4. Uses the same `ExpertFormSchema` validation
5. Simpler version of full modal (fewer fields) — just the essentials
6. Calls same `apiService.addExpert()` with source='manual'

### 4.4 Update `src/components/map/MapSidebar.tsx`

Add **"+ Add Expert"** button alongside existing buttons:
```tsx
<button onClick={onAddExpert} ...>
  + Add Expert
</button>
```

### 4.5 Update `src/App.tsx`

- Add state for `isAddExpertOpen` and toggle functions
- Lazy-import `AddExpertModal`
- Wire up `MapSidebar.onAddExpert` prop
- Conditionally render `AddExpertModal` (same pattern as AddProjectModal)

---

## Phase 5: Hooks

### 5.1 Create `src/hooks/useExpertSubmission.ts`

```typescript
export const useExpertSubmission = (setStatusMessage: (msg: StatusMessage) => void) => {
  const submitExpert = useCallback(async (formData: ExpertFormData): Promise<ExpertData> => {
    // 1. Validate form
    // 2. Call optional API validation (ORCID/Google Scholar)
    // 3. Build import_metadata
    // 4. Call apiService.addExpert()
    // 5. Call store.addExpert()
    // 6. Return new expert
  }, []);

  return { submitExpert };
};
```

### 5.2 Create `src/hooks/useImportValidation.ts`

```typescript
export const useImportValidation = () => {
  const validateOrcidUrl = async (url: string): Promise<ValidationResult> => {};
  const validateScholarUrl = async (url: string): Promise<ValidationResult> => {};
  const validateAll = async (data: { orcid?: string; googleScholar?: string }): Promise<ValidationResult[]> => {};
};
```

---

## Phase 6: Location & File Import Features

### 6.1 File Upload Component — `src/components/modals/FileUploadModal.tsx` (optional)

If file-based import is needed (GeoJSON/KML for location data from experts/projects).

**Specs:**
- Max file size: 5 MB
- Accepted formats: `.geojson`, `.json`, `.kml`, `.gpx`
- Error handling: specific reason + format hint + example file download link
- Coordinate simplification: Douglas-Peucker algorithm, max 200 points per polygon
- Auto-circle generation for points: 25 km radius, 32-point polygon approximation, not user-configurable
- Preview imported geometry on map before confirming

### 6.2 Coordinate Simplification Utility — `src/utils/geometry.ts`

```typescript
export function simplifyPolygon(
  coords: [number, number][],
  maxPoints: number = 200,
  tolerance?: number
): [number, number][];

export function generateAutoCircle(
  center: [number, number],
  radiusKm: number = 25,
  numPoints: number = 32
): [number, number][];
```

**Douglas-Peucker implementation** with:
- Adaptive tolerance (auto-calculate if not provided)
- Hard cap at 200 points
- Preserve first/last point (closed polygon)

---

## Phase 7: Testing

### 7.1 Unit Tests

| File | Tests |
|------|-------|
| `src/__tests__/services/orcidService.test.ts` | URL parsing, API response handling, error states |
| `src/__tests__/services/serpapiService.test.ts` | Scholar ID extraction, API response handling |
| `src/__tests__/utils/geometry.test.ts` | Douglas-Peucker simplification, auto-circle generation, edge cases |
| `src/__tests__/types/expert.test.ts` | ExpertFormSchema validation (email required, cross-field validation) |
| `src/__tests__/components/modals/AddExpertModal.test.tsx` | Form rendering, validation messages, submission flow |
| `src/__tests__/components/modals/ImportConflictDialog.test.tsx` | Field comparison rendering, checkbox selection, confirm/cancel |
| `src/__tests__/hooks/useExpertSubmission.test.ts` | Submission flow, API integration, error handling |
| `src/__tests__/hooks/useImportValidation.test.ts` | URL validation, API calls, result formatting |

### 7.2 Integration Tests

| File | Tests |
|------|-------|
| `src/__tests__/AddExpertModal.integration.test.tsx` | Full flow: open modal → fill form → validate URL → import conflict dialog → submit → expert appears in list |
| `src/__tests__/AddProjectExpert.integration.test.tsx` | Inline expert creation in project form → auto-select → project submission with new expert |
| `src/__tests__/FileUpload.integration.test.tsx` | File upload → geometry parsing → simplification → preview → save |

### 7.3 E2E Tests (manual or Playwright Cypress)

| Scenario | Steps |
|----------|-------|
| Full expert creation flow | Open modal → fill with ORCID URL → validate → confirm conflict → submit → verify card |
| Inline expert + project | Open project modal → expand expert section → create expert → auto-select → complete project |
| File import with auto-circle | Upload point GeoJSON → verify 32-point circle at 25km → simplify polygon → save |

### 7.4 Test Data

Add mock profiles to `src/services/__mocks__/`:
- Mock ORCID API responses
- Mock SerpAPI responses
- Sample GeoJSON/KML files for upload tests

---

## Phase 8: Implementation Order

```
Week 1:
  └─ Phase 1: DB schema + types (1 day)
  └─ Phase 2: Services — orcidService, serpapiService, importValidator (2 days)
  └─ Phase 3: Store + types updates (1 day)
  └─ Phase 4.1: AddExpertModal core form (2 days)

Week 2:
  └─ Phase 4.2: ImportConflictDialog (1 day)
  └─ Phase 4.3: Inline expert in AddProjectModal (1 day)
  └─ Phase 4.4-4.5: MapSidebar + App wiring (1 day)
  └─ Phase 5: Hooks (1 day)
  └─ Phase 6: Geometry utils + file import (2 days)
  └─ Phase 7: Tests (2 days)
```

---

## Files Summary

### New Files (8)
| File | Purpose |
|------|---------|
| `src/components/modals/AddExpertModal.tsx` | Enhanced expert creation modal |
| `src/components/modals/ImportConflictDialog.tsx` | Field-by-field conflict resolver |
| `src/services/orcidService.ts` | ORCID API integration |
| `src/services/serpapiService.ts` | SerpAPI integration for Google Scholar |
| `src/services/importValidator.ts` | Centralized import validation logic |
| `src/hooks/useExpertSubmission.ts` | Expert submission hook |
| `src/hooks/useImportValidation.ts` | Import validation hook |
| `src/utils/geometry.ts` | Douglas-Peucker + auto-circle utils |

### Modified Files (10)
| File | Changes |
|------|---------|
| `supabase/schema-v3-draft.sql` | email NOT NULL + CHECK, import_metadata jsonb |
| `src/types/database.ts` | Update ExpertRow/ExpertInsert |
| `src/types/expert.ts` | Email required, add ExpertFormSchema with cross-field validation |
| `src/store/appStore.ts` | Add isAddExpertOpen, expertImportDialog, actions |
| `src/services/apiService.ts` | Update addExpert, toExpertData for import_metadata |
| `src/services/scholarService.ts` | Thin wrapper or merge into serpapiService |
| `src/utils/fuzzySearch.ts` | Add email to expert search keys |
| `src/components/modals/AddProjectModal.tsx` | Inline expert creation section |
| `src/components/map/MapSidebar.tsx` | Add Expert button |
| `src/App.tsx` | Wire up AddExpertModal |

---

## Open Questions / Future Considerations

- SerpAPI key management: needs `VITE_SERPAPI_KEY` in `.env` — document for deployment
- ORCID API is rate-limited but public (no key needed) — add retry/backoff
- File upload modal: confirm whether separate modal or integrated into project/expert upload
- Example file download: need to host a sample .geojson file in `/public/`
