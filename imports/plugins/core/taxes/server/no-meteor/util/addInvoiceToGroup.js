import { toFixed } from "accounting-js";

/**
 * @summary Adds netTotal to invoice
 * @param {String} currencyCode Currency code of totals
 * @param {Object} group The fulfillment group to be mutated
 * @param {Number} groupDiscountTotal Total discount amount for group
 * @param {Number} groupSurchargeTotal Total surcharge amount for group
 * @param {Number} taxableAmount Total taxable amount for group
 * @param {Number} taxTotal Total tax for group
 * @returns {undefined}
 */
export default function addInvoiceToGroup({
  group,
  taxTotal
}) {
  const netAmount = +toFixed(Math.max(0, group.invoice.total - taxTotal), 3);
  group.invoice.netAmount = netAmount;
}
