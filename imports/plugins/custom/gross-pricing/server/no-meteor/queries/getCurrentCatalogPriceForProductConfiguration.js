import findProductAndVariant from "/imports/plugins/core/catalog/server/no-meteor/utils/findProductAndVariant";
import isTaxIncluded from "/imports/plugins/core/taxes/server/no-meteor/util/isTaxIncluded";
import taxesForShop from "/imports/plugins/included/taxes-rates/server/no-meteor/util/taxesForShop";
import { getGrossPrice } from "../xforms/taxes";

/**
 * @summary Returns the current price in the Catalog for the given product configuration
 * @param {Object} productConfiguration The ProductConfiguration object
 * @param {String} currencyCode The currency code
 * @param {Object} collections Map of MongoDB collections
 * @param {Object} billingAddress The biling address relevant for price calculation
 * @param {Object} shippingAddress The biling address relevant for price calculation
 * @returns {Object} Object with `price` as the current price in the Catalog for the given product configuration.
 *   Also returns catalogProduct and catalogProductVariant docs in case you need them.
 */
export default async function getCurrentCatalogPriceForProductConfiguration(productConfiguration, currencyCode, collections, { billingAddress, shippingAddress, shopId }) {
  const { productId, productVariantId } = productConfiguration;
  const {
    catalogProduct,
    variant: catalogProductVariant
  } = await findProductAndVariant(collections, productId, productVariantId);

  const variantPriceInfo = (catalogProductVariant.pricing && catalogProductVariant.pricing[currencyCode]) || {};
  const price = variantPriceInfo.price || catalogProductVariant.price;
  let grossPrice = price;
  if (catalogProductVariant.isTaxable){
    const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
    if (includeTaxInItemPrice) {
      const address = shippingAddress ? shippingAddress : billingAddress;
      const allTaxes = await taxesForShop(collections, { shippingAddress: address, shopId });
      grossPrice = getGrossPrice(price, allTaxes, catalogProductVariant.taxCode);
    }
  }

  return {
    catalogProduct,
    catalogProductVariant,
    price,
    grossPrice
  };
}
