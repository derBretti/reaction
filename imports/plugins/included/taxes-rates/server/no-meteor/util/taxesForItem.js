import { toFixed } from "accounting-js";
import Random from "@reactioncommerce/random";

/**
 * Generates an ID unique to a jurisdiction
 * @param {Object} taxDef The tax definition
 * @returns {String} The jurisdictionId
 */
function getJurisdictionId(taxDef) {
  const { country, region, postal } = taxDef;
  let jurisdictionId = "";
  if (country !== undefined && country !== null) {
    jurisdictionId += country;
  } else {
    jurisdictionId += "*";
  }
  if (region !== undefined && region !== null) {
    jurisdictionId += region;
  } else {
    jurisdictionId += "*";
  }
  if (postal !== undefined && postal !== null) {
    jurisdictionId += postal;
  } else {
    jurisdictionId += "*";
  }
  return jurisdictionId;
}

/**
 * @param {Object[]} allTaxes Array of tax definition docs
 * @param {Number} amount The amount to be taxed
 * @param {String} taxCode Tax code applicable to the item
 * @returns {Object[]} applicable taxes for one item, in the `taxes` schema
 */
export default function taxesForItem(allTaxes, { amount, taxCode }) {
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
        country: taxDef.country,
        jurisdictionId: getJurisdictionId(taxDef),
        postal: taxDef.postal,
        region: taxDef.region,
        sourcing: taxDef.taxLocale,
        tax,
        taxableAmount: amount,
        taxName: taxDef.name,
        taxRate: taxDef.rate
      };
    });
}
