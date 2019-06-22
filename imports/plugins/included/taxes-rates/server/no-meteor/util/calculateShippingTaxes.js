import { toFixed } from "accounting-js";
import taxesForItem from "./taxesForItem";

/**
 * @summary Calculate and return taxes for order fulfillmentGroups
 * @param {Object[]} allTaxes Array of taxes
 * @param {Object[]} fulfillmentGroups The fulfillment groups
 * @returns {Object[]|null} Array of calculated tax information, in `TaxServiceItemTax` schema, or `null` if can't calculate
 */
export default function calculateShippingTaxes(allTaxes, fulfillmentGroups) {
  return fulfillmentGroups.map((shipmentMethod) => {
    let taxes;
    if (shipmentMethod.isTaxable) {
      const amount = +toFixed((shipmentMethod.handling || 0) + shipmentMethod.rate, 3);
      taxes = taxesForItem(allTaxes, { ...shipmentMethod, amount });
    } else {
      taxes = [];
    }

    // The taxable amount for the fulfillmentGroup as a whole is the maximum amount that was
    // taxed by any of the found tax jurisdictions.
    const fulfillmentGroupTaxableAmount = taxes.reduce((maxTaxableAmount, taxDef) => {
      if (taxDef.taxableAmount > maxTaxableAmount) return taxDef.taxableAmount;
      return maxTaxableAmount;
    }, 0);

    // The tax for the fulfillmentGroup as a whole is the sum of all applicable taxes.
    const fulfillmentGroupTax = taxes.reduce((sum, taxDef) => sum + taxDef.tax, 0);

    return {
      itemId: shipmentMethod._id,
      tax: fulfillmentGroupTax,
      taxableAmount: fulfillmentGroupTaxableAmount,
      taxes
    };
  });
}
