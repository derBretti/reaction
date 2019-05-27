import taxesGetFulfillmentGroupTaxes from "/imports/plugins/core/taxes/server/no-meteor/mutations/getFulfillmentGroupTaxes";
import isTaxIncluded from "/imports/plugins/core/taxes/server/no-meteor/util/isTaxIncluded";
import taxAddress  from "../xforms/taxAddress";

/**
 * @summary Returns all taxes that apply to a provided order, delegating to a more specific
 *   tax calculation service for the actual calculations.
 * @param {Object} context App context
 * @param {Sting} accountId An account id
 * @param {Object} order Relevant information about an order. This is similar to an OrderFulfillmentGroup type.
 * @param {Boolean} forceZeroes Set to `true` to force tax properties to be added
 *   and set to 0 when no tax plugin is enabled. When calculating tax for a cart, this should be false.
 *   When calculating tax for an order, this should be true.
 * @returns {Object} Calculated tax information. Has `taxSummary` property in `TaxSummary` schema
 *   as well as `itemTaxes` array property with `itemId`, `tax`, `taxableAmount`,
 *   and `taxes` properties on each array item.
 */
export default async function getFulfillmentGroupTaxes(context, { accountId, order, forceZeroes }) {
  const { billingAddress, shopId } = order;

  // use fallback address in order
  if (!order.shippingAddress) {
    if (billingAddress) {
      Object.assign(order, { shippingAddress: billingAddress });
    } else {
      const includeTaxInItemPrice = await isTaxIncluded(context.collections, shopId);
      if (includeTaxInItemPrice) {
        const shop = await context.queries.shopById(context, shopId);
        const { shippingAddress } = await taxAddress(context, { accountId }, shop);
        Object.assign(order, { shippingAddress });
      }
    }
  }

  return taxesGetFulfillmentGroupTaxes(context, { order, forceZeroes });
}
