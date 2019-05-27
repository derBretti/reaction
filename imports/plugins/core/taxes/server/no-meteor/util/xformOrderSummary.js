/**
 * @summary Adds netTotal to summary
 * @param {Object} context - an object containing the per-request
 * @param {Object} order - Result of the parent resolver, which is a Order object in GraphQL schema format
 * @param {Object} summary - An object containing order pricing information from all fulfillmentGroups
 * @returns {undefined}
 */
export default async function orderSummary(context, order, summary) {
  const { currencyCode, shipping: fulfillmentMethods } = order;

  const totalNetAmount = [];
  fulfillmentMethods.forEach((fulfillmentMethod) => {
    const { invoice: { netAmount } } = fulfillmentMethod;
    totalNetAmount.push(netAmount);
  });
  const totalNetTotal = totalNetAmount.reduce((acc, value) => {
    if (acc === null) {
      return value;
    }
    return acc + value;
  }, null);
  summary.netTotal = {
    amount: totalNetTotal,
    currencyCode
  };
}
