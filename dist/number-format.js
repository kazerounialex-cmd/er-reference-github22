// Display precision only: calculations retain their unrounded values.
const ReferenceNumbers = {
  // Eight significant digits keep small measurable quantities visible without
  // implying that a particular syringe or dilution is clinically appropriate.
  volume(value) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid preparation volume.');
    const text = value.toLocaleString('en-US', {maximumSignificantDigits: 8, useGrouping: false});
    return value >= 1 && !text.includes('.') ? text + '.0' : text;
  },
  format(value, significantDigits = 6) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    return value.toLocaleString('en-US', { maximumSignificantDigits: significantDigits, useGrouping: false });
  }
};
if (typeof module !== 'undefined') module.exports = ReferenceNumbers;
