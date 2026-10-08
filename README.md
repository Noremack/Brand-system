# Adobe InDesign Brand System Engine

A high-performance, modular ExtendScript (JSX) framework designed to automatically inject dynamic brand layout rules, typography hierarchies, master pages, and vector assets into Adobe InDesign documents.

## 🏗 Architecture

To bypass the notorious performance bottlenecks of the InDesign DOM, this framework utilizes a **Hybrid Architecture**:

1. **Template-Driven Styles:** Heavy, complex Object and Table styles (147+ variations) take too long to generate on the fly. The `Update Brand Templates.jsx` utility pre-bakes these into hidden `.indt` master templates (utilizing permutation caching for Color Spaces and Themes). The core engine dynamically loads them in sub-second execution.
2. **Engine-Driven Layouts:** Structural geometry, such as physical page margins, headers, and footers, are calculated mathematically by the Engine at runtime. This includes fully dynamic bounding box measurements directly from native EPS/SVG files to ensure perfect wrapping.

## ⚡ Core Features

* **SSD Asset Proxying & Embedding:** Fetches network vector assets (SVG/EPS), temporarily proxies them to `Folder.temp` for instant placement, and then embeds them natively via `Link.unlink()` to create 100% standalone distribution templates.
* **Responsive Scaling Metrics:** All base values—fonts, list indents, spacing, corner radiuses, and header heights—are mathematically derived from a `universalReferencePt` using the `sysUtils.scaleMm` module.
* **Batch Generation & PDF Catalogs:** The `Batch Generate Base Templates.jsx` script loops through all configured formats, building both Portrait and Landscape templates with structured categorical folders, cleanly suffixed JPEG previews, and a multi-page PDF catalog showcasing every master spread and footer variant.
* **M3 Dashboard UI:** Features a Material Design 3-inspired tabbed interface for selecting scopes, themes, Dark/Reverse modes, and Color Spaces (RGB vs CMYK).
* **Decoupled Execution Scope:** Apply Margins/Master rules independently from injecting Headers and Footers, allowing you to quickly update layout constraints on existing documents without touching imagery.
* **Granular Injection Control:** Inject master page assets and style specimens entirely independently from generating the core typography and object style sheets.
* **Custom Format Interception:** Evaluates unknown document sizes at runtime and prompts the user for manual margin adjustments to perfectly center unknown ratios.
* **Lazy-Load Caching (`CacheManager`):** Reading Swatch or Style properties in InDesign is an expensive operation. A centralized cache guarantees styles are checked in RAM before querying the DOM.
* **O(1) Garbage Collection:** Injected elements are tagged and tracked. During resets, the engine sweeps `MasterSpread.allPageItems` to guarantee ghost objects are deleted, while aggressively protecting user-created content using `.detach()`.
* **Dark Mode Cascade:** Inverts all necessary text, table zebra-striping, and frame properties automatically based on the selected theme.
* **Undo State Protection:** The entire script is wrapped in `app.doScript` utilizing `UndoModes.ENTIRE_SCRIPT`, allowing the user to `Ctrl+Z` the entire brand system application in one click.
* **Safe Swatch Resolution:** Gracefully handles invalid color allocations (like assigning `"None"` or missing variables) preventing silent pipeline failures when building Tables or UI components.
* **Comprehensive Telemetry:** Features a self-managing `BrandSystem_ContinualLog.txt` outputting deep execution traces, timestamping, and crash diagnostics. Includes auto-archiving when logs exceed 5MB to prevent storage bloat.

## 🔧 Maintenance & Customization

The system is 100% token-driven and modular. All visual attributes, typography, colors, page formats, and style definitions are declared in `brand-tokens.json` as the single source of truth without duplicate hardcoded fallbacks in source code.

**1. How to change Table Border Weights:**
Open `brand-tokens.json`, locate `designTokens.table`, and adjust `borderWeightRatio` or `borderThickWeightRatio`.

**2. How to add a new Page Format:**
Open `brand-tokens.json` and add a new object to the `pageMatrix` array. Ensure you provide the `shortEdge`, `longEdge`, and `margin`.

