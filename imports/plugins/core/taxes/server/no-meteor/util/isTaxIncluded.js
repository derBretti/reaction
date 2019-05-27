/**
* @summary Gets setting which determines wheter taxes are included in item prices or not
* @param {Object} collections Map of MongoDB collections
* @param {Object} shopId The shop id
* @returns {Boolean} true if taxes are included, false othewise
*/
export default async function isTaxIncluded(collections, shopId) {
  const { Packages } = collections;
  const plugin = await Packages.findOne({ name: "reaction-taxes", shopId });
  return !!plugin.settings.includeTaxInItemPrice;
}
