import Reaction from "/imports/plugins/core/core/server/Reaction";
import calculateItemTaxes from "./server/no-meteor/util/calculateItemTaxes";
import calculateOrderTaxes from "./server/no-meteor/util/calculateOrderTaxes";
import calculateShippingTaxes from "./server/no-meteor/util/calculateShippingTaxes";
import getTaxCodes from "./server/no-meteor/util/getTaxCodes";
import isTaxIncluded from "./server/no-meteor/util/isTaxIncluded";
import taxesForItem from "./server/no-meteor/util/taxesForItem";
import taxesForShop from "./server/no-meteor/util/taxesForShop";
import startup from "./server/no-meteor/startup";

Reaction.registerPackage({
  label: "Custom Rates",
  name: "reaction-taxes-rates",
  icon: "fa fa-university",
  autoEnable: true,
  functionsByType: {
    startup: [startup]
  },
  taxServices: [
    {
      displayName: "Custom Rates",
      name: "custom-rates",
      functions: {
        calculateItemTaxes,
        calculateOrderTaxes,
        calculateShippingTaxes,
        getTaxCodes,
        isTaxIncluded,
        taxesForItem,
        taxesForShop
      }
    }
  ],
  registry: [
    {
      label: "Custom Rates",
      name: "taxes/settings/rates",
      provides: ["taxSettings"],
      template: "customTaxRates"
    }
  ]
});
