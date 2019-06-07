import _ from "lodash";
import { xformOrderItems } from "@reactioncommerce/reaction-graphql-xforms/order";
import formatMoney from "/imports/utils/formatMoney";
import { getPaymentMethodConfigByName } from "/imports/plugins/core/payments/server/no-meteor/registration";

/**
 * @name formatDateForEmail
 * @method
 * @private
 * @summary helper to generate the order date as a string for emails
 * @param {Date} date The date to format
 * @return {String} return date formatted as a MM/DD/YYYY string
 */
function formatDateForEmail(date) {
  const emailDate = new Date(date); // Clone date
  const year = emailDate.getFullYear(); // get year
  const month = emailDate.getMonth() + 1; // get month number + 1 (js has 0 indexed months)
  const day = emailDate.getDate(); // get day number (js has 1 indexed days)

  const paddedMonth = month > 9 ? `${month}` : `0${month}`; // generate padded month if necessary
  const paddedDay = day > 9 ? `${day}` : `0${day}`; // generate padded days if necessary

  return `${paddedMonth}/${paddedDay}/${year}`; // return MM/DD/YYYY formatted string
}

/**
 * @summary Calculates price according to user settings
 * @param {Object} item - The Item
 * @param {Number} userCurrencyExchangeRate - The exchange rate
 * @param {Stirng} userCurrency - The currency code
 * @param {Boolean} isTaxIncluded - If true, displayAmount includes tax, displayNetAmount is included
 * @returns {Object} Price object to use when rendering email templates
 */
function getItemPrice(item, userCurrencyExchangeRate, userCurrency, isTaxIncluded) {
  let netPrice = null;
  let price;
  if (isTaxIncluded) {
    netPrice = item.price.amount;
    price = item.price.amount + (item.tax / item.quantity);
  } else {
    price = item.price.amount;
  }
  const itemPrice = {
    ...item.price,
    displayAmount: formatMoney(price * userCurrencyExchangeRate, userCurrency)
  };
  if (netPrice !== null) {
    itemPrice.displayNetAmount = formatMoney(netPrice * userCurrencyExchangeRate, userCurrency);
  }
  return itemPrice;
}

/**
 * @summary Builds data for rendering order emails
 * @param {Object} context - App context
 * @param {Object} input - Necessary input
 * @param {Object} input.order - The order document
 * @returns {Object} Data object to use when rendering email templates
 */
