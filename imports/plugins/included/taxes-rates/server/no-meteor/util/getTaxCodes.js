/**
 * @param {Object} context App context
 * @param {String} shopId Shop to get tax codes for
 * @returns {Object[]} Array of tax codes
 */
export default async function getTaxCodes({ context, shopId }) {
  const { collections } = context;
  const { Taxes } = collections;
  const taxDocs = await Taxes.find({
    shopId
  }).toArray();
  return taxDocs.map((doc) => ({
    code: doc.taxCode,
    label: doc.taxCode
  }));
}
