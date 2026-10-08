# Changelog

## [2.3.0] - 2026-10-08

### Build Verification, Checksum Auditing & Structured Reporting (Phase 4 & Phase 5)
- **Module Verification & Cryptographic Manifest (`module-verification.json`):** Integrated with `tools/assemble.js` to compute SHA-256 cryptographic checksums for all 11 modules, ensuring complete module auditability and tamper protection.
- **Standalone Monolithic Distribution Bundle (`dist/InDesign Brand System.bundle.jsx`):** Added automated bundle compilation in `tools/assemble.js` for single-file deployment in environments where relative `#include` directives cannot resolve sibling files.
- **Structured Publishing Diagnostics (`modules/11-reports.jsxinc`):** Introduced a dedicated reporting module (`BrandReports`) with standardized telemetry metrics covering document geometry, swatch/style generation counts, and QGDS export tag audits.
- **Dual Markdown & JSON Reports:** Supports on-demand export of human-readable Markdown publishing reports (`*-brand-report.md`) and structured JSON telemetry files (`*-brand-report.json`).
- **Continual Log Rotation & Size Capping:** Enforced strict log rotation capping `BrandSystem_ContinualLog.txt` at 512 KB with automated backup archiving to `BrandSystem_ContinualLog_old.txt`, permanently resolving multi-megabyte disk bloat.
- **Unified Ecosystem Assembly:** Extended `tools/assemble.js` to build, verify, bundle, and sync all three ecosystem packages (`InDesign HTML exporter`, `InDesign Brand System`, and `InDesign Semantic Styler`).
- **Test Suite Expansion:** Added automated tests verifying SHA-256 checksums, distribution bundle validity, markdown/json generation, and log rotation (145 of 145 tests passing).

## [2.2.0] - 2026-10-08

### Modular Pipeline Refactoring & Module Contracts (Phase 3)
- **Numbered Modular Architecture (`modules/`):** Refactored the Brand System engine into 10 single-responsibility numbered modules:
  - `01-config.jsxinc`: Central configuration constants, matrices, and fallback tokens.
  - `02-utilities.jsxinc`: Dimension math scaling (`scaleMm`), typography calculator (`calcType`), object merger, Logger, and ES3 polyfills.
  - `03-token-loader.jsxinc`: Multi-tier token resolution (`loadBrandTokens`, `findBrandTokensFile`) with deep directory hierarchy search.
  - `04-cache-manager.jsxinc`: High-performance in-memory style, swatch, stroke, and list cache to eliminate repetitive DOM querying.
  - `05-style-builder.jsxinc`: Declarative QGDS component styles with native `styleExportTagMaps` (`exportType: "EPUB"`, `exportTag`, `exportClass`).
  - `06-layout-engine.jsxinc`: Page geometry, margin calculations, layer stratification, and master spread management.
  - `07-asset-injector.jsxinc`: Vector header/footer placement, SSD asset resolution, style specimens, and texture embedding.
  - `08-cleanup-protocol.jsxinc`: Document sanitization, zombie style purge, and brand reset routines.
  - `09-ui-utils.jsxinc`: ScriptUI dashboard builder, safe preference persistence (`savePreferences`), and progress dialogs.
  - `10-brand-engine.jsxinc`: Master orchestrator coordinating analysis, template generation, and document processing.
- **Standardized Module Contracts:** Every module begins with a standardized contract header defining `Purpose`, `Public entry points`, `Required dependencies`, and `Side effects`.
- **Atomic Transaction Safeguards (`processSafe`):** Wrapped document processing in native `app.doScript` with `UndoModes.ENTIRE_SCRIPT` to guarantee complete transaction rollback upon unhandled errors.
- **Full Backward-Compatibility Facades:** Retained `.system/Engine.jsx` and all `.system/lib/*.jsx` files as lightweight routing facades to preserve compatibility with legacy callers and external tools.
- **Top-Level Launcher Direct Module Inlining:** Updated `Apply Brand System.jsx`, `Update Brand Templates.jsx`, `Batch Generate Base Templates.jsx`, `Export Custom Document.jsx`, and `Uninstall Brand System.jsx` to consume `modules/` directly.
- **Test & Linter Validation:** Extended `tests/test-brand-system.js` to validate all 10 module files and contracts; achieved 100% pass across all 143 test cases and 100% ExtendScript ES3 syntax compliance.
- **Scripts Panel Auto-Sync:** Integrated with `tools/assemble.js` to automatically keep the live Adobe InDesign Scripts Panel in sync.

