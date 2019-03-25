import Random from "@reactioncommerce/random";

const TAX_SERVICE_NAME = "custom-rates";

/**
 * @summary Gets all applicable tax definitions based on shop ID and shipping address of a fulfillment group
 * @param {Object} collections Map of MongoDB collections
 * @param {Object} order The order
 * @returns {Object[]} Array of tax definition docs
 */
async function getTaxesForShop(collections, order) {
  const { Taxes } = collections;
  const { shippingAddress, shopId } = order;

  // Find all defined taxes where the shipping address is a match
  const taxDocs = await Taxes.find({
    shopId,
    taxLocale: "destination",
    $or: [{
      postal: shippingAddress.postal
    }, {
      postal: null,
      region: shippingAddress.region,
      country: shippingAddress.country
    }, {
      postal: null,
      region: null,
      country: shippingAddress.country
    }]
  }).toArray();

  // Rate is entered and stored in the database as a percent. Convert to ratio.
  // Also add a name. Someday should allow a shop operator to enter the name.
  return taxDocs.map((doc) => ({
    ...doc,
    rate: doc.rate / 100,
    name: `${doc.postal || ""} ${doc.region || ""} ${doc.country || ""}`.trim().replace(/\s\s+/g, " ")
  }));
}

/**
 * @summary Calculate and return taxes for an order
 * @param {Object} context App context
 * @param {Object} order The order
 * @returns {Object|null} Calculated tax information, in `TaxServiceResult` schema, or `null` if can't calculate
 */
export default async function calculateOrderTaxes({ context, order }) {
  const { items, shippingAddress } = order;

  if (!shippingAddress) return null;

  const allTaxes = await getTaxesForShop(context.collections, order);

  /**
   * @param {Object} item The item
   * @returns {Object[]} applicable taxes for one item, in the `taxes` schema
   */
  function taxesForItem(item) {
    if (!item.isTaxable) return [];

    return allTaxes
      .filter((taxDef) => !taxDef.taxCode || taxDef.taxCode === item.taxCode)
      .map((taxDef) => {
        let tax = 0;
        let taxableAmount = null;
        if (taxDef.rateIsTaxInclusive) {
          tax = item.subtotal.amount * taxDef.rate / (1 + taxDef.rate);
          // taxable amount is calculated when all inclusive taxes are calculated
        } else {
          taxableAmount = item.subtotal.amount;
          tax = item.subtotal.amount * taxDef.rate;
        }
        return {
          _id: Random.id(),
          jurisdictionId: taxDef._id,
          sourcing: taxDef.taxLocale,
          tax,
          taxableAmount,
          taxName: taxDef.name,
          taxRate: taxDef.rate
        };
      });
  }

  // calculate line item taxes
  let totalTaxableAmount = 0;
  let totalTax = 0;
  const groupTaxes = {};
  const itemTaxes = items.map((item) => {
    let itemTaxableAmount;
    let itemTax = 0;
    const taxes = taxesForItem(item);
    if (taxes.length === 0) {
      itemTaxableAmount = 0;
    } else {
      const itemInclusiveTax = taxes.reduce((inclusiveTax, taxDef) => {
        if (taxDef.taxableAmount === null) {
          return inclusiveTax + taxDef.tax;
        }
        return 0;
      }, 0);

      // The taxable amount for the item as a whole is the subtotal amount
      // minus all inclusive taxes if the item is taxable.
      itemTaxableAmount = item.subtotal.amount - itemInclusiveTax;

      // Update the group taxes list
      taxes.forEach((taxDef) => {
        // set taxable amount for inclusive taxes
        if (taxDef.taxableAmount === null) {
          taxDef.taxableAmount = itemTaxableAmount;
        }
        const { jurisdictionId, tax } = taxDef;
        if (groupTaxes[jurisdictionId]) {
          groupTaxes[jurisdictionId].tax += tax;
          groupTaxes[jurisdictionId].taxableAmount += taxDef.taxableAmount;
        } else {
          groupTaxes[jurisdictionId] = {
            ...taxDef,
            _id: Random.id()
          };
        }
        // The tax for the item as a whole is the sum of all applicable taxes.
        itemTax += tax;
      });

      totalTaxableAmount += itemTaxableAmount;
    }

    totalTax += itemTax;

    return {
      itemId: item._id,
      tax: itemTax,
      taxableAmount: itemTaxableAmount,
      taxes
    };
  });

  // Eventually tax shipping as and where necessary here. Not yet implemented.

  return {
    itemTaxes,
    taxSummary: {
      calculatedAt: new Date(),
      calculatedByTaxServiceName: TAX_SERVICE_NAME,
      tax: totalTax,
      taxableAmount: totalTaxableAmount,
      taxes: Object.values(groupTaxes)
    }
  };
}
