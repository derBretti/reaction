import taxesForItem from "./taxesForItem";

/**
 * @summary Calculate and return taxes for order items
 * @param {Object[]} allTaxes Array of taxes
 * @param {Object[]} items The items
 * @returns {Object[]|null} Array of calculated tax information, in `TaxServiceItemTax` schema, or `null` if can't calculate
 */
export default function calculateItemTaxes(allTaxes, items) {
  return items.map((item) => {
    let taxes;
    if (item.isTaxable) {
      taxes = taxesForItem(allTaxes, { ...item, amount: item.subtotal.amount });
    } else {
      taxes = [];
    }

    // The taxable amount for the item as a whole is the maximum amount that was
    // taxed by any of the found tax jurisdictions.
    const itemTaxableAmount = taxes.reduce((maxTaxableAmount, taxDef) => {
      if (taxDef.taxableAmount > maxTaxableAmount) return taxDef.taxableAmount;
      return maxTaxableAmount;
    }, 0);

    // The tax for the item as a whole is the sum of all applicable taxes.
    const itemTax = taxes.reduce((sum, taxDef) => sum + taxDef.tax, 0);

    return {
      itemId: item._id,
      tax: itemTax,
      taxableAmount: itemTaxableAmount,
      taxes
    };
  });
}
