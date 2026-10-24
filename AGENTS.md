# Required verification after every update

After any edit, including styling, copy or generated-page edits, run:

    node scripts/check-all.cjs

Run against the final files after all generators and edits finish. If any check fails, fix the cause and rerun the complete suite before pushing, packaging, or publishing. Do not weaken an assertion just to obtain a pass; changes to expected clinical results require explicit justification and source/user review.

Preserve independent expected examples and unit/mass-balance checks. For calculation or input-behavior changes, add regression cases covering the changed behavior, units, boundaries and invalid inputs. Display rounding must not feed back into calculations.

Install the repository's pre-push check in each checkout:

    node scripts/install-check-hook.cjs

Do not bypass the hook. It runs the complete check suite before each push. A successful automated run does not establish browser rendering, print appearance or clinical validity of source recommendations. Report those limits accurately.
