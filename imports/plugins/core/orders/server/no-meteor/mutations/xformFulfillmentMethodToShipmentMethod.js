/**
 * @summary Transforms fulfillment method to shipment method.
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input shipment method input
 * @param {Object} selectedFulfillmentMethod fulfillment method
 * @return {Object} shipment method
 */
export default function xformFulfillmentMethodToShipmentMethod(context, input, selectedFulfillmentMethod) {
  return {
    _id: selectedFulfillmentMethod.method._id,
    carrier: selectedFulfillmentMethod.method.carrier,
    currencyCode: input.currencyCode,
    label: selectedFulfillmentMethod.method.label,
    group: selectedFulfillmentMethod.method.group,
    name: selectedFulfillmentMethod.method.name,
    handling: selectedFulfillmentMethod.handlingPrice,
    rate: selectedFulfillmentMethod.shippingPrice
  };
}
