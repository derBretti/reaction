import isTaxIncluded from "./isTaxIncluded";
import calculateGrossShipment from "./calculateGrossShipment";

/**
 * @summary adds tax to shipment method if it should be included
 * @param {Object} context - an object containing the per-request
 * @param {Object} fulfillmentOption - selected fulfillmentOption
 * @param {Object} fulfillmentGroup - result of the parent resolver, which is an OrderFulfillmentGroup object in GraphQL schema format
 * @returns {undefined}
 */
export default async function xformFulfillmentGroup(context, fulfillmentOption, fulfillmentGroup) {
  const { collections, shopId } = context;
  const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);

  if (includeTaxInItemPrice) {
    fulfillmentGroup.price.amount = calculateGrossShipment(fulfillmentOption);
  }
  return fulfillmentGroup;
}
