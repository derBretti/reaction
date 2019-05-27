import isTaxIncluded from "/imports/plugins/core/taxes/server/no-meteor/util/isTaxIncluded";
import taxesForShop from "/imports/plugins/included/taxes-rates/server/no-meteor/util/taxesForShop";
import { getGrossPrice } from "../xforms/taxes";

/**
 * @method getVariantPrice
 * @summary This method returns the applicable price and currency code for a selected product.
 * @param {Object} context - App context
 * @param {Object} catalogVariant - A selected product variant.
 * @param {String} currencyCode - The currency code in which to get price
 * @param {Object} [params.billingAddress] The biling address relevant for price calculation. See address schema.
 * @param {Object} [params.originAddress] The orgigin address of the order. See address schema.
 * @param {Object} [params.shippingAddress] The shipping address relevant for price calculation. See address schema.
 * @param {String} [params.shopId] The shop ID
 * @return {Object} - A cart item price value.
 */
export default async function getVariantPrice(context, catalogVariant, currencyCode, params) {
  if (!currencyCode) throw new Error("getVariantPrice received no currency code");
  if (!catalogVariant) throw new Error("getVariantPrice received no catalogVariant");
  if (!catalogVariant.pricing) throw new Error(`Catalog variant ${catalogVariant._id} has no pricing information saved`);

  const { price } = catalogVariant.pricing[currencyCode] || {};
  let grossPrice = price;

  if (catalogVariant.isTaxable && params){
    const { billingAddress, originAddress, shippingAddress, shopId } = params;
    const { collections } = context;
    const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
    if (includeTaxInItemPrice) {
      const address = shippingAddress ? shippingAddress : billingAddress;
      const allTaxes = await taxesForShop(collections, { originAddress, shippingAddress: address, shopId });
      grossPrice = getGrossPrice(price, allTaxes, catalogVariant.taxCode);
    }
  }

  return {
    price,
    grossPrice
  };
}