export default async function getDataForOrderEmail(context, { order }) {
  const { collections, getAbsoluteUrl } = context;
  const { Packages, Shops } = collections;

  // Get Shop information
  const shop = await Shops.findOne({ _id: order.shopId });
  const plugin = await Packages.findOne({ name: "reaction-taxes", shopId: order.shopId });
  const isTaxIncluded = plugin && !!plugin.settings.includeTaxInItemPrice;
  // TODO need to make this fully support multiple fulfillment groups. Now it's just collapsing into one
  const amount = order.shipping.reduce((sum, group) => sum + group.invoice.total, 0);
  const discounts = order.shipping.reduce((sum, group) => sum + group.invoice.discounts, 0);
  let netAmountAmount = null;
  let shippingNetAmountAmount = null;

  // net sums
  let subtotal = order.shipping.reduce((sum, group) => sum + group.invoice.subtotal, 0);
  let shippingCost = order.shipping.reduce((sum, group) => sum + group.invoice.shipping, 0);
  const taxes = order.shipping.reduce((sum, group) => sum + group.invoice.taxes, 0);
  let total = subtotal + shippingCost - discounts;

  if (isTaxIncluded) {
    // include taxes in sums and
    netAmountAmount = order.shipping.reduce((sum, group) => {
      if (group.invoice.netAmount !== undefined && group.invoice.netAmount !== null) {
        return sum + group.invoice.netAmount;
      }
      return sum;
    }, 0);
    subtotal += order.shipping.reduce((sum, group) => sum + group.items.reduce((tax, item) => tax + item.tax, 0), 0);
    shippingNetAmountAmount = shippingCost;
    shippingCost += order.shipping.reduce((sum, group) => sum + group.shipmentMethod.tax, 0);
  }
  // add tax to total
  total += taxes;

  const { address: shippingAddress, shipmentMethod, tracking } = order.shipping[0];
  const { carrier } = shipmentMethod;
  const [firstPayment] = (order.payments || []);
  const { address: paymentBillingAddress, currency } = firstPayment || {};

  const shippingAddressForEmail = shippingAddress ? {
    address: `${shippingAddress.address1}${shippingAddress.address2 ? ` ${shippingAddress.address2}` : ""}`,
    city: shippingAddress.city,
    region: shippingAddress.region,
    postal: shippingAddress.postal
  } : null;

  let billingAddressForEmail = null;
  if (order.billingAddress) {
    billingAddressForEmail = {
      address: `${order.billingAddress.address1}${order.billingAddress.address2 ? ` ${order.billingAddress.address2}` : ""}`,
      city: order.billingAddress.city,
      region: order.billingAddress.region,
      postal: order.billingAddress.postal
    };
  } else if (paymentBillingAddress) {
    billingAddressForEmail = {
      address: `${paymentBillingAddress.address1}${paymentBillingAddress.address2 ? ` ${paymentBillingAddress.address2}` : ""}`,
      city: paymentBillingAddress.city,
      region: paymentBillingAddress.region,
      postal: paymentBillingAddress.postal
    };
  }

  const refunds = [];

  if (Array.isArray(order.payments)) {
    const promises = order.payments.map(async (payment) => {
      const shopRefunds = await getPaymentMethodConfigByName(payment.name).functions.listRefunds(context, payment);
      const shopRefundsWithPaymentId = shopRefunds.map((shopRefund) => ({ ...shopRefund, paymentId: payment._id }));
      refunds.push(...shopRefundsWithPaymentId);
    });
    await Promise.all(promises);
  }

  const refundTotal = refunds.reduce((acc, refund) => acc + refund.amount, 0);

  const userCurrency = (currency && currency.userCurrency) || shop.currency;

  // Get user currency exchange rate at time of transaction
  const userCurrencyExchangeRate = (currency && currency.exchangeRate) || 1;

  // Combine same products into single "product" for display purposes
  const combinedItems = [];

  // Transform all order items to add images, etc.
  const adjustedOrderGroups = await Promise.all(order.shipping.map(async (group) => {
    let items = await xformOrderItems(context, group.items);

    items = items.map((item) => ({
      ...item,
      placeholderImage: getAbsoluteUrl("/resources/placeholder.gif"),
      price: getItemPrice(item, userCurrencyExchangeRate, userCurrency, isTaxIncluded),
      // These next two are for backward compatibility with existing email templates.
      // New templates should use `imageURLs` instead.
      productImage: item.imageURLs && item.imageURLs.large,
      variantImage: item.imageURLs && item.imageURLs.large
    }));

    return { ...group, items };
  }));

  // Loop through all items in the order. The items are split into individual items
  const orderItems = adjustedOrderGroups.reduce((list, group) => [...list, ...group.items], []);
  for (const orderItem of orderItems) {
    // Find an existing item in the combinedItems array
    const foundItem = combinedItems.find((combinedItem) => combinedItem.variantId === orderItem.variantId);

    // Increment the quantity count for the duplicate product variants
    if (foundItem) {
      foundItem.quantity += orderItem.quantity;
      foundItem.subtotal.amount += orderItem.subtotal.amount;
      foundItem.tax += orderItem.tax;
    } else {
      // Otherwise push the unique item into the combinedItems array
      // Set net price
      combinedItems.push(orderItem);
    }
  }

  // add readable subtotal
  combinedItems.forEach((item) => {
    let subtotalAmount;
    let netSubtotalAmount = null;
    if (isTaxIncluded) {
      netSubtotalAmount = item.subtotal.amount;
      subtotalAmount = item.subtotal.amount + item.tax;
    } else {
      subtotalAmount = item.subtotal.amount;
    }
    item.subtotal.displayAmount = formatMoney(subtotalAmount * userCurrencyExchangeRate, userCurrency)
    if (netSubtotalAmount !== null) {
      item.subtotal.displayNetAmount = formatMoney(netSubtotalAmount * userCurrencyExchangeRate, userCurrency);
    }
  });

  let netAmount;
  let shippingNetAmount;
  if (netAmountAmount !== null) {
    netAmount = formatMoney(netAmountAmount * userCurrencyExchangeRate, userCurrency);
  }
  if (shippingNetAmountAmount !== null) {
    shippingNetAmount = formatMoney(shippingNetAmountAmount * userCurrencyExchangeRate, userCurrency);
  }
  const copyrightDate = new Date().getFullYear();

  // Merge data into single object to pass to email template
  return {
    // Shop Data
    shop,
    contactEmail: shop.emails[0].address,
    homepage: getAbsoluteUrl("/"),
    copyrightDate,
    legalName: _.get(shop, "addressBook[0].company"),
    physicalAddress: {
      address: `${_.get(shop, "addressBook[0].address1")} ${_.get(shop, "addressBook[0].address2")}`,
      city: _.get(shop, "addressBook[0].city"),
      region: _.get(shop, "addressBook[0].region"),
      postal: _.get(shop, "addressBook[0].postal")
    },
    shopName: shop.name,
    socialLinks: {
      display: true,
      facebook: {
        display: true,
        icon: getAbsoluteUrl("/resources/email-templates/facebook-icon.png"),
        link: "https://www.facebook.com"
      },
      googlePlus: {
        display: true,
        icon: getAbsoluteUrl("/resources/email-templates/google-plus-icon.png"),
        link: "https://plus.google.com"
      },
      twitter: {
        display: true,
        icon: getAbsoluteUrl("/resources/email-templates/twitter-icon.png"),
        link: "https://www.twitter.com"
      }
    },
    // Order Data
    order: {
      ...order,
      shipping: adjustedOrderGroups
    },
    billing: {
      address: billingAddressForEmail,
      netAmount,
      isTaxIncluded,
      payments: (order.payments || []).map((payment) => ({
        displayName: payment.displayName,
        displayAmount: formatMoney(payment.amount * userCurrencyExchangeRate, userCurrency)
      })),
      subtotal: formatMoney(subtotal * userCurrencyExchangeRate, userCurrency),
      shipping: formatMoney(shippingCost * userCurrencyExchangeRate, userCurrency),
      shippingNetAmount,
      taxes: formatMoney(taxes * userCurrencyExchangeRate, userCurrency),
      discounts: formatMoney(discounts * userCurrencyExchangeRate, userCurrency),
      refunds: formatMoney(refundTotal * userCurrencyExchangeRate, userCurrency),
      total: formatMoney(total * userCurrencyExchangeRate, userCurrency),
      adjustedTotal: formatMoney(
        (amount - refundTotal) * userCurrencyExchangeRate,
        userCurrency
      )
    },
    combinedItems,
    orderDate: formatDateForEmail(order.createdAt),
    orderUrl: `cart/completed?_id=${order.cartId}`,
    shipping: {
      address: shippingAddressForEmail,
      carrier,
      tracking
    }
  };
}
