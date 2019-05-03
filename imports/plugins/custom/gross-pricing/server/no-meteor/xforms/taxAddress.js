
/**
 * @name taxAddress
 * @summary query the address which is most likely to be relevant for tax calculation,
 * the priority is as follows billing address from cart, shipping address from cart, 
 * account address, the shop's default billing address
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String} [params.accountId] - An account ID
 * @param {String} [params.cartId] - Cart id to include
 * @param {String} [params.token] - Anonymous cart token
 * @param {Object} shop - The shop
 * @return {Object} - An address
 */
export default async function taxAddress(context, { accountId, cartId, token }, shop) {
  let cart;
  const { _id: shopId } = shop;
  if (cartId && token) {
    cart = await context.queries.anonymousCartByCartId(context, { cartId, token });
  } else if (accountId && shopId) {
    cart = await context.queries.accountCartByAccountId(context, { accountId, shopId });
  }
  // use cart address
  if (cart) {
    const { shipping } = cart;
    if (shipping) {
      // use first shipping address for now
      // this needs to change when shipping to multiple tax jurisdictions is allowed 
      const { address } = shipping[0];
      if (address) {
        return address;
      }
    }
  }
  // use account address
  if (accountId) {
    const account = await context.queries.userAccount(context, accountId);
    if (account && account.profile && account.profile.addressBook && account.profile.addressBook[0]) {
      return account.profile.addressBook[0];
    }
  }
  // use shop address
  const { addressBook } = shop;
  address = addressBook.find((address) => address.isBillingDefault);
  return address;
}