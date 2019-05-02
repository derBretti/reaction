import { toFixed } from "accounting-js";
import Random from "@reactioncommerce/random";
import taxesForShop from "./taxesForShop";

/**
 * @param {Object[]} allTaxes Array of tax definition docs
 * @param {Number} amount The amount to be taxed
 * @param {String} taxCode Tax code applicable to the item
 * @returns {Object[]} applicable taxes for one item, in the `taxes` schema
 */
export function taxesForItem(allTaxes, { amount, taxCode }) {
  return allTaxes
    .filter((taxDef) => !taxDef.taxCode || taxDef.taxCode === taxCode)
    .map((taxDef) => {
      let tax = 0;
      if (taxDef.rateIsTaxInclusive) {
        tax = Number(toFixed(amount * taxDef.rate / (1 - taxDef.rate), 2));
      } else {
        tax = Number(toFixed(amount * taxDef.rate, 2));
      }
      return {
        _id: Random.id(),
        jurisdictionId: taxDef._id,
        sourcing: taxDef.taxLocale,
        tax,
        taxableAmount: amount,
        taxName: taxDef.name,
        taxRate: taxDef.rate
      };
    });
}

/**
 * @summary Calculate and return taxes for order items
 * @param {Object} context App context
 * @param {Object} shippingAddress The address to apply taxes for
 * @param {String} shopId The shop id
 * @param {Object[]} items The items
 * @returns {Object[]|null} Array of calculated tax information, in `TaxServiceItemTax` schema, or `null` if can't calculate
 */
export default async function calculateItemTaxes(context, { shippingAddress, shopId, items }) {
  const allTaxes = await taxesForShop(context.collections, { shippingAddress, shopId });

  return items.map((item) => {
    let taxes;
    if (item.isTaxable) {
      taxes = taxesForItem(allTaxes, { ...item, amount: item.subtotal.amount });
    } else {
      taxes = [];
    }

    // The taxable amount for the item as a whole is the maximum amount that was
    // taxed by any of the found tax jurisdictions.
    const itemTaxableAmount = taxes.reduce((maxTaxableAmount, taxDef) => {
      if (taxDef.taxableAmount > maxTaxableAmount) return taxDef.taxableAmount;
      return maxTaxableAmount;
    }, 0);

    // The tax for the item as a whole is the sum of all applicable taxes.
    const itemTax = taxes.reduce((sum, taxDef) => sum + taxDef.tax, 0);

    return {
      itemId: item._id,
      tax: itemTax,
      taxableAmount: itemTaxableAmount,
      taxes
    };
  });
}
