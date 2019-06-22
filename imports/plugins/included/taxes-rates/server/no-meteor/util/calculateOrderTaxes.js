import Random from "@reactioncommerce/random";
import calculateItemTaxes from "./calculateItemTaxes";
import calculateShippingTaxes from "./calculateShippingTaxes";
import isTaxIncluded from "/imports/plugins/core/taxes/server/no-meteor/util/isTaxIncluded";
import taxesForShop from "./taxesForShop";

const TAX_SERVICE_NAME = "custom-rates";

/**
 * @summary Calculate and return taxes for an order
 * @param {Object} context App context
 * @param {Object} order The order
 * @returns {Object|null} Calculated tax information, in `TaxServiceResult` schema, or `null` if can't calculate
 */
export default async function calculateOrderTaxes({ context, order }) {
  const { fulfillmentPrices, items, originAddress, fulfillmentMethod, shippingAddress, shopId } = order;

  if (!shippingAddress && !originAddress) return null;

  const includeTaxInItemPrice = await isTaxIncluded(context.collections, shopId);

  const allTaxes = await taxesForShop(context.collections, { originAddress, shippingAddress, shopId });

  // calculate line item taxes
  const itemTaxes = await calculateItemTaxes(allTaxes, items);

  // calculate taxes for shipping
  const shippingTaxes = fulfillmentMethod ? await calculateShippingTaxes(allTaxes, [fulfillmentMethod]) : [];

  let totalTaxableAmount = 0;
  let totalTax = 0;
  const groupTaxes = {};

  [...itemTaxes, ...(shippingTaxes || [])].forEach((itemTax) => {
    const { tax, taxableAmount, taxes } = itemTax;
    // Update the group taxes list
    taxes.forEach((taxDef) => {
      const { jurisdictionId } = taxDef;
      if (groupTaxes[jurisdictionId]) {
        groupTaxes[jurisdictionId].tax += taxDef.tax;
        groupTaxes[jurisdictionId].taxableAmount += taxDef.taxableAmount;
      } else {
        groupTaxes[jurisdictionId] = {
          ...taxDef,
          _id: Random.id()
        };
      }
    });
    totalTaxableAmount += taxableAmount;
    totalTax += tax;
  });

  // Eventually tax shipping as and where necessary here. Not yet implemented.
  // Assume shipping to be tax free for now.
  let netAmount;
  if (includeTaxInItemPrice) {
    // no matter if item is taxable, add subtotal to net amount
    netAmount = items.reduce((sum, item) => sum + item.subtotal.amount, 0);
    if (fulfillmentPrices.total) {
      netAmount += fulfillmentPrices.total.amount;
    }
  }

  const taxResult = {
    itemTaxes,
    taxSummary: {
      calculatedAt: new Date(),
      calculatedByTaxServiceName: TAX_SERVICE_NAME,
      netAmount,
      tax: totalTax,
      taxableAmount: totalTaxableAmount,
      taxes: Object.values(groupTaxes)
    }
  };

  if (shippingTaxes && Array.isArray(shippingTaxes)) {
    taxResult.shippingTaxes = shippingTaxes;
  }
  return taxResult;
}
