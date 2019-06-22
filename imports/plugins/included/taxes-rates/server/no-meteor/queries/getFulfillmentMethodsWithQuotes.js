import taxesForShop from "../util/taxesForShop";
import calculateShippingTaxes from "/imports/plugins/included/taxes-rates/server/no-meteor/util/calculateShippingTaxes";
import addTaxToShipmentMethod from "/imports/plugins/core/taxes/server/no-meteor/util/addTaxToShipmentMethod";
import getFulfillmentMethodsWithQuotesShipping from "/imports/plugins/core/shipping/server/no-meteor/queries/getFulfillmentMethodsWithQuotes";

/**
 * @name getFulfillmentMethodsWithQuotes
 * @method
 * @summary Gets rates without updating anything and adds taxes
 * @param {Object} commonOrder - details about the purchase a user wants to make.
 * @param {Object} context - Context
 * @return {Array} return updated rates in cart
 * @private
 */
export default async function getFulfillmentMethodsWithQuotes(commonOrder, context) {
  const { collections } = context;
  const { originAddress, shippingAddress, shopId } = commonOrder;
  const rates = await getFulfillmentMethodsWithQuotesShipping(commonOrder, context);

  const allTaxes = await taxesForShop(collections, { originAddress, shippingAddress, shopId });
  const methods = rates.map((rate) => rate.method);
  const shippingTaxes = await calculateShippingTaxes(allTaxes, methods);
  if (shippingTaxes) {
    rates.forEach((rate) => {
      // calculate taxes for shipping
      addTaxToShipmentMethod(shippingTaxes, rate);
    });
  }
  return rates;
}
