// Merck Veterinary Manual, Chocolate Toxicosis in Animals, updated February 2026.
// Values are TOTAL methylxanthines (theobromine + caffeine), not theobromine alone.
const CHOCOLATE_PRODUCTS = Object.freeze({
  milk: { name: 'Milk chocolate', low: 2.3, high: 2.3 },
  dark: { name: 'Semisweet / sweet dark · generic', low: 5.3, high: 5.6 },
  baking: { name: 'Unsweetened / baking chocolate', low: 15.5, high: 15.5 },
  cocoa: { name: 'Cocoa powder', low: 28.5, high: 28.5 },
  white: { name: 'White chocolate', low: .04, high: .04 },
  hulls: { name: 'Cocoa bean hulls', low: 9, high: 9 },
  percent: { name: 'Chocolate with known cocoa %' }
});
const ChocolateCalc = {
  gramsPerOz: 28.349523125,
  products: CHOCOLATE_PRODUCTS,
  toGrams(amount, unit) {
    if (!Number.isFinite(amount) || amount < 0 || !['oz','g'].includes(unit)) throw new Error('Enter a nonnegative amount in oz or grams.');
    const grams = unit === 'oz' ? amount * this.gramsPerOz : amount;
    if (!Number.isFinite(grams)) throw new Error('Amount exceeds numeric limits.');
    return grams;
  },
  concentration(type, percent) {
    const product = this.products[type];
    if (!product) throw new Error('Select the chocolate source for every entry.');
    if (type !== 'percent') return {low:product.low, high:product.high};
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error('Enter a cocoa percentage greater than 0 and up to 100.');
    const estimate = 15.5 * percent / 100;
    return {low:estimate, high:estimate};
  },
  band(dose) {
    if (!Number.isFinite(dose) || dose < 0) throw new Error('Invalid exposure estimate.');
    return dose >= 100 ? 'lethal' : dose >= 60 ? 'neuro' : dose >= 40 ? 'cardiac' : dose >= 20 ? 'gi' : 'below';
  },
  // Equal-width reference bands; interpolate within each band, capped at 200 mg/kg.
  position(dose) {
    this.band(dose); // Apply the same finite, nonnegative validation.
    const edges=[0,20,40,60,100,200];
    if(dose>=200)return 1;
    const i=edges.findIndex((edge,index)=>index<5 && dose<edges[index+1]);
    return (i+(dose-edges[i])/(edges[i+1]-edges[i]))/5;
  },
  estimate({species,weight,items}) {
    if (species !== 'Dog') throw new Error(species === 'Cat' ? 'Canine calculator only. Merck’s numeric risk references here are for dogs; no feline risk estimate is assigned.' : 'Select Dog and enter weight in the shared banner.');
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('Enter a positive patient weight.');
    if (!Array.isArray(items) || !items.length) throw new Error('Add at least one chocolate entry.');
    let lowMg=0,highMg=0,grams=0;
    const rows=items.map(item=>{
      if (!Number.isFinite(item.grams) || item.grams < 0) throw new Error('Enter an amount for every chocolate entry.');
      const c=this.concentration(item.type,item.percent),low=item.grams*c.low,high=item.grams*c.high;
      lowMg+=low;highMg+=high;grams+=item.grams;
      return {...item,concentration:c,lowMg:low,highMg:high};
    });
    const lowDose=lowMg/weight,highDose=highMg/weight;
    if (![lowMg,highMg,grams,lowDose,highDose].every(Number.isFinite)) throw new Error('Inputs exceed calculation limits.');
    return {rows,grams,lowMg,highMg,lowDose,highDose,band:this.band(highDose),lowBand:this.band(lowDose)};
  }
};
if (typeof module !== 'undefined') module.exports=ChocolateCalc;
