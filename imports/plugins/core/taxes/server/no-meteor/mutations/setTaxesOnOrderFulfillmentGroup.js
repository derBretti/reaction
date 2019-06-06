import addTaxToItem from "../util/addTaxToItem";

/**
 * @summary Adds taxes to an order fulfillment group. Mutates `group`.
 * @param {Object} context - an object containing the per-request state
 * @param {Object} group Fulfillment group object
 * @param {Object} commonOrder The group in CommonOrder schema
 * @returns {Object} An object with `taxableAmount` and `taxTotal` properties. Also mutates `group`.
 */
export default async function setTaxesOnOrderFulfillmentGroup(context, { group, commonOrder }) {
  const { itemTaxes, shippingTaxes, taxSummary } = await context.mutations.getFulfillmentGroupTaxes(context, { order: commonOrder, forceZeroes: true });
  // let itemsTaxTotal = 0;
  group.items.map((item) => addTaxToItem(itemTaxes, item));
  addTaxToItem(shippingTaxes, group.shipmentMethod);

  group.taxSummary = taxSummary;

  return {
    // itemsTaxTotal,
    // shippingTaxTotal,
    taxableAmount: taxSummary.taxableAmount,
    taxTotal: taxSummary.tax
  };
}
