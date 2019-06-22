/**
 * @summary Sets tax, taxable amount and taxes to shipment mehthod. Mutates `shipmentMethod`.
 * @param {Object[]} itemTaxes Tax results
 * @param {Object} shipmentMethod The item
 * @returns {undefined}
 */
export default function addTaxToShipmentMethod(itemTaxes, shipmentMethod) {
  const itemTax = itemTaxes.find((entry) => entry.itemId === shipmentMethod.method._id) || {};

  shipmentMethod.tax = itemTax.tax;
  shipmentMethod.taxableAmount = itemTax.taxableAmount;
  shipmentMethod.taxes = itemTax.taxes;

  if (itemTax.customFields) {
    shipmentMethod.customTaxFields = itemTax.customFields;
  }
}
