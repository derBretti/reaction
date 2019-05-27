import Reaction from "/imports/plugins/core/core/server/Reaction";
import mutateNewOrderItemBeforeCreate from "./server/no-meteor/mutateNewOrderItemBeforeCreate";
import mutateNewVariantBeforeCreate from "./server/no-meteor/mutateNewVariantBeforeCreate";
import publishProductToCatalog from "./server/no-meteor/publishProductToCatalog";
import { registerPluginHandler } from "./server/no-meteor/registration";
import mutations from "./server/no-meteor/mutations";
import queries from "./server/no-meteor/queries";
import resolvers from "./server/no-meteor/resolvers";
import schemas from "./server/no-meteor/schemas";
import startup from "./server/no-meteor/startup";
import addInvoiceToGroup from "./server/no-meteor/util/addInvoiceToGroup";
import xformCartCheckout from "./server/no-meteor/util/xformCartCheckout";
import xformFulfillmentGroup from "./server/no-meteor/util/xformFulfillmentGroup";
import xformFulfillmentGroupToSummary from "./server/no-meteor/util/xformFulfillmentGroupToSummary";
import xformOrderSummary from "./server/no-meteor/util/xformOrderSummary";

Reaction.registerPackage({
  label: "Taxes",
  name: "reaction-taxes",
  icon: "fa fa-university",
  autoEnable: true,
  catalog: {
    publishedProductVariantFields: ["isTaxable", "taxCode", "taxDescription"]
  },
  functionsByType: {
    addInvoiceToGroup: [addInvoiceToGroup],
    mutateNewOrderItemBeforeCreate: [mutateNewOrderItemBeforeCreate],
    mutateNewVariantBeforeCreate: [mutateNewVariantBeforeCreate],
    publishProductToCatalog: [publishProductToCatalog],
    registerPluginHandler: [registerPluginHandler],
    xformCartCheckout: [xformCartCheckout],
    xformFulfillmentGroupToSummary: [xformFulfillmentGroupToSummary],
    xformFulfillmentGroup: [xformFulfillmentGroup],
    xformOrderSummary: [xformOrderSummary],
    startup: [startup]
  },
  graphQL: {
    schemas,
    resolvers
  },
  mutations,
  queries,
  registry: [
    {
      provides: ["dashboard"],
      name: "taxes",
      label: "Taxes",
      description: "Provide tax rates",
      icon: "fa fa-university",
      priority: 1,
      container: "core",
      workflow: "coreDashboardWorkflow"
    },
    {
      label: "Tax Settings",
      icon: "fa fa-university",
      name: "taxes/settings",
      provides: ["settings"],
      template: "taxSettings"
    }
  ]
});