## [2.1.0] - 2026-10-08

### QGDS Component Alignment & HTML Export Architecture (Phase 1 & Phase 2)
- **Externalized Brand Design Tokens (`brand-tokens.json`):** Decoupled design tokens, color swatches, typography matrix, and page format matrices into a standalone JSON file with dynamic ES3 loader in `Config.jsx` and graceful embedded fallback.
- **QGDS Component Paragraph Styles:** Generated official Queensland Government Design System component typography in `StyleBuilder.jsx` across Callouts, Cards, Accordions, Banners, Blockquotes, Stat Callouts, Details, Step Lists, Metadata Lists, CTA Links, File Downloads, and Table elements.
- **QGDS Character, Object, and Cell Styles:** Added Tag Badges (Default, Success, Warning, Error, Info, Neutral), Callout & Card & Banner object styles, and Table RowHeader & Numeric cell styles.
- **Semantic HTML/EPUB Export Tag Mappings:** Configured native InDesign `styleExportTagMaps` (`exportType: "EPUB"`, `exportTag`, `exportClass`) and `emitCss: true` across all paragraph and character styles to seamlessly integrate with `InDesign HTML exporter` and SWE BEM/Web Component emitters.
- **Hierarchical Style Groups:** Implemented `resolveTargetGroup` in `Engine.jsx` supporting arbitrary slash-delimited nested style folders (e.g. `QGDS / Callout`, `QGDS / Card`, `Reverse / QGDS / Banner`).
- **Telemetry & Test Infrastructure:** Ignored 3.1 MB runtime log, added automated test suites in `tests/test-brand-system.js` verifying tokens, math, style generation, and nested group DOM injection, and achieved 100% ExtendScript ES3 scanner compliance.

## [Unreleased] - 2026-05-11

### Architecture & Refactoring
- **Modularized Engine:** Dismantled the monolithic `Engine.jsx` "God Object" into discrete, maintainable modules (`LayoutEngine.jsx`, `AssetInjector.jsx`, and `CleanupProtocol.jsx`). `Engine.jsx` now acts strictly as a clean traffic controller.
- **UI Centralization:** Extracted repetitive user interface and preference logic into a shared `UIUtils.jsx` library.
- **Preference State Preservation:** Patched `UIUtils.savePreferences` to safely merge rather than blindly overwrite states, fixing a race condition where Batch Generator preferences would wipe Apply System preferences.
- **Temporary Asset Security:** Wrapped file placement routines in aggressive `try...finally` blocks to guarantee SSD temporary proxies are purged even if execution crashes.
- **Hardened Error Logging:** Piped previously silent empty catch blocks across asset injection and cleanup routines into the telemetry `Logger` to ensure all non-fatal anomalies leave a trace.
- **Syntax Fixes:** Corrected a variable declaration typo in the newly extracted `CleanupProtocol` cell style loop.

### Added
- **Custom Document Exporter:** Added a new standalone script `Export Custom Document.jsx` to package and export bespoke ad-hoc layouts into the Brand System.
- **Brand Uninstaller:** Added `Uninstall Brand System.jsx` to safely strip all custom styles, swatches, and master pages, reverting active documents to a clean slate.
- **INDD Exports:** `Batch Generate Base Templates.jsx` now features a toggle to output standard `.indd` working files alongside `.indt` templates.
- **Config Extraction Utility:** Added a new standalone script `Extract Config Information.jsx` which calculates typographic scale exponents and JSON formats from objects designed manually on the page, allowing users to rapidly reverse-engineer visual designs directly into `Config.jsx` tokens.
- **Corner Permutations:** Added `Rounded Left` and `Rounded Right` options to the dynamic object style generator for frames.
- **Native Object Styles:** The object engine now dynamically generates generic `Fill` and `Stroke` object styles for the native InDesign `Black` and `Paper` swatches alongside your theme styles.
- **Custom Format Interception:** When applying the system to an unrecognized document size, the engine now intercepts the generation to present a native user prompt allowing for precise manual margin definitions.
- **Decoupled Margin Pass:** The primary execution pipeline has been updated to allow applying layout constraints (margins and master page generation) independently of injecting vector headers and footers.
- **Decoupled Asset Injection:** The "Inject Headers & Footers" execution scope no longer forces typography to be generated (though Object Styles remain linked to ensure Brand Bars and covers retain their signature rounded corners).
- **Decoupled Specimen Injection:** Added a dedicated execution scope toggle to inject (or omit) the typography style specimen independently of building the text styles.

