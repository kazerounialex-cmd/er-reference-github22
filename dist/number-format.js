// Display precision only: calculations retain their unrounded values.
const ReferenceNumbers = {
  inputs: new WeakMap(),
  read(field) {
    const saved=this.inputs.get(field);
    return saved&&saved.display===field.value?saved.exact:Number(field.value);
  },
  write(field,value) {
    field.value=this.display(value);
    this.inputs.set(field,{display:field.value,exact:value});
  },
  forget(field) { this.inputs.delete(field); },
  // One decimal at/above 1, two below 1. Very small nonzero values use
  // compact scientific notation rather than an apparently zero amount.
  display(value) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    if (value !== 0 && Math.abs(value) < .005) return value.toExponential(1);
    const decimals = Math.abs(value) < 1 ? 2 : 1;
    return value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false});
  },
  volume(value) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid preparation volume.');
    return ReferenceNumbers.display(value);
  },
  format(value, significantDigits) {
    if (!Number.isFinite(value)) throw new Error('Result is outside the supported numeric range.');
    // Explicit precision is reserved for converting editable unit fields;
    // never feed the shorter result display into those linked inputs.
    if (significantDigits !== undefined) return value.toLocaleString('en-US', {maximumSignificantDigits: significantDigits, useGrouping: false});
    return ReferenceNumbers.display(value);
  }
};
if (typeof module !== 'undefined') module.exports = ReferenceNumbers;
