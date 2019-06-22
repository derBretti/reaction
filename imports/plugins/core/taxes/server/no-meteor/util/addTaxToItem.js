/**
 * @summary Sets tax, taxable amount and taxes to item. Mutates `item`.
 * @param {Object[]} itemTaxes Tax reasults
 * @param {Object} item The item
 * @returns {undefined}
 */
export default function addTaxToItem(itemTaxes, item) {
  const itemTax = (itemTaxes && itemTaxes.find((entry) => entry.itemId === item._id)) || {};

  if (itemTax) {
    item.tax = itemTax.tax;
    item.taxableAmount = itemTax.taxableAmount;
    item.taxes = itemTax.taxes;

    if (itemTax.customFields) {
      item.customTaxFields = itemTax.customFields;
    }
  }
}
