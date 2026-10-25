# Clinical workflow review

This branch is for review only. It does not change clinical doses, treatment thresholds, the 0.5 mEq/kg/hr supplemental-potassium tool limit, the feline lidocaine CRI restriction, or the fixed-rate insulin preference. Software checks are not clinical validation.

## Confirmed issues and changes

- KCl stock volumes were displayed to tenths: the independently calculated 0.03 mL and 0.15 mL preparations appeared as 0.0 and 0.2 mL. Preparation volumes now use up to eight significant digits, with positive values preserved. Chart, card, worked math and ordinary page printing share the volume formatter. The displayed delivery verification uses displayed stock/carrier quantities without feeding rounding back into calculations. Small-volume measurement feasibility and clinician-approved dilution are called out without assigning a universal measurement threshold or inventing a dilution recipe. Electrolyte stock/carrier volumes use the same policy.
- Form reset listeners previously cleared shared patient and fluid state. Local preparation resets now retain that state. “New patient / clear all” clears shared and local state and invalidates old browser-history preparation entries; this was verified with real browser Back navigation.
- Rate-source labels now distinguish From Fluid Planner, Shared manual rate and Local override. The banner shows the calculated planner rate even when a manual rate is active. Exact linked rates are retained internally.
- Drug rows previously had no advisory reference-range checks. Entered doses now produce textual Caution warnings outside existing workbook references, with mg/mcg conversion. Custom doses remain calculable, subject to existing restrictions. Local-anesthetic prior exposure can be reviewed without declaring a new maximum or a safe combined dose. Prior exposures must be entered explicitly, including zero when none.
- Concurrent supplemental potassium is explicitly selected, never activated by visiting a page. Each preparation contributes once. Incomplete inputs, changed patient/rate/preparation, mismatched separate-K entries, and unreviewed source lists cannot produce a falsely complete total. Native carrier-fluid K remains excluded. Same-bag reconciliation is explicitly incomplete: it requires final-volume, additive, pump and compatibility review. The separate-infusion summary does not establish physical compatibility or act as a medication administration record.
- Both insulin charts were already present: a compact clinician-selected guide with overlapping 200 mg/dL ranges, and a detailed fixed-rate reference with a 180–270 target. Both are preserved. The compact screen and print tables now explicitly require clinician choice between 2.5% and 5% at exactly 200; there is no automated BG-row selector.
- Concise assumptions and source links were placed near fluid, potassium/phosphate, sodium, blood-collection and chocolate results. The GI estimate explicitly states its rough nature and canine extrapolation. The KCl card now presents Prepare → Run at → Delivers → Lasts; electrolyte pump/delivery/duration rows precede secondary quantities. Text labels, existing light theme and navigation remain.

## Validation

- `node scripts/check-all.cjs`: complete suite passed, including new independent precision examples, positive-volume formatting, displayed-preparation verification, local-anesthetic reference/unit and prior-exposure checks, explicit K inclusion, no double counting, incomplete totals, the existing K warning threshold and both insulin chart versions.
- `node scripts/check-clinical-browser.cjs`: passed using Playwright and Chromium against the documented static server. Requires those optional development tools; it does not change runtime dependencies. Checks 17 pages at 1440 and 390 pixels, no document overflow or JavaScript page errors, actual local/global/history resets, linked/manual/local rates, concurrent K inclusion and input changes, local-anesthetic cautions, preserved feline lidocaine CRI block and insulin boundary text.
- Generated Letter PDFs were inspected by extracting their text. KCl print retained 0.03 mL, 11.97 mL carrier, 10 mL/hr and 0.05 mEq/kg/hr. The compact insulin print included the exact-200 clinician-choice row. PDFs and screenshots are temporary development artifacts, not committed patient records.
- Keyboard Tab navigation reached the preparation-clear action. Static checks validate labels, IDs, ARIA references and script order. This is not a complete assistive-technology audit.
- `python3 scripts/clinical-workflow.py` was run twice; the second run did not change page bytes. The finalizer invokes it after existing page adapters, and insulin/precision/banner source templates were updated.

## Clinical evidence still needed

Existing local/regional workbook references are **lidocaine 2–4 mg/kg** and **bupivacaine 1–2 mg/kg**. They remain advisory reference ranges, not proposed or validated species-specific maximum doses.

Attempts to read the following authoritative sources were blocked by the environment's HTTPS proxy (403), so no new numeric maximum or combined-exposure ceiling is proposed or activated:

- [2020 AAHA Anesthesia and Monitoring Guidelines for Dogs and Cats](https://www.aaha.org/resources/2020-aaha-anesthesia-and-monitoring-guidelines-for-dogs-and-cats/), specifically local-anesthetic techniques and their species/route context.
- [Merck Veterinary Manual: Local and Regional Analgesic Techniques in Animals](https://www.merckvetmanual.com/management-and-nutrition/pain-assessment-and-management/local-and-regional-analgesic-techniques-in-animals).

Source access to `www.aaha.org` and `www.merckvetmanual.com`, or supplied source documents, is needed to finish that evidence review. Any subsequent proposal must include exact species, route, formulation, exposure interval and conflicting recommendations for clinician approval before activation. No approval of an unverified number is requested here.

Browser/PDF checks do not establish suitability of a measuring device, medication compatibility, accuracy of source recommendations or safety for a particular patient. Independent clinical and bedside print/device review remain necessary before adopting the changes in practice.
