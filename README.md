# ER Reference

A small, buildless veterinary reference website. Open `dist/` through a local web server; the website runs independently on any static web host. See `START-HERE.md` for GitHub upload and Cloudflare Pages settings.

## Run locally

Requirements: Python 3 and Node.js for development/checks. No npm installation or framework build is required.

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`. Stop the server with Ctrl+C. Patient weight/species are stored in this browser tab's session; use **Clear patient** for a new patient.

## Run every check

```sh
node scripts/check-all.cjs
```

This checks JavaScript syntax, pure calculations, simulated form/event behavior, screen/print preparation agreement, numeric boundaries, local links, IDs, labels, ARIA references and script order. It exits immediately on a failed check. These checks do not replace an actual browser console, mobile layout, assistive-technology or print-preview review, or independent clinical validation.

## Project layout

- `dist/`: complete website; deployed directly, without a build step.
- `dist/calc.js`, `electrolyte-calc.js`, `blood-calc.js`, `drug-calc.js`, `cri-calc.js`: calculation logic. Prescribing guidance is kept in page content/data, not inferred by the arithmetic.
- `dist/patient-context.js`: shared weight/species synchronization and tab-session storage.
- `dist/number-format.js`: consistent finite-number display; display rounding never feeds calculation formulas.
- `dist/cri.js`: insulin and Reglan interface only.
- `dist/cri-preparation.js`: lidocaine, ketamine and norepinephrine interfaces.
- `dist/fentanyl.js`: linked dose/concentration/rate/volume/time controls and optional normalized-mix shortcut.
- `dist/cri-print.js`: compact print references. Insulin/Reglan print and screen use the same preparation functions.
- `scripts/`: page-generation helpers and the complete check runner.
- `check*.cjs`: regression checks.
- `AUDIT.md`: findings, fixes, evidence and remaining verification limits from this review.

## Editing generated pages

CRI content/layout sources are in `scripts/build-cri-pages.py`, `scripts/cri-workflow-layout.py`, and the HTML fragments beside them. To regenerate CRI pages and shared navigation:

```sh
python3 scripts/build-cri-pages.py
node scripts/check-all.cjs
```

The generator finishes with `scripts/finalize-site.py`, which inserts the shared formatter and marks derived hidden fields as actual hidden inputs. Other legacy page generators are incremental tools; review their output and regenerate CRI navigation afterwards. Do not run them blindly over hand-edited content.

## Current workflows and clinical boundaries

- Fluids: shared dog/cat selection is required. Entered bolus is subtracted from estimated deficit; use zero if already accounted for. The GI-loss helper replaces the ongoing-loss input only when explicitly applied.
- Electrolytes: potassium, magnesium, phosphate, sodium and dextrose arithmetic preserve the owner-selected workbook methods and existing tool limits. Carrier potassium is intentionally excluded from the KCl calculation.
- Drugs: all 31 catalog rows stay visible under category headers. A dose/unit/stock edit updates its own row; patient changes update all rows. Stock concentrations are locked by default.
- Fentanyl: controls are linked; inputs plan a new preparation. The optional button creates 1 mcg/kg/hr = 1 mL/hr. An existing infusion's concentration must remain fixed when titrating its pump rate.
- Lidocaine: feline calculations and print references are disabled.
- Norepinephrine: default concentration-based mode, 0.05 mcg/kg/min, 15 mcg/mL and 12 mL final. Target-pump preparation is optional. Workbook peripheral/central guardrails remain 16/64 mcg/mL; these are not claimed to be universal veterinary maximums. The chart holds one preparation concentration fixed.
- Insulin: owner-selected fixed-rate DKA default is 0.1 U/kg/hr for dogs and cats, with explicit alternatives and the existing clinician-selected glucose/dextrose quick guide. No automatic BG titration or stop rule. Its print reference puts insulin rate/preparation formula above that same quick guide.
- Reglan: selectable syringe A, syringe B and fluid-bag print references; syringe run times remain editable. Dose units are mg/kg/day.
- Chocolate toxicity: dog-focused Merck methylxanthine calculator with oz/grams, generic type ranges, cocoa-% estimates, summed entries and labeled risk illustrations.
- Blood collection: calculated/blank cage-side forms and CSV export. Rolling totals remain manually recorded; a new sheet does not reset the clinical plan.

Dose/source review notes remain in `dist/sources.html` and on the relevant pages. This code review does not certify clinical recommendations or independently approve any medication protocol.

## Required checks after every update

Run `node scripts/check-all.cjs` after the final edit or generation step, including style-only changes. Fix every failure before publishing. Install the automatic pre-push check once in each Git checkout:

```sh
node scripts/install-check-hook.cjs
```

The hook runs the full suite before each push and blocks the push on failure. ZIP copies do not include Git configuration; initialize/clone a Git repository before installing the hook. Other publishing routes must explicitly run the suite; this is not a hosting-service enforcement rule.

The suite checks known expected answers, dose/pump-rate unit conversions, preparation mass/volume balance, threshold boundaries, invalid-input clearing, linked controls, feline restrictions, and matching screen/print preparations. Test assertions verify the implemented arithmetic and behavior; clinical recommendations still require independent review. Browser rendering and real print previews remain separate checks.

## Original Sheet page

`original-sheet.html` recreates the first workbook tab’s C3:V60 arrangement, column proportions, row spacing, merged labels and left/right section placement. `scripts/original-sheet-layout.json` retains the visual reference without cached formula results. Regenerate with `python3 scripts/build-original-sheet.py`, then run `node scripts/check-all.cjs`.

`original-sheet-calc.js` adapts the existing calculation functions; it does not evaluate arbitrary workbook formulas. The 12-hour fluid plan preserves daily maintenance and ongoing losses; impossible sodium mixtures are blocked. Shared weight/species apply throughout; the inactive species fluid block clears. KPhos K can be included in the KCl table explicitly. Norepinephrine uses mcg/kg/min, 1 mL/hr, a 12 mL capacity and the existing 16/64 mcg/mL access guardrails. Stock controls start locked. The on-page blood log is temporary and is cleared with the patient. Fit-to-width preserves the full layout, while disabling it permits normal-size horizontal scrolling.

## Compact electrolyte layouts

All five electrolyte pages use `scripts/compact-electrolytes.py` (called by the shared finalizer) to preserve their calculation IDs while placing charts beside live results on wide screens. The adapter is idempotent. Shared patient fields remain available to the calculation controllers but are hidden in the page body. Magnesium bloodwork guidance stays beside dose options, lab-range overrides are expandable, and phosphate’s K contribution stays prominent inside its result panel. Sodium checklists and preparation detail expand on demand; urgent cautions remain visible.

`electrolyte-layout.js` prevents forced scrolling/math expansion on desktop, and brings offscreen results into view on narrow screens. Dose and mixture functions are unchanged. Full tests include this presentation behavior and its reduced-motion handling.

## Latest exported behavior

Website source commit: `46083220a292d6440d9caf1810f1bf5249cc5592` (hosted version 74). Export instructions and the GitHub test workflow are additional packaging files; website files are unchanged.

- Shared fluid-rate banner includes the calculated maintenance/deficit/loss breakdown and planned volume/duration.
- KCl and phosphate follow the shared rate. Local edits create overrides; **Use shared rate** reconnects them. Display rounding does not alter calculations.
- Magnesium retains its separate pump rate linked to volume and duration.
- KCl concentration is highlighted at or above 0.06 mEq/mL with a gentle catheter monitoring reminder. This is a conservative irritation reference, not a universal toxicity cutoff.
- Patient and fluid data remain in the browser tab session. Clear patient clears the shared rate and overrides.
- The included GitHub workflow runs checks on pushes and pull requests; it does not publish the site.
