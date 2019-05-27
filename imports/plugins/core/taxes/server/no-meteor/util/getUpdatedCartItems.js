import xformCartGroupToCommonOrder from "/imports/plugins/core/cart/server/no-meteor/util/xformCartGroupToCommonOrder";
import addTaxToItem from "./addTaxToItem";

/**
 * @summary Returns `cart.items` with tax-related props updated on them
 * @param {Object} context App context
 * @param {Object} cart The cart
 * @returns {Object[]} Updated items array
 */
export default async function getUpdatedCartItems(context, cart) {
  const taxResultsByGroup = await Promise.all((cart.shipping || []).map(async (group) => {
    const order = await xformCartGroupToCommonOrder(cart, group, context);
    const { accountId } = cart;
    return context.mutations.getFulfillmentGroupTaxes(context, { accountId, order, forceZeroes: false });
  }));

  // Add tax properties to all items in the cart, if taxes were able to be calculated
  const cartItems = (cart.items || []).map((item) => {
    const newItem = { ...item };
    taxResultsByGroup.forEach((group) => {
      addTaxToItem(group.itemTaxes, newItem);
    });
    return newItem;
  });

  // Merge all group tax summaries to a single one for the whole cart
  let combinedSummary = { tax: 0, taxableAmount: 0, taxes: [] };
  for (const { taxSummary } of taxResultsByGroup) {
    // groupSummary will be null if there wasn't enough info to calc taxes
    if (!taxSummary) {
      combinedSummary = null;
      break;
    }

    if (taxSummary.netAmount !== undefined && taxSummary.netAmount !== null) {
      if (combinedSummary.netAmount === undefined) {
        combinedSummary.netAmount = taxSummary.netAmount;
      } else {
        combinedSummary.netAmount += taxSummary.netAmount;
      }
    }

    combinedSummary.calculatedAt = taxSummary.calculatedAt;
    combinedSummary.calculatedByTaxServiceName = taxSummary.calculatedByTaxServiceName;
    combinedSummary.tax += taxSummary.tax;
    combinedSummary.taxableAmount += taxSummary.taxableAmount;
    combinedSummary.taxes = combinedSummary.taxes.concat(taxSummary.taxes);

    if (taxSummary.customFields) {
      if (!combinedSummary.customFields) combinedSummary.customFields = {};
      Object.assign(combinedSummary.customFields, taxSummary.customFields);
    }
  }

  return { cartItems, taxSummary: combinedSummary };
}
