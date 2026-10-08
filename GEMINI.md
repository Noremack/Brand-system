# Gemini Project Guidance: Brand System

This document provides conventions and instructions for developing and maintaining the InDesign Brand System scripts.

## Project Overview

This project is a suite of ExtendScript (ES3) scripts for Adobe InDesign that automates the application of a comprehensive brand identity to documents. It uses a hybrid architecture, combining pre-built `.indt` templates for complex styles with a runtime engine for dynamic layout calculations.

## Core Principles

1.  **ES3 JavaScript ONLY:** The InDesign scripting environment is very old. **Do not use `let`, `const`, arrow functions, or other modern JS features.** All code must be ES3-compatible. Use `modules/02-utilities.jsxinc` for standard ES3 polyfills if needed.
2.  **Hybrid Architecture:** Styles are cached in `.indt` templates within `.system/Resources/`, backed by companion `cache-manifest.json` metadata.
3.  **Centralized Configuration:** All design tokens (colors, fonts, sizes, scales) are managed in `brand-tokens.json` (with fallback in `modules/01-config.jsxinc`). Avoid hardcoding values in engine or UI scripts.

## Development Workflow

1.  **Making Configuration Changes:**
    *   Modify the design tokens in `brand-tokens.json`.
    *   **CRITICAL:** After saving changes, you **MUST** run `Update Brand Templates.jsx` from the InDesign Scripts Panel. This re-builds the cached `.indt` templates with your new styles.
    *   Your changes will now be available when you run `Apply Brand System.jsx`.

2.  **Testing Changes:**
    *   Run automated test suite: `node tests/run-all-tests.js`.
    *   Run ES3 scanner: `node tools/scan-es3.js`.
    *   Re-assemble standalone distribution bundle: `node tools/assemble.js`.
    *   Use `Apply Brand System.jsx` on a test document in InDesign to inspect visual results.

3.  **Adding New Logic:**
    *   New user-facing scripts belong in the root directory.
    *   Engine logic belongs in single-responsibility numbered modules under `modules/`.
    *   Always update `module-verification.json` and standalone bundle via `tools/assemble.js`.

4.  **Logging & Diagnostics:**
    *   Use `Logger` for console and trace logging, with automated 512 KB log rotation.
    *   Use `BrandReports` (`modules/11-reports.jsxinc`) for structured Markdown and JSON publishing diagnostics.

## Key Modules

*   **`Apply Brand System.jsx`**: The main user-facing ScriptUI dashboard for applying the brand system.
*   **`Update Brand Templates.jsx`**: Rebuilds cached `.indt` templates and `cache-manifest.json`.
*   **`Batch Generate Base Templates.jsx`**: Generates template distributions and PDF catalogs across all page formats.
*   **`brand-tokens.json`**: Master design tokens (colors, typography matrix, page matrices, QGDS styling).
*   **`modules/`**: Numbered single-responsibility ExtendScript modules (`01-config` through `11-reports`).
*   **`dist/InDesign Brand System.bundle.jsx`**: Standalone monolithic distribution bundle.
