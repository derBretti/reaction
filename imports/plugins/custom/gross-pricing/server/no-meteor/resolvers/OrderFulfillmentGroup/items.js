import cartItems from "/imports/plugins/core/orders/server/no-meteor/resolvers/OrderFulfillmentGroup/items";
import { xformsFulfillmentGroupWithTaxes } from "../../xforms/taxes";

export default async function items(orderFulfillmentGroup, connectionArgs, context) {
    let transformedCart = await xformsFulfillmentGroupWithTaxes(orderFulfillmentGroup, context);
    return cartItems(transformedCart, connectionArgs, context);
}
