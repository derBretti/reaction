import queries from "./queries";
import calculateItemTaxes from "./util/calculateItemTaxes";
import calculateOrderTaxes from "./util/calculateOrderTaxes";
import calculateShippingTaxes from "./util/calculateShippingTaxes";
import getTaxCodes from "./util/getTaxCodes";
import taxesForItem from "./util/taxesForItem";
import taxesForShop from "./util/taxesForShop";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @return {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Custom Rates",
    name: "reaction-taxes-rates",
    icon: "fa fa-university",
    autoEnable: true,
    collections: {
      Taxes: {
        name: "Taxes",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ country: 1 }, { name: "c2_country" }],
          [{ postal: 1 }, { name: "c2_postal" }],
          [{ region: 1 }, { name: "c2_region" }],
          [{ shopId: 1 }, { name: "c2_shopId" }],
          [{ taxCode: 1 }, { name: "c2_taxCode" }]
        ]
      },
      TaxCodes: {
        name: "TaxCodes"
      }
    },
    queries,
    taxServices: [
      {
        displayName: "Custom Rates",
        name: "custom-rates",
        functions: {
          calculateItemTaxes,
          calculateOrderTaxes,
          calculateShippingTaxes,
          getTaxCodes,
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
}
