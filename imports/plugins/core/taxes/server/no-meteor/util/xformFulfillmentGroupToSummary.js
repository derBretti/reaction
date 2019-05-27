/**
 * @summary adds net total to summary from the `invoice` prop on the provided order fulfillment group
 * @param {Object} context - an object containing the per-request
 * @param {Object} fulfillmentGroup - result of the parent resolver, which is an OrderFulfillmentGroup object in GraphQL schema format
 * @param {Object} summary - summary object
 * @returns {undefined}
 */
export default function xformFulfillmentGroupToSummary(context, fulfillmentGroup, summary) {
  const { invoice } = fulfillmentGroup;
  const { currencyCode, netAmount } = invoice;
  summary.netTotal = (netAmount !== undefined && netAmount !== null) ? { amount: netAmount, currencyCode } : null;
}
