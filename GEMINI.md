# Gemini Project Guidance: Brand System

This document provides conventions and instructions for developing and maintaining the InDesign Brand System scripts.

## Project Overview

This project is a suite of ExtendScript (ES3) scripts for Adobe InDesign that automates the application of a comprehensive brand identity to documents. It uses a hybrid architecture, combining pre-built `.indt` templates for complex styles with a runtime engine for dynamic layout calculations.

## Core Principles

1.  **ES3 JavaScript ONLY:** The InDesign scripting environment is very old. **Do not use `let`, `const`, arrow functions, or other modern JS features.** All code must be ES3-compatible. Use the included `.system/lib/Polyfills.jsx` for array methods like `forEach` and `map` if needed.
2.  **Hybrid Architecture:** Remember that many styles are cached in `.indt` templates within the `.system/Resources/` directory.
3.  **Centralized Configuration:** All design tokens (colors, fonts, sizes, scales, etc.) are managed in `.system/lib/Config.jsx`. Avoid hardcoding values in the engine or UI scripts.

## Development Workflow

1.  **Making Configuration Changes:**
    *   Modify the design tokens in `.system/lib/Config.jsx`.
    *   **CRITICAL:** After saving changes, you **MUST** run `Update Brand Templates.jsx` from the InDesign Scripts Panel. This re-builds the cached `.indt` templates with your new styles.
    *   Your changes will now be available when you run `Apply Brand System.jsx`.

2.  **Testing Changes:**
    *   Use `Apply Brand System.jsx` on a test document to see the results of your changes.
    *   For quick reverse-engineering of visual styles into code, use the `Extract Config Information.jsx` utility.

3.  **Adding New Scripts:**
    *   New user-facing scripts should be placed in the root directory.
    *   Shared logic should be placed in `.system/lib/`.
    *   Ensure any new scripts are added to the `itemsToBackup` array in `Backup Project.jsx`.

4.  **Logging:**
    *   Use the `BrandSystem.Logger` module for outputting information, warnings, and errors. This writes to the central `BrandSystem_ContinualLog.txt` and is essential for debugging.

## Key Modules

*   **`Apply Brand System.jsx`**: The main, user-facing script for applying the brand system.
*   **`Update Brand Templates.jsx`**: A utility to rebuild the cached `.indt` templates. **Run this after any style or config changes.**
*   **`Batch Generate Base Templates.jsx`**: A powerful script for creating a distributable library of pre-branded templates.
*   **`.system/Engine.jsx`**: The core orchestrator that applies the logic.
*   **`.system/lib/Config.jsx`**: The "brain" of the system. Contains all design tokens. This is the most common file to modify.
*   **`.system/lib/StyleBuilder.jsx`**: The module that converts the tokens from `Config.jsx` into InDesign styles.
*   **`.system/lib/LayoutEngine.jsx`**: Handles page geometry, margins, and master pages.
*   **`.system/lib/UIUtils.jsx`**: Contains shared functions for building the script dialogs.
