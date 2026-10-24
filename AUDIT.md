# Whole-site code review

Reviewed October 17, 2026 (America/New_York). Scope: all 15 HTML pages, browser JavaScript, shared calculation modules, page generators, printing and existing checks. Clinical formulas, selected dose defaults, reference bands and access policies were preserved; numeric-display precision and invalid-state handling were corrected.

## Critical

**C1 — Missing species could silently select dog maintenance. Fixed.**

`patient-context.js` used `state.species || 'dog'` when synchronizing hidden fluid-planner radios. A weight could remain populated with a blank shared species selector, while the planner continued calculating with dog maintenance. The two maintenance coefficients differ, so the missing selection affected the result. The synchronization now leaves both radios unchecked until a species is explicitly selected. The fluid planner clears its output and shows a selection message; the GI helper also disables application when species is missing. Regression checks exercise clearing a previously selected species and retaining a weight without calculating dog maintenance.

## Moderate

**M1 — Display precision could materially change a small drug volume or pump rate. Fixed.**

The drug list used one decimal for values of 0.1 or larger; CRI interfaces also rounded larger pump rates to one decimal. For example, 0.14 mL displayed as 0.1 mL and 1.875 mL/hr displayed as 1.9 mL/hr. Print tables retained more precision. A shared finite-number formatter now preserves up to six significant digits, suppresses trailing zero noise and leaves all calculation inputs unrounded. The requested potassium tenths display is unchanged.

**M2 — Screen and print preparation logic was duplicated. Refactored.**

Insulin and Reglan repeated volume/capacity/duration calculations in separate UI and print implementations. No disagreement was reproduced in the existing ordinary examples, but independent implementations could drift. Both now call `CriCalc.insulinPreparation` / `reglanPreparation`. Regression checks compare full print and screen model results across multiple patient weights. This is prevention of drift, not a claim that a wrong insulin protocol was found.

**M3 — Narrow shared-patient controls and printed tables could overflow. CSS corrected; visual verification pending.**

The mobile header used intrinsic-width number/select fields in unconstrained fractional grid columns. Shared controls now use zero-minimum grid tracks, bounded inputs and a full-row Clear button on very narrow screens. Print tables override the global first-cell minimum width and the insulin table's scrolling wrapper. These are source-level corrections; real browser reflow and print-preview confirmation remain outstanding.

## Minor / hardening and maintenance

**L1 — Finite inputs could still produce non-finite outputs. Fixed.**

Extreme finite inputs reproduced `Infinity` in fluid results, stock mixing and single-drug calculations. Returned-result checks and positive-result checks now reject overflow/underflow instead of displaying a numeric answer. Normal clinical ranges and formulas were not restricted by new arbitrary dose thresholds.

**L2 — Full drug catalog recalculated on every row edit. Optimized.**

A dose/unit/stock edit previously recalculated all 31 drug rows and unrelated Reglan/pressor outputs. A control-to-row map now evaluates that drug only. Shared-patient changes still update every affected row. An instrumented regression confirms one single-drug calculation per row edit instead of 31. No end-to-end speedup percentage is claimed.

**L3 — Repeated electrolyte and blood-preview work. Optimized.**

Each electrolyte table's unique dose is calculated once per update and reused for row/button state. The blood iframe is only assigned new `srcdoc` when its content changes. Shared banner inputs no longer trigger CRI/drug/print calculations before patient synchronization; local synchronized fields remain the event source.

**L4 — Obsolete CRI code and inconsistent build steps. Cleaned up.**

`cri.js` still contained the abandoned four-drug table calculator even though those pages loaded other controllers. Removing it reduced this file from 8,712 to 4,097 bytes before documentation-only finishing changes. `cri-print.js` also lost unused fallback branches. Core CRI math is now formatted and organized by responsibility. A finalization helper preserves shared-script order and marks derived hidden numeric fields as actual hidden inputs. A single check runner validates all suites and fails on the first error. No new framework or runtime package was added.

**L5 — Reduced-motion and resilience details. Improved.**

Chart scroll actions now honor reduced-motion settings. Patient synchronization releases its reentrancy guard in `finally`. Fluid-form submission is prevented so the calculator does not navigate on a form submit. Documentation was rewritten to describe current behavior instead of retaining contradictory historical notes.

## Checks and evidence

Run `node scripts/check-all.cjs` from the project root.

- JavaScript syntax checked for every served `.js` file.
- Existing fluid/KCl, electrolyte, blood, drug, shared-patient and six-CRI regression suites retained.
- New regressions: unset species, numeric extremes, small-number display, one-row drug recomputation, shared print/screen preparation models.
- Static scan across 15 pages: duplicate IDs, local asset links and fragment links, visible control names, ARIA ID references, iframe names and shared-script load order.
- Baseline scan found no JavaScript syntax errors, duplicate IDs, missing local files/anchors or unnamed visible controls. No broken event listener was reproduced by the simulated interaction suites.
- Served assets were approximately 332 KiB before the review, without a frontend framework or large image/font bundle. Performance work therefore targets repeated calculation/render work and obsolete JavaScript, rather than adding a bundler or framework.

## Limits / follow-up verification

A compatible browser-control capability was unavailable in this environment. No real browser console, screenshot, screen-reader session, mobile-device interaction or print-preview test was performed. Simulated DOM/static checks are not presented as those checks. Browser/mobile/print verification is the remaining QA step; independent clinical validation remains separate from this engineering review. The unchanged clinician-selected insulin chart still has the documented shared 200 mg/dL boundary; resolving clinical choices was outside this refactor.