### Changed
- **Batch Output Structure:** Re-architected `Batch Generate Base Templates.jsx` to route exported files into categorical subdirectories (`document/`, `signage/`, etc.) with dedicated `examples/` folders for visual previews.
- **Dynamic JPEG Naming:** JPEG outputs from the batch generator are now cleanly suffixed with their specific variant names (e.g., `-Q.jpg`, `-BA.jpg`) and unnecessary interior pages are skipped.
- **Extraction Overrides:** The Config Extraction Utility now successfully parses text frame insets, corner radiuses, and dynamic stroke weights, explicitly locking bounds to millimeters.
- **Comprehensive Backups:** `Backup Project.jsx` now automatically captures local UI preferences (`BrandSystem_Prefs.jsx`) alongside all newly added standalone utilities.
- **Small Typography Calibration:** Updated the `Paragraph Small`, `Caption`, and `Footer` typographic scales from `-0.8165` to exactly `-0.8` for cleaner integer mapping and improved cross-document math.
- **Object Style Insets:** Renamed `Inset - Small (Bottom Left)` and `Inset - Small (Left Only)` to `Inset - X-Small` and reduced their spacing multipliers to match the tighter intended design tokens.
- **Theme Style Strict Filtering:** The Object Engine now filters generated `Fills` and `Strokes` to only include the active primary theme and the generic Neutral palette, preventing the Object Styles panel from becoming bloated with inactive swatches.

### Fixed
- **Telemetry & Logging Polish:** Resolved false-positive warnings in `BrandSystem_ContinualLog.txt` by fixing the template builder fallback directory lookup path and modifying the final A-Cover application pass to safely use fuzzy `namePrefix` matching instead of strict string checks.
- **Cleanup Loop Ghost Exceptions:** Wrapped layout, master page, and style cleanup iterators in aggressive `try...catch` validation blocks to fully resolve the "object no longer exists" script-crashing anomaly when InDesign actively purges parent containers.
- **JPG Export Exceptions:** Stabilized the `ExportFormat.JPG` routines in the batch generator, replacing finicky native string constants with direct application export IDs and safe-string fallbacks to prevent silent pipeline aborts.

### Changed
- **Dynamic Large Header Prevention:** Enhanced the `Brand bar - Large` layout logic to dynamically measure the intrinsic aspect ratios of all injected footer variants. It now uses the tallest injected footer as its baseline reference, guaranteeing the header graphic will never overlap the footer on large formats.
- **Large Header Dynamic Expansion:** Adjusted the `Brand bar - Large` graphic to dynamically expand downwards to meet the footer graphic (minus layout margin padding) on all document formats except A4, ensuring maximum brand coverage on large formats and signs.
- **Dynamic Header Binding:** The 'Brand bar - Wordmark' header is now dynamically linked to any footer variant that contains the keyword 'Wordmark' in its filename. This removes the hardcoded `"DRFA"` logic, supporting dynamic naming conventions like `footer-A1-landscape-with-margin-Q-Wordmark.eps` seamlessly while gracefully cleaning up unused template headers.
- **System-Wide Fuzzy Resilience:** Expanded fuzzy matching logic to cover script file execution (protecting against users renaming utility scripts) and layer/master page targeting (making the pipeline immune to international InDesign language localization, such as "A-Master" vs "A-Gabarit").
- **Hybrid Fuzzy Asset Matching (Enhanced):** Upgraded `findFuzzyAsset` to restore full standard boundary flexibility (e.g., allowing `-Wordmark` suffixes after variants). It now dynamically prevents substring collisions (like "Q" matching "Q-QR") by cross-referencing matched files against the master `footerVariants` array to ensure it isn't intercepting a file meant for a longer variant.
- **Dynamic Header Measurement:** Updated the Header Wordmark injection logic to read the placed asset's intrinsic dimensions dynamically. The Wordmark Background rectangle now recalculates its height automatically to wrap the true image bounds.
- **Header Graphic Injection:** Removed the dynamic `-reverse` suffix and `Wordmark` prefix from header graphic lookups. The script now defaults to looking for standard headers following the `header-[formatStr].ext` convention (e.g., `header-A5.svg`).

