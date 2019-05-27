import ReactionError from "@reactioncommerce/reaction-error";
import isTaxIncluded from "/imports/plugins/core/taxes/server/no-meteor/util/isTaxIncluded";
import taxAddress  from "../xforms/taxAddress";
import { calculateGrossPricing }  from "../xforms/taxes";

/**
 * @name catalogItemProduct
 * @method
 * @memberof Catalog/NoMeteorQueries
 * @summary query the Catalog for a single Product by id or slug
 * id takes priority if both are provided, throws meteor error if neither
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String} [params._id] - Product id to include
 * @param {String} [param.slug] - Product slug (handle)
 * @param {String} [params.cartId] - Cart id to include
 * @param {String} [params.token] - Anonymous cart token
 * @param {String} [params.accountId] - An account ID
 * @param {String} [params.shopId] - A shop ID
 * @return {Object} - A Product from the Catalog
 */
export default async function catalogItemProduct(context, { _id, slug, cartId, token, accountId, shopId } = {}) {
  const { collections } = context;
  const { Catalog } = collections;

  if (!_id && !slug) {
    throw new ReactionError("invalid-param", "You must provide a product slug or product id");
  }

  const query = {
    "product.isDeleted": { $ne: true },
    "product.isVisible": true
  };

  if (_id) {
    query._id = _id;
  } else {
    query["product.slug"] = slug;
  }

  const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
  if (!includeTaxInItemPrice) {
    return Catalog.findOne(query);
  }
  
  const shop = await context.queries.shopById(context, shopId);
  const { currencies } = shop;
  const { originAddress, shippingAddress } = await taxAddress(context, { accountId, cartId, token }, shop);

  // calculate taxes
  const res = await Catalog.findOne(query);
  if (res && res.product) {
    resArr = await calculateGrossPricing({ currencies, items: [res], originAddress, shippingAddress }, context);
    return resArr[0];
  } else {
    return null;
  }
}
