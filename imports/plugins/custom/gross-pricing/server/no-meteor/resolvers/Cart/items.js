import cartItems from "/imports/plugins/core/cart/server/no-meteor/resolvers/Cart/items";
import { xformsWithTaxes } from "../../xforms/taxes";

export default async function items(cart, connectionArgs, context) {
    let transformedCart = await xformsWithTaxes(cart, context);
    return cartItems(transformedCart, connectionArgs, context);
}
