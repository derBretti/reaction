/**
 * Calculates the shipment rate including handling and taxes;
 * @param {Object} shipmentMethod the shipment method
 * @returns {Number} the shipment rate including handling and taxes
 */
export default function calculateGrossShipment(shipmentMethod) {
  return (shipmentMethod.rate || 0) + (shipmentMethod.handling || 0) + (shipmentMethod.tax || 0);
}
