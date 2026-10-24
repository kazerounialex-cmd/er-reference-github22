// Display precision only: calculations retain their unrounded values.
const ReferenceNumbers = {
  format(value, significantDigits = 6) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    return value.toLocaleString('en-US', { maximumSignificantDigits: significantDigits, useGrouping: false });
  }
};
if (typeof module !== 'undefined') module.exports = ReferenceNumbers;
