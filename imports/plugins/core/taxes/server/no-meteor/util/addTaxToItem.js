/**
 * @summary Sets tax, taxable amount and taxes to item. Mutates `item`.
 * @param {Object[]]} itemTaxes Tax reasults
 * @param {Object} item The item
 * @returns {udnefined}
 */
export default function addTaxToItem(itemTaxes, item) {
  const itemTax = itemTaxes.find((entry) => entry.itemId === item._id) || {};

  item.tax = itemTax.tax;
  item.taxableAmount = itemTax.taxableAmount;
  item.taxes = itemTax.taxes;

  if (itemTax.customFields) {
    item.customTaxFields = itemTax.customFields;
  }
}
