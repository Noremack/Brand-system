# Adobe InDesign Brand System Engine — Queensland Government Design System (QGDS)

A high-performance, modular ExtendScript (ES3) framework designed to automatically inject dynamic brand layout rules, typography hierarchies, master pages, swatches, and vector artwork into Adobe InDesign documents (`.indd`).

---

## 1. Architectural Highlights

To bypass the notorious performance bottlenecks of the InDesign ExtendScript DOM, this framework utilizes a **Hybrid Architecture**:

```
                                  ┌────────────────────────┐
                                  │   brand-tokens.json    │
                                  │ (Single Source of Truth│
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          ┌───────────────────────┐                       ┌───────────────────────┐
          │  Pre-compiled Cache   │                       │  Dynamic Layout Engine│
          │     (templates/)      │                       │ (modules/06 & 07)     │
          ├───────────────────────┤                       ├───────────────────────┤
          │ 147+ Object, Table,   │                       │ • Physical margins    │
          │ and Cell styles baked │                       │ • Column gutters      │
          │ into hidden .indt     │                       │ • Stratified layers   │
          │ master templates.     │                       │ • Master spreads      │
          │ Sub-second hydration! │                       │ • Scaled vector footers│
          └───────────┬───────────┘                       └───────────┬───────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │   Active InDesign Doc   │
                                 │  (Atomic app.doScript)  │
                                 └─────────────────────────┘
```

1. **Pre-compiled Format Templates (`templates/`):** Generating 147+ complex Object, Table, and Cell styles via ExtendScript DOM API takes 30–60+ seconds per document. The `Update Brand Templates.jsx` utility pre-bakes these into `.indt` master templates (with permutation caching for Color Spaces and Themes). At runtime, `10-brand-engine.jsxinc` imports them in sub-second execution (<150ms).
2. **Dynamic Geometry Calculation:** Physical page margins, column gutters, headers, and footers are calculated mathematically at runtime relative to document dimensions (`analyzeDocumentMetrics`) and baseline typography (`sysUtils.scaleMm`).
3. **Atomic Transaction Safety:** All DOM mutations are encapsulated within `app.doScript()` utilizing `UndoModes.ENTIRE_SCRIPT`, providing instant single-click undo (`Ctrl+Z`) of the entire brand system application.
4. **Strict ExtendScript ES3 Compliance:** 100% compliant with Adobe's ES3 ExtendScript engine (compatible with CS6 through CC 2026+).

---

## 2. Root Scripts Inventory

The repository provides six specialized user-facing and batch automation entry points in the root directory:

| Script | Role | Execution Mode | Description |
| :--- | :--- | :--- | :--- |
| **`Apply Brand System.jsx`** | User Dashboard | Interactive UI | Material 3-inspired ScriptUI dashboard for configuring and applying brand tokens, typography, swatches, margins, and footers. |
| **`Update Brand Templates.jsx`** | Cache Compiler | Interactive / Silent | Re-compiles format `.indt` master templates and `cache-manifest.json` into the `templates/` folder. |
| **`Batch Generate Base Templates.jsx`** | Template Generator | Batch Automation | Batch-generates blank `.indt` templates, standard `.indd` documents, multi-page PDF catalogs, and JPEG preview covers across all page sizes. |
| **`Export Custom Document.jsx`** | Packaging Utility | Interactive UI | Non-destructively packages bespoke InDesign documents through the distribution pipeline (INDT, INDD, PDF catalog, JPEG spreads). |
| **`Extract Config Information.jsx`** | Token Harvester | Interactive Tool | Inspects selected InDesign frames/text and reverse-engineers mathematical scale powers, corner radii, and color values for `brand-tokens.json`. |
| **`Uninstall Brand System.jsx`** | Sanitizer | One-Click Utility | Safely purges all custom styles, swatches, and master spreads from an active document, restoring InDesign default styling. |

---

## 3. Modular Codebase (11 Modules)

