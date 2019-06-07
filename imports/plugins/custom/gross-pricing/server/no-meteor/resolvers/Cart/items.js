import cartItems from "/imports/plugins/core/cart/server/no-meteor/resolvers/Cart/items";
import { xformsCartWithTaxes } from "../../xforms/taxes";

export default async function items(cart, connectionArgs, context) {
    let transformedCart = await xformsCartWithTaxes(cart, context);
    return cartItems(transformedCart, connectionArgs, context);
}
