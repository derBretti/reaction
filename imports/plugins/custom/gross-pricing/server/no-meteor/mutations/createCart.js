import { Cart as CartSchema } from "/imports/collections/schemas";
import getUpdatedCartItems from "/imports/plugins/core/taxes/server/no-meteor/util/getUpdatedCartItems";
import isTaxIncluded from "/imports/plugins/included/taxes-rates/server/no-meteor/util/isTaxIncluded";
import cartCreateCart from "/imports/plugins/core/cart/server/no-meteor/mutations/createCart";
import taxAddress  from "../xforms/taxAddress";

/**
 * @method createCart
 * @summary Create a new cart for a shop with an initial list of items in it.
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - mutation input
 * @param {String} input.items - An array of cart items to add to the new cart. Must not be empty.
 * @param {String} input.shopId - The ID of the shop that will own this cart
 * @param {Boolean} [input.shouldCreateWithoutItems] - Create even if `items` is empty or becomes empty
 *   due to price mismatches? Default is false. This is for backwards compatibility with old Meteor code
 *   that creates the cart prior to adding items and should not be set to `true` in new code.
 * @return {Promise<Object>} An object with `cart`, `minOrderQuantityFailures`, and `incorrectPriceFailures` properties.
 *   `cart` will be null if all prices were incorrect. If at least one item could be added,
 *   then the cart will have been created and returned, but `incorrectPriceFailures` and
 *   `minOrderQuantityFailures` may still contain other failures that the caller should
 *   optionally retry with the correct price or quantity.
 */
export default async function createCart(context, input) {
  const { cart: newCart, incorrectPriceFailures, minOrderQuantityFailures, token: anonymousAccessToken } = await cartCreateCart(context, input);
  let { shipping } = newCart;
  const { shopId } = input;
  if (!shipping) {
    const { collections } = context;
    const { Cart } = collections;
    const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
    if (includeTaxInItemPrice) {
      const shop = await context.queries.shopById(context, shopId);
      const { accountId } = newCart;
      const { shippingAddress } = await taxAddress(context, { accountId }, shop);
      const itemIds = newCart.items.map((item) => item._id);
      shipping = [{
        address: shippingAddress,
        type: "shipping",
        shopId,
        itemIds
      }];

      const { cartItems, taxSummary } = await getUpdatedCartItems(context, { ...newCart, shipping });

      newCart.items = cartItems;
      newCart.taxSummary = taxSummary;

      const modifier = {
        $set: {
          items: cartItems,
          taxSummary
        }
      };
      CartSchema.validate(modifier, { modifier: true });

      const { matchedCount } = await Cart.updateOne({ _id: newCart._id }, modifier);
      if (matchedCount !== 1) {
        throw new ReactionError("server-error", "Unable to update cart");
      }

    }
  } 

  return { cart: newCart, incorrectPriceFailures, minOrderQuantityFailures, token: anonymousAccessToken };
}