**3. CRITICAL: Rebuilding Templates**
Because the engine uses a Hybrid Architecture, any changes made to `brand-tokens.json` or `modules/` **will not appear in your documents** until the style cache is rebuilt. **Always run `Update Brand Templates.jsx` from the Scripts Panel after making code changes!**

## 📂 File Structure

* **`Apply Brand System.jsx`** - The M3 Dashboard user-facing entry point. Applies the brand system to the active document.
* **`Update Brand Templates.jsx`** - Utility script. Re-compiles the hidden `.indt` style caches based on UI configuration.
* **`Batch Generate Base Templates.jsx`** - Distribution script. Generates empty ready-to-use `.indt` templates and PDF catalogs for every layout format.
* **`Extract Config Information.jsx`** - Utility script. Reverse-engineers visually styled objects/text and outputs them as properly formatted mathematical scaling algorithms and JSON objects.
* **`Export Custom Document.jsx`** - Packaging script. Processes bespoke InDesign layouts and routes them through the batch generation pipeline (PDFs, JPGs, INDTs) without destroying the active file.
* **`Uninstall Brand System.jsx`** - Nuclear utility. Completely wipes all Brand styles, swatches, and master pages from an active document, leaving only raw unformatted text.
* **`brand-tokens.json`** - **The Brain & Single Source of Truth.** Decoupled design tokens, color swatches, typography scales, format definitions, and declarative style schemas.
* **`module-verification.json`** - Cryptographic SHA-256 integrity manifest for all 11 modules.
* **`modules/`** - Numbered single-responsibility ExtendScript modules:
  * `01-config.jsxinc`: Pure runtime calibration constants and containers (zero hardcoded token duplicates).
  * `02-utilities.jsxinc`: Dimension math, typography scaling, ES3 polyfills, and telemetry Logger.
  * `03-token-loader.jsxinc`: Multi-tier token resolution and hydration (external JSON or standalone bundle embedded payload).
  * `04-cache-manager.jsxinc`: In-memory style and swatch cache.
  * `05-style-builder.jsxinc`: Token-driven compiler generating native styles and QGDS `styleExportTagMaps` directly from `brand-tokens.json`.
  * `06-layout-engine.jsxinc`: Page geometry, margins, layer stratification, and master pages.
  * `07-asset-injector.jsxinc`: Header/footer vector placement and specimen injection.
  * `08-cleanup-protocol.jsxinc`: Document sanitization and brand reset routines.
  * `09-ui-utils.jsxinc`: ScriptUI dashboard layout and preference persistence.
  * `10-brand-engine.jsxinc`: Master orchestrator, cache verification, and atomic transaction handling.
  * `11-reports.jsxinc`: Structured Markdown & JSON publishing diagnostics and log rotation.
* **`templates/`** - Pre-compiled `.indt` format templates and companion `cache-manifest.json` metadata.

## 🚀 Installation & Usage

1. Navigate to your InDesign Scripts panel directory. You can find this inside InDesign by right-clicking the `User` folder in the Scripts panel and selecting **Reveal in Explorer/Finder**.
2. Drop the entire `Brand System` folder into the Scripts Panel directory.
3. Inside InDesign, double-click **Apply Brand System.jsx** to launch the dialog.

## 🛠 Development Constraints

**CRITICAL: NO MODERN JAVASCRIPT (ES6+)**

InDesign ExtendScript utilizes a legacy ES3 environment. You **cannot** use modern JavaScript features natively.
* ❌ No `let` or `const` (Use `var`).
* ❌ No arrow functions `() => {}` (Use `function() {}`).
* ❌ No template literals `` `Hello ${name}` `` (Use string concatenation `"Hello " + name`).
* ❌ No Promises, Classes, or modern Array methods (`map`, `filter`, `forEach`) without strict polyfills.

**Suppressing UI Thrashing:**
Any heavy operations inside `Brand_System_Engine.jsx` must occur between an `app.scriptPreferences.enableRedraw = false;` block, and be strictly placed within a `try / finally` statement to guarantee the UI is re-enabled if the script crashes.