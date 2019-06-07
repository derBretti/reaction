import { Meteor } from "meteor/meteor";
import { Reaction } from "/client/api";

/**
 * @param {String} orderId The order ID
 * @param {String} paymentId The ID of the payment to approve
 * @returns {Promise<null>} null
 */
export async function approvePayment(orderId, paymentId) {
  return new Promise((resolve, reject) => {
    Meteor.call("orders/approvePayment", orderId, paymentId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * @method getOrderRiskBadge
 * @private
 * @summary Selects appropriate color badge (e.g  danger, warning) value based on risk level
 * @param {string} riskLevel - risk level value on the payment
 * @return {string} label - style color class based on risk level
 */
export function getOrderRiskBadge(riskLevel) {
  let label;
  switch (riskLevel) {
    case "high":
      label = "danger";
      break;
    case "elevated":
      label = "warning";
      break;
    default:
      label = "";
  }
  return label;
}

/**
 * @method getOrderRiskStatus
 * @private
 * @summary Gets the risk label on the payment object for a shop on an order.
 * An empty string is returned if the value is "normal" because we don't flag a normal charge
 * @param {object} order - order object
 * @return {string} label - risk level value (if risk level is not normal)
 */
export function getOrderRiskStatus(order) {
  const groupForShop = order.shipping.find((group) => group.shopId === Reaction.getShopId());
  const { riskLevel } = groupForShop.payment || {};

  // normal transactions do not need to be flagged
  if (!riskLevel || riskLevel === "normal") {
    return "";
  }

  return riskLevel;
}

/**
 * @method getTaxRiskStatus
 * @private
 * @summary Gets the tax status of the order.
 * @param {object} order - order object
 * @return {boolean} label - true if the tax was not submitted by user.
 */
export function getTaxRiskStatus(order) {
  return order.bypassAddressValidation;
}

/**
 * @name filterWorkflowStatus
 * @method
 * @memberof Helpers
 * @summary get query for a given filter
 * @param {String} filter - filter string to check against
 * @return {Object} query for the workflow status
 */
export function filterWorkflowStatus(filter) {
  let query = {};

  switch (filter) {
    // New orders
    case "new":
      query = {
        "workflow.status": "new"
      };
      break;

    // Orders that have been approved
    case "approved":
      query = {
        "workflow.status": "coreOrderWorkflow/processing",
        "shipping.payment.status": "approved"
      };
      break;

    // Orders that have been captured
    case "captured":
      query = {
        "shipping.payment.status": "completed",
        "shipping.shipped": false
      };
      break;

    // Orders that are being processed
    case "processing":
      query = {
        "workflow.status": "coreOrderWorkflow/processing"
      };
      break;

    // Orders that are complete, including all items with complete status
    case "completed":
      query = {
        "workflow.status": "coreOrderWorkflow/completed"
      };
      break;

    case "canceled":
      query = {
        "workflow.status": "coreOrderWorkflow/canceled"
      };
      break;

    default:
  }

  return query;
}

/**
 * @name filterShippingStatus
 * @memberof Helpers
 * @summary get query for a given filter
 * @param {String} filter - filter string to check against
 * @return {Object} query for the shipping status
 */
export function filterShippingStatus(filter) {
  let query = {};

  switch (filter) {
    case "picked":
      query = {
        "shipping.workflow.status": "coreOrderWorkflow/picked"
      };
      break;

    case "packed":
      query = {
        "shipping.workflow.status": "coreOrderWorkflow/packed"
      };
      break;

    case "labeled":
      query = {
        "shipping.workflow.status": "coreOrderWorkflow/labeled"
      };
      break;

    case "shipped":
      query = {
        "shipping.workflow.status": "coreOrderWorkflow/shipped"
      };
      break;

    default:
  }

  return query;
}

/**
 * @name getShippingInfo
 * @memberof Helpers
 * @summary get proper shipping object as per current active shop
 * @param {Object} order - order object to check against
 * @return {Object} proper shipping object to use
 */
export function getShippingInfo(order) {
  const shippingInfo = order && order.shipping && order.shipping.find((group) => group.shopId === Reaction.getShopId());
  return shippingInfo || {};
}

/**
 * @name taxLabel
 * @memberof Helpers
 * @summary Generates a label from a tax object that includes rate and jurisdiction.
 * @param {Object} tax - A tax object
 * @returns {String} Formatted string such as " (US, NY, 10242) 8.88%".
 */
export function taxLabel(tax) {
  const { country, postal, region, taxName: name, taxRate } = tax;
  let label = "";
  if (country) {
    label = `(${country}`;
    if (region) {
      label += ` ,${region}`;
    }
    if (postal) {
      label += ` ,${postal}`;
    }
    label += ") ";
  } else if (name) {
    label = `(${name}) `;
  }
  return ` ${label}${taxRate && (taxRate * 100).toLocaleString()}%`;
}

/**
 * @name itemPrice
 * @memberof Helpers
 * @param {Object} item - The item
 * @param {Number} quantity - The quantity
 * @param {Boolean} isTaxIncluded - If true, price includes tax and net price is include in output
 * @returns {Object} price and ne price
 */
export function itemPrice(item, quantity, isTaxIncluded) {
  let netPrice = null;
  let price;
  if (isTaxIncluded) {
    netPrice = item.price.amount;
    price = item.price.amount + (item.tax / quantity);
  } else {
    price = item.price.amount;
  }
  return { netPrice, price };
}

/**
 * @name shipmentPrice
 * @memberof Helpers
 * @param {Object} shipmentMethod - The shipmentMethod
 * @param {Boolean} isTaxIncluded - If true, price includes tax and net price is include in output
 * @returns {Object} price and net price
 */
export function shipmentPrice(shipmentMethod, isTaxIncluded) {
  let netPrice = null;
  let price;
  if (isTaxIncluded) {
    netPrice = shipmentMethod.rate + shipmentMethod.handling;
    if (shipmentMethod.tax) {
      price = netPrice + shipmentMethod.tax;
    } else {
      price = netPrice;
    }
  } else {
    price = shipmentMethod.rate + shipmentMethod.handling;
  }
  return { netPrice, price };
}

/**
 * @name itemsTax
 * @memberof Helpers
 * @param {Object[]} items - The items
 * @returns {Object} cumulated taxes on items
 */
export function itemsTax(items) {
  return items.reduce((tax, item) => tax + item.tax, 0);
}

/**
 * @name subtotal
 * @memberof Helpers
 * @param {Object} item - The item
 * @param {Boolean} isTaxIncluded - If true, price includes tax and net price is include in output
 * @returns {Object} price and net price
 */
export function subtotal(item, isTaxIncluded) {
  let netPrice = null;
  let price;
  if (isTaxIncluded) {
    price = item.subtotal + item.tax;
    netPrice = item.subtotal;
  } else {
    price = item.subtotal;
  }
  return { netPrice, price };
}
