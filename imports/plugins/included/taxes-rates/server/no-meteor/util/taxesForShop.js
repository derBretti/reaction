/**
 * @summary Gets all applicable tax definitions based on shop ID and shipping address of a fulfillment group
 * @param {Object} collections Map of MongoDB collections
 * @param {Object} shippingAddress The address to apply taxes for
 * @param {String} shopId The shop id
 * @returns {Object[]} Array of tax definition docs
 */
export default async function taxesForShop(collections, { shippingAddress, shopId }) {
  const { Taxes } = collections;

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

