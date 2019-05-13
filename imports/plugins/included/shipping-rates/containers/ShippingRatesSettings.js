import { Meteor } from "meteor/meteor";
import { compose } from "recompose";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import { Shipping } from "/lib/collections";
import getOpaqueIds from "/imports/plugins/core/core/client/util/getOpaqueIds";
import withTaxCodes from "/imports/plugins/core/taxes/client/hoc/withTaxCodes";
import ShippingRatesSettings from "../components/ShippingRatesSettings";

/**
 * @param {Object} props Props from parent
 * @param {Function} onData Callback
 * @returns {undefined}
 */
async function decodeShopId(props, onData) {
  const { shopId: decodedShopId } = props;
  const [shopId] = await getOpaqueIds([{ namespace: "Shop", id: decodedShopId }]);

  onData(null, {
    decodedShopId,
    shopId
  });
}

/**
 * @param {Object} props Props from parent
 * @param {Function} onData Callback
 * @returns {undefined}
 */
function composer(props, onData) {
  Meteor.subscribe("Shipping");

  const shippingDoc = Shipping.findOne({ "provider.name": "flatRates" });

  onData(null, {
    fulfillmentMethods: shippingDoc ? shippingDoc.methods : null,
    shopId: props.decodedShopId || props.shopId
  });
}

registerComponent("ShippingRatesSettings", ShippingRatesSettings, compose(composeWithTracker(decodeShopId), withTaxCodes, composeWithTracker(composer)));

export default compose(
  composeWithTracker(decodeShopId),
  withTaxCodes,
  composeWithTracker(composer)
);
