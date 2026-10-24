// Pure preparation math. Clinical defaults and access policies belong to the UI/data layer.
const CRI_UNIT_FACTORS = Object.freeze({
  'mcg/kg/hr': 1, 'mg/kg/hr': 1, 'mcg/kg/min': 60,
  'U/kg/hr': 1, 'mg/kg/day': 1 / 24
});
const CriCalc = {
  positive(...values) {
    if (!values.every(value => Number.isFinite(value) && value > 0)) {
      throw new Error('Enter positive, finite patient and preparation values.');
    }
  },
  checked(result) {
    if (!Object.values(result).every(Number.isFinite)) throw new Error('Inputs exceed calculation limits.');
    return result;
  },
  rate(weight, dose, concentration, unit) {
    this.positive(weight, dose, concentration);
    const factor = CRI_UNIT_FACTORS[unit];
    if (!factor) throw new Error('Unknown dose units.');
    const pump = weight * dose * factor / concentration;
    this.positive(pump);
    return pump;
  },
  mix(stock, concentration, volume) {
    this.positive(stock, concentration, volume);
    if (concentration > stock) throw new Error('Prepared concentration exceeds stock. Choose a lower concentration.');
    const drug = volume * (concentration / stock);
    this.positive(drug);
    return this.checked({ drug, diluent: volume - drug, amount: concentration * volume });
  },
  syringe(weight, dose, stock, hours, pump, capacity) {
    this.positive(weight, dose, stock, hours, pump, capacity);
    const volume = hours * pump;
    const amount = weight * dose * hours;
    const concentration = amount / volume;
    this.positive(volume, amount, concentration);
    if (volume > capacity) throw new Error('Preparation exceeds syringe capacity. Shorten run time, lower pump rate or select a suitable larger syringe.');
    const mixture = this.mix(stock, concentration, volume);
    return this.checked({ ...mixture, volume, concentration, hours, pump, dose });
  },
  timed(weight, dose, stock, hours, volume) {
    this.positive(weight, dose, stock, hours, volume);
    const mg = weight * dose * hours / 24;
    const drug = mg / stock;
    this.positive(mg, drug);
    if (drug > volume) throw new Error('Drug stock will not fit in the final volume.');
    return this.checked({ drug, diluent: volume - drug, mg, pump: volume / hours, hours });
  },
  insulin(weight, dose, stock, volume, pump) {
    this.positive(weight, dose, stock, volume, pump);
    const hours = volume / pump;
    const units = weight * dose * hours;
    const drug = units / stock;
    this.positive(hours, units, drug);
    if (drug > volume) throw new Error('Insulin stock will not fit in the final volume.');
    return this.checked({ hours, units, drug, diluent: volume - drug, concentration: units / volume, pump });
  },
  insulinPreparation({ weight, dose, stock, hours, pump, capacity }) {
    this.positive(hours, pump, capacity);
    const volume = hours * pump;
    if (!Number.isFinite(volume) || volume > capacity) throw new Error('Preparation exceeds container capacity. Review run time, pump rate or container.');
    return { ...this.insulin(weight, dose, stock, volume, pump), volume };
  },
  reglanPreparation({ weight, dose, stock, hours, pump, volume, capacity, bag }) {
    if (!Number.isFinite(dose) || dose < 1 || dose > 2) throw new Error('Reference range: 1–2 mg/kg/day.');
    this.positive(pump);
    if (bag) {
      this.positive(volume);
      hours = volume / pump;
    } else {
      this.positive(hours, capacity);
      volume = hours * pump;
      if (!Number.isFinite(volume) || volume > capacity) throw new Error('Preparation exceeds syringe capacity. Review run time, pump rate or syringe.');
    }
    const preparation = this.timed(weight, dose, stock, hours, volume);
    return this.checked({ ...preparation, volume, concentration: preparation.mg / volume });
  }
};
if (typeof module !== 'undefined') module.exports = CriCalc;
