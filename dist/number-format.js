// Display precision only: calculations retain their unrounded values.
const ReferenceNumbers = {
  // Readable display only: two decimals, a third when needed. Scientific
  // notation preserves very small positive values without a long zero string.
  display(value) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    if (value !== 0 && (Math.abs(value) < .001 ||
        (Math.abs(value) < .01 && Math.abs(value * 1000 - Math.round(value * 1000)) > 1e-9))) {
      return value.toExponential(2);
    }
    return value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 3, useGrouping: false});
  },
  volume(value) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid preparation volume.');
    return ReferenceNumbers.display(value);
  },
  format(value, significantDigits = 6) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    return value.toLocaleString('en-US', { maximumSignificantDigits: significantDigits, useGrouping: false });
  }
};
if (typeof module !== 'undefined') module.exports = ReferenceNumbers;
