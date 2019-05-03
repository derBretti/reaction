import { decodeAccountOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/account";
import { decodeCartOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/cart";
import { decodeCatalogItemOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/catalogItem";
import { decodeShopOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/shop";

/**
 * @name Query.catalogItemProduct
 * @method
 * @memberof Catalog/GraphQL
 * @summary Get a CatalogItemProduct from the Catalog
 * @param {Object} _ - unused
 * @param {ConnectionArgs} args - an object of all arguments that were sent by the client
 * @param {String} args.slugOrId - slug or id for catalog item product
 * @param {Object} context - an object containing the per-request state
 * @return {Promise<Object>} A CatalogItemProduct object
 */
export default async function catalogItemProduct(_, args, context) {
  const { slugOrId, accountId: opaqueAccountId, cartId: opaqueCartId, shopId: opaqueShopId } = args;

  let accountId;
  let productId;
  let productSlug;
  let shopId;
  let cartId;
  try {
    productId = decodeCatalogItemOpaqueId(slugOrId);
  } catch (error) {
    productSlug = slugOrId;
  }
  if (opaqueAccountId) {
    accountId = decodeAccountOpaqueId(opaqueAccountId);
  }
  if (opaqueShopId) {
    shopId = decodeShopOpaqueId(opaqueShopId);
  }
  if (opaqueCartId) {
    cartId = decodeCartOpaqueId(opaqueCartId);
  }

  return context.queries.catalogItemProduct(context, {
    ...args,
    _id: productId,
    accountId,
    cartId,
    shopId,
    slug: productSlug
  });
}