### Fixed
- **Texture Asset Embedding:** Successfully patched the texture placement block to explicitly proxy from SSD and unlink (embed) the `'texture-landscape'` image into the Brand bar and C-Back cover backgrounds, making all templates 100% standalone.
- **Critical Reference Errors Fixed:** Corrected the execution breaking bugs where `findFuzzyAsset` and `findLayerFuzzy` were not correctly appended to the bottom of the engine module. Additionally patched an undeclared `exactFooterHeight` variable in the `injectStyleSpecimen` function which was silently crashing the typography specimen generator on large formats.
- **Backup Reversion Recovery:** Completely rebuilt the active `Engine.jsx` framework, recovering the lost Reverse-mode typography logic, Wordmark asset binding rules, Master layer target flexibility, and the Enhanced Hybrid Fuzzy matching algorithm which were inadvertently erased during a file reversion rollback.
- **Template Lookup Infinite Loop:** Fixed a critical execution bug where the engine endlessly searched for legacy `.indt` naming conventions (like `BrandSystem_A4.indt`) rather than targeting the newly serialized `Batch Generate Base Templates.jsx` outputs (e.g. `BrandSystem_A4_RGB_Blue_Standard.indt`). The framework is now in perfect sync with the external batch generators.
- **Template Batch Generation Crash:** Traced the `pg.masterPageItems.everyItem is not a function` error directly to the legacy master detach logic. ExtendScript treats `masterPageItems` as an Array, not a collection. The engine now safely loops through `pageItems` and detaches overridden content using native DOM methods to permanently safeguard batch processes.
- **Fuzzy Matching Functions Restored:** Fixed a critical bug where the helper functions `findFuzzyAsset` and `findLayerFuzzy` were accidentally dropped from the bottom of the engine module in the last update. This caused a silent fatal crash during execution, aborting the script before it could build the headers and footers on the master layers.
- **Master Page Cleanup:** Fixed a bug where `B-Content` or `C-Back` master spreads would fail to delete when switching from a smaller format to a Large Format/DL document if those masters were currently applied to active pages. The engine now safely detaches pages before deleting the unneeded masters.
- **Brand bar - Large Calculation Refined:** Restored the original, stable logic for footer sizing frames while adjusting the `Brand bar - Large` to mathematically measure the *intrinsic visible height* of the placed footers. This prevents the large header from overlapping the graphics on large formats without breaking master page layouts.
- **Master Page Injection Crash:** Fixed a fatal syntax error where an undefined variable (`h`) in the `Brand bar - Large` header routine caused the script to abort mid-execution. This prevented footers and back covers from generating properly and broke master page layers.
- **Footer Asset Bounding Box Fix:** Reworked the dynamic footer measurement to use proportional fit extraction rather than raw `FRAME_TO_CONTENT`. This prevents excessively large SSD assets from breaching pasteboard constraints or masking incorrectly when placed.
- **Header Graphic Visibility:** Fixed an issue where the dynamically measured header graphic was masking itself out. Changing the frame's geometric bounds was leaving the image content behind; added a fit command to recenter the graphic after the frame moves.
- **Reverse Mode Typography Fix:** The primary and secondary style themes are now cleanly swapped when Reverse mode is active. This ensures standard text styles adopt the light/reverse values, and reverse text styles adopt the dark/standard values.
- **Back Cover Colors:** Ensured that the Back Cover text correctly adopts the corresponding Bold and Footer styles depending on whether the document is generated in Standard or Reverse mode.

---

### ⚠️ Troubleshooting: Changes Not Reflecting in InDesign?

The InDesign Brand System Engine uses a **Hybrid Architecture** with an aggressive **Template Caching System** to ensure sub-second execution speeds. Heavy styles are pre-compiled into hidden `.indt` files inside the `.system/Resources/` folder. 

Because of this cache, any script updates made to style generation logic (such as flipping reverse mode colors) **will not take effect until the style templates are rebuilt.**

**To apply these script updates, you must rebuild the caches by running `Update Brand Templates.jsx` from the Scripts Panel.** This will automatically purge the old templates and re-compile them with the new logic.