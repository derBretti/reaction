import { xformRateToRateObject } from "@reactioncommerce/reaction-graphql-xforms/core";
import isTaxIncluded from "./isTaxIncluded";
import calculateGrossShipment from "./calculateGrossShipment";

/**
 * @summary Transforms fulfillmentOption using `calculateGrossShipment`
 * @param {Object} option shipmentQuote
 * @param {Object} method shipmentMethod
 * @param {Object} currencyCode currencyCode
 */
function xformFulfillmentOption(option, method, currencyCode) {
  return {
    fulfillmentMethod: {
      _id: method._id,
      carrier: method.carrier || null,
      displayName: method.label || method.name,
      group: method.group || null,
      name: method.name,
      // For now, this is always shipping. Revisit when adding download, pickup, etc. types
      fulfillmentTypes: ["shipping"]
    },
    handlingPrice: {
      amount: option.handling || 0,
      currencyCode
    },
    price: {
      amount: calculateGrossShipment(option),
      currencyCode
    }
  };
}

/**
 * @summary Sets taxes and net totak if tax is included according to settings.
 * @param {Object} context - an object containing the per-request
 * @param {Object} cart Cart document
 * @param {Object} checkout Checkout object
 * @returns {undefined}
 */
export default async function xformCartCheckout(context, cart, checkout) {
  const { collections, shopId } = context;
  const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
  let netTotalMoneyObject = null;

  if (includeTaxInItemPrice) {
    const { taxSummary, currencyCode } = cart;
    // include taxes in itemTotal
    if (checkout.summary.itemTotal) {
      const itemTotal = (cart.items || []).reduce((sum, item) => (sum + item.subtotal.amount + (item.tax ? item.tax : 0)), 0);
      checkout.summary.itemTotal.amount = itemTotal;
    }

    const cartFulfillmentGroups = cart.shipping || [];
    if (cartFulfillmentGroups.length > 0) {
      let fulfillmentTaxTotal = 0;

      let hasNoSelectedShipmentMethods = true;
      const fulfillmentGroups = cartFulfillmentGroups.map((fulfillmentGroup) => {
        let selectedFulfillmentOption = null;
        const { shipmentMethod } = fulfillmentGroup;
        if (shipmentMethod) {
          const shipmentOption = (fulfillmentGroup.shipmentQuotes || []).find((option) => option.method._id === shipmentMethod._id);
          // add tax from selected method
          hasNoSelectedShipmentMethods = false;
          fulfillmentTaxTotal += shipmentOption.tax || 0;
          // create selectedFulfillmentOption
          selectedFulfillmentOption = xformFulfillmentOption(shipmentOption, shipmentMethod, currencyCode);
        }
        // create availableFulfillmentOptions
        const availableFulfillmentOptions = (fulfillmentGroup.shipmentQuotes || []).map((option) => xformFulfillmentOption(option, option.method, currencyCode));
        return {
          _id: fulfillmentGroup._id,
          availableFulfillmentOptions,
          data: {
            shippingAddress: fulfillmentGroup.address
          },
          // For now, we only ever set one fulfillment group, so it has all of the items.
          // Revisit when the UI supports breaking into multiple groups.
          items: cart.items || [],
          selectedFulfillmentOption,
          shippingAddress: fulfillmentGroup.address,
          shopId: fulfillmentGroup.shopId,
          // For now, this is always shipping. Revisit when adding download, pickup, etc. types
          type: "shipping"
        };
      });
      checkout.fulfillmentGroups = fulfillmentGroups;
      if (!hasNoSelectedShipmentMethods && checkout.summary.fulfillmentTotal) {
        checkout.summary.fulfillmentTotal.amount += fulfillmentTaxTotal;
      }
    }
    // TODO include taxes in surchargeTotal
    // TODO handle discounts

    if (taxSummary) {
      const { netAmount, taxes } = taxSummary;
      // add taxes
      if (taxes !== null) {
        checkout.summary.taxes = taxes.map((calculatedTax) => ({
          ...calculatedTax,
          tax: {
            currencyCode,
            amount: calculatedTax.tax
          },
          taxableAmount: {
            currencyCode,
            amount: calculatedTax.taxableAmount
          },
          taxRate: xformRateToRateObject(calculatedTax.taxRate)
        }));
      }
      // add netTotal or null
      if (netAmount !== undefined && netAmount !== null) {
        netTotalMoneyObject = {
          amount: netAmount,
          currencyCode: cart.currencyCode
        };
      }
    }
  }
  checkout.summary.netTotal = netTotalMoneyObject;
}
