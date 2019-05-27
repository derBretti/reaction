import { xformRateToRateObject } from "@reactioncommerce/reaction-graphql-xforms/core";

/**
 * @name "OrderFulfillmentGroup.summary"
 * @method
 * @memberof Order/GraphQL
 * @summary converts the `invoice` prop on the provided order fulfillment group to a summary object
 * @param {Object} fulfillmentGroup - result of the parent resolver, which is an OrderFulfillmentGroup object in GraphQL schema format
 * @param {Object} args - arguments
 * @param {Object} context - an object containing the per-request
 * @return {Object} A summary object
 */
export default function summary(fulfillmentGroup, args, context) {
  const { getFunctionsOfType } = context;
  const { invoice } = fulfillmentGroup;
  const { currencyCode, discounts, effectiveTaxRate, shipping, subtotal, surcharges, taxableAmount, taxes, total } = invoice;
  const xformedSummary = {
    discountTotal: { amount: discounts, currencyCode },
    effectiveTaxRate: xformRateToRateObject(effectiveTaxRate),
    fulfillmentTotal: { amount: shipping, currencyCode },
    itemTotal: { amount: subtotal, currencyCode },
    surchargeTotal: { amount: surcharges, currencyCode },
    taxableAmount: { amount: taxableAmount, currencyCode },
    taxTotal: { amount: taxes, currencyCode },
    total: { amount: total, currencyCode }
  };
  for (const mutateSummary of getFunctionsOfType("xformFulfillmentGroupToSummary")) {
    mutateSummary(context, fulfillmentGroup, xformedSummary);
  }
  return xformedSummary;
}