Engine logic is divided into 11 single-responsibility modules in [`modules/`](file:///c:/Users/Noremac/HTML%20Exporter/InDesign%20Brand%20System/modules):

```text
InDesign Brand System/modules/
├── 01-config.jsxinc           # System constants, fallback metrics & token containers
├── 02-utilities.jsxinc        # ES3 polyfills, sysUtils scaling math, safeValue & Logger
├── 03-token-loader.jsxinc     # Multi-tier JSON loader resolving brand-tokens.json
├── 04-cache-manager.jsxinc    # In-memory DOM element cache (swatches, styles, lists)
├── 05-style-builder.jsxinc    # Compiles tokens into native styles with QGDS exportTagMaps
├── 06-layout-engine.jsxinc    # Document geometry analysis, margins & master spreads
├── 07-asset-injector.jsxinc   # Vector asset placement, embedding & specimen injection
├── 08-cleanup-protocol.jsxinc # Document sanitization and brand reset routines
├── 09-ui-utils.jsxinc         # ScriptUI helpers, format scanning & preference persistence
├── 10-brand-engine.jsxinc     # Master orchestrator, template hydration & atomic transactions
└── 11-reports.jsxinc          # Markdown/JSON publishing diagnostics & log file rotation
```

### Module Responsibilities & Contracts

- **`01-config.jsxinc`**: Defines core calibration constants (`PT_TO_MM = 0.352778`, `CACHE_VERSION = "2.4.0"`), fallback metrics, and empty containers hydrated at runtime.
- **`02-utilities.jsxinc`**: Implements ES3 polyfills (`Array.indexOf`, `forEach`, `map`, `filter`, `Object.keys`), responsive dimension math (`sysUtils.scaleMm`), modular type scaling (`sysUtils.calcType`), and execution telemetry (`Logger`).
- **`03-token-loader.jsxinc`**: Evaluates a multi-tier search hierarchy (document directory override $\rightarrow$ script bundle directory $\rightarrow$ InDesign Scripts Panel $\rightarrow$ embedded bundle payload) and hydrates `config`.
- **`04-cache-manager.jsxinc`**: Provides high-speed RAM caching for Swatches, ParagraphStyles, CharacterStyles, CellStyles, and NumberingLists, reducing DOM queries from $O(N)$ to $O(1)$.
- **`05-style-builder.jsxinc`**: Generates style definitions for Paragraphs, Characters, Object containers, and Tables. Associates QGDS semantic export tagging (`exportTagMap: { exportTag: "...", exportClass: "..." }`) with each style.
- **`06-layout-engine.jsxinc`**: Analyzes document dimensions against `pageMatrix`, creates and re-orders required layers (`Background`, `Foreground`, etc.), and creates master spreads (`A-Cover`, `B-Content`, `C-Back`).
- **`07-asset-injector.jsxinc`**: Resolves vector assets (SVG/EPS), measures native bounding boxes, places them onto master pages, and unlinks external references (`Link.unlink()`) to produce self-contained templates.
- **`08-cleanup-protocol.jsxinc`**: Executes bottom-up style and swatch deletion while reassigning frames to `[Basic Paragraph]` to avoid cascading deletion errors.
- **`09-ui-utils.jsxinc`**: Serializes user preferences to `Folder.userData + "/BrandSystem_Prefs.jsx"` and provides ScriptUI layout helpers.
- **`10-brand-engine.jsxinc`**: Master coordinator wrapping all operations inside atomic `app.doScript()` transactions. Validates template cache manifests and falls back to dynamic compilation when needed.
- **`11-reports.jsxinc`**: Produces structured Markdown and JSON publishing diagnostics and manages automated 512 KB log rotation for `BrandSystem_ContinualLog.txt`.

---

## 4. Single Source of Truth: `brand-tokens.json`

All visual styling, color swatches, typography scales, page formats, and layer rules are declared in [`brand-tokens.json`](file:///c:/Users/Noremac/HTML%20Exporter/InDesign%20Brand%20System/brand-tokens.json).

### Token Schema Structure

```json
{
  "PT_TO_MM": 0.352778,
  "pageMatrix": [
    {
      "name": "A4",
      "shortEdge": 210,
      "longEdge": 297,
      "margin": 15,
      "gutter": 5,
      "baseFont": 11,
      "type": "document",
      "orientation": ["portrait", "landscape"],
      "masters": ["Cover", "Content", "Back"]
    }
  ],
  "layerMatrix": [
    { "name": "Background", "color": "LIGHT_GRAY", "aliases": [] },
    { "name": "Foreground", "color": "BLUE", "aliases": ["Layer 1"] }
  ],
  "typographyMatrix": {
    "universalReferencePt": 12,
    "display": { "scale": 4.5, "space": 1.25 },
    "h1": { "scale": 3.0, "space": 1.0 },
    "h2": { "scale": 2.0, "space": 0.8 },
    "h3": { "scale": 1.2, "space": 0.6 },
    "h4": { "scale": 0.6, "space": 0.4 },
    "small": { "scale": -0.8, "space": 0.3 }
  },
  "designTokens": {
    "layout": { "cornerRadiusLargeMm": 8, "cornerRadiusMediumMm": 4, "cornerRadiusSmallMm": 2 },
    "table": { "cellPaddingRatio": 0.4, "borderWeightRatio": 0.75, "borderThickWeightRatio": 1.5 },
    "list": { "iconWidthMm": 7, "iconGapMm": 2, "bulletIndentRatio": 1.0, "numberIndentRatio": 1.75 }
  },
  "colors": [
    { "name": "Blue - Primary", "space": "RGB", "value": [0, 51, 102], "cmykValue": [100, 75, 10, 35] }
  ]
}
```

### Critical Rule: Rebuilding Templates After Token Changes

Because the engine uses a Hybrid Architecture, any changes made to `brand-tokens.json` or `modules/` **will not appear in your documents** until the style cache is rebuilt.

> [!IMPORTANT]
> Always run **`Update Brand Templates.jsx`** from the InDesign Scripts Panel after modifying `brand-tokens.json` or styling modules!

---

## 5. Pre-compiled Templates Directory (`templates/`)

All cached `.indt` format templates and companion metadata reside in [`templates/`](file:///c:/Users/Noremac/HTML%20Exporter/InDesign%20Brand%20System/templates):

- **Template Naming Convention:**
  `BrandSystem_{FormatName}_{ColorMode}_{Theme}_{StyleMode}.indt`
  *(e.g., `BrandSystem_A4_RGB_Blue_Standard.indt`)*
- **Cache Manifest:**
  `templates/cache-manifest.json` tracks cache version, generation timestamp, color mode, and primary theme.
- **Cache Verification:**
  `10-brand-engine.jsxinc` checks `cache_version` against `CACHE_VERSION`. If mismatched or corrupt, it automatically triggers `Update Brand Templates.jsx` in silent mode or falls back to dynamic generation.

---

## 6. Installation & User Workflow

### Step 1: Install into Scripts Panel
1. Open Adobe InDesign.
2. Open the Scripts panel (`Window > Utilities > Scripts`).
3. Right-click the **User** folder and select **Reveal in Explorer** (Windows) or **Reveal in Finder** (macOS).
4. Place the `InDesign Brand System` folder into the `Scripts Panel` directory.

### Step 2: Apply to a Document
1. Open your target document in InDesign.
2. In the Scripts panel, double-click **`Apply Brand System.jsx`**.
3. Select your desired execution scope, theme, and color mode.
4. Click **Apply Brand System**.
5. All styles, margins, layers, and master spreads are injected atomically.

---

## 7. Quality Assurance & Developer Tooling

### Automated Test Suite
Run the isolated pure-function Node.js test suite:
```bash
node tests/run-all-tests.js
```
*Validates 147 tests across token loading, scaling math, modular pipelines, report generation, and QGDS export tag mapping.*

### ExtendScript (ES3) Static Validator
Scan all codebase files for modern syntax leaks:
```bash
node tools/scan-es3.js
```
*Scans all `.jsx` and `.jsxinc` files for `let`, `const`, arrow functions, template literals, and unquoted ES3 reserved keywords.*

### Monolithic Bundle Assembly
Verify SHA-256 module checksums, validate `brand-tokens.json` schema, build standalone distribution bundle, and synchronize to InDesign Scripts Panel:
```bash
node tools/assemble.js
```
*Output: `dist/InDesign Brand System.bundle.jsx` (standalone zero-dependency bundle).*