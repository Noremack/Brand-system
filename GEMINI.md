# Gemini Project Guidance: Adobe InDesign Brand System Engine

This document provides technical conventions, development rules, architectural boundaries, and maintenance procedures for developing and maintaining the **InDesign Brand System** scripts.

---

## 1. Project Overview & Architectural Boundaries

The **InDesign Brand System** is an enterprise ExtendScript (ES3) suite designed for Adobe InDesign CS6 through CC 2026+. It automates the application of Queensland Government Design System (QGDS) brand identities, typography hierarchies, master pages, swatches, and vector assets.

### The Hybrid Architecture
To bypass the performance bottleneck of creating hundreds of styles via the InDesign DOM:
1. **Pre-compiled Format Templates:** Format-specific styles (147+ object and table variations) are pre-compiled into `.indt` master templates within `templates/`, tracked by `cache-manifest.json`.
2. **Runtime Layout Engine:** Physical page margins, column gutters, stratified layers, and vector header/footer artwork are calculated and placed mathematically at runtime.
3. **Atomic Transactions:** All DOM mutations must be encapsulated within `app.doScript()` using `UndoModes.ENTIRE_SCRIPT` to provide single-click undo (`Ctrl+Z`).

---

## 2. Strict Core Engineering Rules

### Rule 1: Strict ExtendScript ES3 JavaScript ONLY
Adobe InDesign's ExtendScript interpreter is based on ECMAScript 3 (1999). Modern JavaScript features (ES6+) **will immediately crash InDesign with syntax errors**.
* ❌ **NO `let` or `const`** — Use `var` exclusively.
* ❌ **NO arrow functions `() => {}`** — Use standard `function() {}`.
* ❌ **NO template literals `` `Hello ${name}` ``** — Use string concatenation `"Hello " + name`.
* ❌ **NO default parameter values `function(x = 1)`** — Use `var x = val !== undefined ? val : 1;`.
* ❌ **NO destructuring, spread operators, or rest parameters**.
* ❌ **NO unquoted ES3 reserved keywords as object keys** (e.g. use `{ "default": 1 }` or `{ "export": true }`, not `{ default: 1 }`).
* Use `modules/02-utilities.jsxinc` for standard ES3 polyfills (`Array.indexOf`, `forEach`, `map`, `filter`, `Object.keys`).

### Rule 2: Single Source of Truth
* All visual attributes, typography scales, colors, format dimensions, and style schemas are declared in `brand-tokens.json`.
* Do not introduce hardcoded fallback values into scripts or modules; declare new tokens in `brand-tokens.json` and read them via `config`.

### Rule 3: Rebuilding Templates After Changes
* Whenever `brand-tokens.json` or `modules/` are modified, the pre-compiled template cache in `templates/` becomes stale.
* Run **`Update Brand Templates.jsx`** from the InDesign Scripts Panel to rebuild the template cache.

### Rule 4: Module Contracts & Encapsulation
* Every file in `modules/*.jsxinc` must begin with an enterprise `MODULE CONTRACT` header comment documenting its Purpose, Public Entry Points, Dependencies, Side Effects, and Compatibility.
* Each module must have a single clear responsibility.

---

## 3. Standard Development Workflow

1. **Token & Styling Adjustments:**
   - Update `brand-tokens.json`.
   - Re-compile templates via `Update Brand Templates.jsx`.

2. **Quality Assurance & Verification:**
   - Run unit test suite: `node tests/run-all-tests.js` (Must pass all 147 tests).
   - Run ES3 syntax scanner: `node tools/scan-es3.js` (Must report 100% compliant).
   - Run bundle assembly: `node tools/assemble.js` (Updates `dist/InDesign Brand System.bundle.jsx` and syncs to InDesign Scripts Panel).

3. **InDesign Visual Verification:**
   - Launch InDesign.
   - Run `Apply Brand System.jsx` on sample test documents (A4, A3, DL, etc.).
   - Verify layout margins, typography styles, object styles, and master spreads.

---

## 4. Key File Map

| Path | Purpose |
| :--- | :--- |
| `Apply Brand System.jsx` | Main user-facing ScriptUI dashboard. |
| `Update Brand Templates.jsx` | Pre-compiles `.indt` format templates in `templates/`. |
| `Batch Generate Base Templates.jsx` | Generates distribution `.indt` templates and PDF catalogs across all page formats. |
| `Export Custom Document.jsx` | Packages bespoke documents without modifying working files. |
| `Extract Config Information.jsx` | Reverse-engineers selected elements into `brand-tokens.json` tokens. |
| `Uninstall Brand System.jsx` | Wipes custom styles and restores InDesign defaults. |
| `brand-tokens.json` | Master design tokens and declarative style schemas. |
| `module-verification.json` | Cryptographic SHA-256 audit manifest. |
| `modules/` | Numbered single-responsibility modules (`01-config` to `11-reports`). |
| `templates/` | Pre-compiled format templates and `cache-manifest.json`. |
