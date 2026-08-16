# Videos Category Pills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain text `Chip` category selector in `VideosPage.js` with icon+count pills, guarantee the "Meditaciones" category always sorts first, and add subtle hover polish to video cards — all responsive.

**Architecture:** Two pure helper functions (`normalizeName`, `getCategoryIcon`, `sortCategories`) plus one new local component (`CategoryPill`) added directly inside `src/pages/videos/VideosPage.js`, following the existing pattern where `VideoThumbnail` already lives in that same file. Styling lives in `src/styles/VideosPage.css`, extending the existing rules instead of introducing a new stylesheet.

**Tech Stack:** React (function components, hooks), PrimeReact (`ScrollPanel`, `DataView`), PrimeIcons (`pi pi-*`), plain CSS (no CSS-in-JS in this codebase).

## Global Constraints

- No backend changes. Category names keep coming from `video.carpeta` exactly as returned by `GET /api/video/lista`.
- No changes to `VideoPlayer` or `VideoThumbnail` internals.
- Must preserve existing responsive behavior: horizontal scroll via `ScrollPanel` on all viewport sizes, and the existing `@media (max-width: 767px)` breakpoint pattern in `VideosPage.css`.
- This codebase has no established test coverage for page components (only CRA's default boilerplate `src/misc/App.test.js` exists). Do not introduce new Jest/RTL infra for this change — verification is manual, per the approved spec's Testing section (`docs/superpowers/specs/2026-08-16-videos-category-pills-design.md`).
- Real category folder names on the server today: `Automan`, `Meditaciones`, `Peliculas`, `Viajeros en el tiempo`.

---

### Task 1: Add `normalizeName`, `getCategoryIcon`, and `sortCategories` helpers

**Files:**
- Modify: `src/pages/videos/VideosPage.js` (add helpers above the `VideoThumbnail` component, after the imports block ending at line 15)

**Interfaces:**
- Produces: `normalizeName(name: string): string` — lowercase, accents stripped.
- Produces: `getCategoryIcon(name: string): string` — returns a PrimeIcons class suffix like `"pi-moon"` (without the leading `"pi "`).
- Produces: `sortCategories(names: string[]): string[]` — new array, "Meditaciones"-like names first, stable order otherwise.
- Consumes: nothing (pure functions, no external state).

- [ ] **Step 1: Add the helper functions**

Insert this block in `src/pages/videos/VideosPage.js` right after the existing imports (after line 15, before the `VideoThumbnail` component definition on line 17):

```javascript
const normalizeName = (name) =>
  (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const CATEGORY_ICON_RULES = [
  { match: "medita", icon: "pi-moon" },
  { match: "pelicula", icon: "pi-video" },
  { match: "tiempo", icon: "pi-clock" },
  { match: "auto", icon: "pi-android" },
];
const DEFAULT_CATEGORY_ICON = "pi-folder";

const getCategoryIcon = (name) => {
  const normalized = normalizeName(name);
  const rule = CATEGORY_ICON_RULES.find((r) => normalized.includes(r.match));
  return rule ? rule.icon : DEFAULT_CATEGORY_ICON;
};

const sortCategories = (names) =>
  [...names].sort((a, b) => {
    const aIsMedita = normalizeName(a).includes("medita");
    const bIsMedita = normalizeName(b).includes("medita");
    if (aIsMedita && !bIsMedita) return -1;
    if (!aIsMedita && bIsMedita) return 1;
    return 0;
  });
```

- [ ] **Step 2: Manual sanity check via Node REPL**

Run from `docucloudfront/`:

```bash
node -e "
const normalizeName = (name) => (name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const CATEGORY_ICON_RULES = [
  { match: 'medita', icon: 'pi-moon' },
  { match: 'pelicula', icon: 'pi-video' },
  { match: 'tiempo', icon: 'pi-clock' },
  { match: 'auto', icon: 'pi-android' },
];
const DEFAULT_CATEGORY_ICON = 'pi-folder';
const getCategoryIcon = (name) => {
  const normalized = normalizeName(name);
  const rule = CATEGORY_ICON_RULES.find((r) => normalized.includes(r.match));
  return rule ? rule.icon : DEFAULT_CATEGORY_ICON;
};
const sortCategories = (names) => [...names].sort((a, b) => {
  const aIsMedita = normalizeName(a).includes('medita');
  const bIsMedita = normalizeName(b).includes('medita');
  if (aIsMedita && !bIsMedita) return -1;
  if (!aIsMedita && bIsMedita) return 1;
  return 0;
});
console.log(['Automan','Meditaciones','Peliculas','Viajeros en el tiempo'].map(n => [n, getCategoryIcon(n)]));
console.log(sortCategories(['Automan','Meditaciones','Peliculas','Viajeros en el tiempo']));
"
```

Expected output:
```
[
  [ 'Automan', 'pi-android' ],
  [ 'Meditaciones', 'pi-moon' ],
  [ 'Peliculas', 'pi-video' ],
  [ 'Viajeros en el tiempo', 'pi-clock' ]
]
[ 'Meditaciones', 'Automan', 'Peliculas', 'Viajeros en el tiempo' ]
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/videos/VideosPage.js
git commit -m "feat(videos): add category icon and sort helpers"
```

---

### Task 2: Add `CategoryPill` component

**Files:**
- Modify: `src/pages/videos/VideosPage.js` (add component after the helpers from Task 1, before `VideosPage` itself)

**Interfaces:**
- Consumes: `getCategoryIcon` from Task 1.
- Produces: `CategoryPill` component with props `{ label: string, icon: string, count: number, active: boolean, onClick: () => void }`, rendering a `<button className="category-pill ...">`.

- [ ] **Step 1: Add the component**

Insert directly after the helpers added in Task 1 (still before `const VideosPage = () => {`):

```javascript
const CategoryPill = ({ label, icon, count, active, onClick }) => (
  <button
    type="button"
    className={`category-pill ${active ? "category-pill-active" : ""}`}
    onClick={onClick}
  >
    <i className={`pi ${icon}`} aria-hidden="true" />
    <span className="category-pill-label">{label}</span>
    <span className="category-pill-count">{count}</span>
  </button>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/videos/VideosPage.js
git commit -m "feat(videos): add CategoryPill component"
```

---

### Task 3: Wire sorting + `CategoryPill` into `VideosPage`

**Files:**
- Modify: `src/pages/videos/VideosPage.js:149` (the `folderNames` declaration) and `:243-263` (the category chip row inside the JSX return)

**Interfaces:**
- Consumes: `sortCategories`, `CategoryPill`, `getCategoryIcon` from Tasks 1–2. `groupedVideos`, `selectedCategory`, `setSelectedCategory`, `setActiveVideoUrl`, `setFirst` already exist in `VideosPage` (lines 109–116).
- Produces: `folderNames` is now sorted (Meditaciones-like categories first); the rendered pill row replaces the `Chip` row.

- [ ] **Step 1: Sort `folderNames`**

Replace this line (currently line 149):

```javascript
  const folderNames = Object.keys(groupedVideos);
```

with:

```javascript
  const folderNames = sortCategories(Object.keys(groupedVideos));
```

No other change needed — `fetchVideos` already does `setSelectedCategory(firstCategory)` using `Object.keys(newGroupedVideos)[0]` inside the fetch callback (line 133), which reads from `groupedVideos` directly, not from this `folderNames` render variable. That must also be sorted so the initial selection lands on Meditaciones. Update `fetchVideos` too — replace this block (lines 132–136):

```javascript
      setGroupedVideos(newGroupedVideos);
      const firstCategory = Object.keys(newGroupedVideos)[0];
      if (firstCategory && !selectedCategory) {
        setSelectedCategory(firstCategory);
      }
```

with:

```javascript
      setGroupedVideos(newGroupedVideos);
      const firstCategory = sortCategories(Object.keys(newGroupedVideos))[0];
      if (firstCategory && !selectedCategory) {
        setSelectedCategory(firstCategory);
      }
```

- [ ] **Step 2: Replace the `Chip` row with `CategoryPill`**

Replace this block (currently lines 245–260):

```javascript
                {folderNames.map((folderName) => (
                  <Chip
                    key={folderName}
                    label={folderName}
                    className={`p-mr-2 p-mb-2 ${
                      selectedCategory === folderName ? "active-category-chip" : "p-chip-sm"
                    }`}
                    onClick={() => {
                      setSelectedCategory(folderName);
                      setActiveVideoUrl(null);
                      setFirst(0);
                    }}
                    style={{ cursor: "pointer", padding: "0.8rem 1rem" }}
                  />
                ))}
```

with:

```javascript
                {folderNames.map((folderName) => (
                  <CategoryPill
                    key={folderName}
                    label={folderName}
                    icon={getCategoryIcon(folderName)}
                    count={groupedVideos[folderName]?.length || 0}
                    active={selectedCategory === folderName}
                    onClick={() => {
                      setSelectedCategory(folderName);
                      setActiveVideoUrl(null);
                      setFirst(0);
                    }}
                  />
                ))}
```

- [ ] **Step 3: Remove the now-unused `Chip` import**

In the imports block (line 5), remove:

```javascript
import { Chip } from "primereact/chip";
```

- [ ] **Step 4: Verify no leftover references**

```bash
grep -n "Chip" src/pages/videos/VideosPage.js
```

Expected: no output (empty).

- [ ] **Step 5: Commit**

```bash
git add src/pages/videos/VideosPage.js
git commit -m "feat(videos): wire CategoryPill and category sorting into VideosPage"
```

---

### Task 4: Style the pills, responsive breakpoint, and card hover polish

**Files:**
- Modify: `src/styles/VideosPage.css`

**Interfaces:**
- Consumes: class names `category-pill`, `category-pill-active`, `category-pill-label`, `category-pill-count` from Task 2; existing class `video-item-card-content` (already defined at line 200 of the current file).
- Produces: no new interfaces — pure CSS.

- [ ] **Step 1: Add pill styles**

Append to the end of `src/styles/VideosPage.css`:

```css
.category-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    min-height: 40px;
    border: 1px solid var(--surface-border);
    border-radius: 999px;
    background: var(--surface-100);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}

.category-pill:hover {
    background: var(--surface-200);
}

.category-pill-active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-600, var(--primary-color)));
    border-color: var(--primary-color);
    color: var(--primary-color-text);
    font-weight: bold;
    box-shadow: var(--shadow-2);
}

.category-pill-label {
    white-space: nowrap;
}

.category-pill-count {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
}

.category-pill-active .category-pill-count {
    background: rgba(255, 255, 255, 0.28);
}

.video-item-card-content {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.video-item-card-content:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-4);
}
```

- [ ] **Step 2: Add the responsive rule**

In `src/styles/VideosPage.css`, find the existing `@media (max-width: 767px)` block (currently lines 114–137, ending with the `.chips-container` rule). Add this rule inside that same block, right after the existing `.chips-container` rule and before the block's closing `}`:

```css
    .category-pill {
        padding: 0.45rem 0.75rem;
        font-size: 0.85rem;
        min-height: 40px;
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/VideosPage.css
git commit -m "style(videos): add category pill styles, responsive rule, and card hover polish"
```

---

### Task 5: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Build check**

```bash
cd docucloudfront
npm run build
```

Expected: `Compiled with warnings.` (existing pre-existing eslint warnings unrelated to this change) or clean compile — no new errors, no `Chip`/`primereact/chip` reference errors.

- [ ] **Step 2: Visual check — desktop**

```bash
npm start
```

Open `http://localhost:3000/VideosPage` (or whatever port CRA picks) in a desktop-width browser window. Confirm:
- Category row shows pills with icon + label + count, not plain text chips.
- "Meditaciones" is the first pill and is selected/active on page load.
- Active pill has the gradient/highlighted style; inactive pills are neutral.
- Icons match: Meditaciones → moon, Automan → android, Peliculas → video, "Viajeros en el tiempo" → clock.
- Hovering a video card lifts it slightly with a shadow.

- [ ] **Step 3: Visual check — mobile width**

In the same browser, use devtools responsive mode at ≤767px width (e.g. 375px). Confirm:
- Pills are smaller (reduced padding/font per the media query) but still comfortably tappable.
- The pill row still scrolls horizontally via `ScrollPanel` without wrapping or overflowing the viewport.
- Video grid still reflows to the existing mobile column layout (unchanged from before this work).

- [ ] **Step 4: Final commit (if any fixes were needed during verification)**

```bash
git add -A
git commit -m "fix(videos): address issues found in manual verification"
```

Skip this step if no fixes were needed.
