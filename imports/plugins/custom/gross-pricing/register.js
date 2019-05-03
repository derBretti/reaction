import Reaction from "/imports/plugins/core/core/server/Reaction";
import queries from "./server/no-meteor/queries";
import resolvers from "./server/no-meteor/resolvers";
import mutations from "./server/no-meteor/mutations";
import startup from "./server/no-meteor/startup";

/**
 * Simple Pricing plugin
 * Isolates the get/set of pricing data to this plugin.
 */

Reaction.registerPackage({
  label: "Gross pricing",
  name: "gross-pricing",
  icon: "fa fa-dollar-sign",
  autoEnable: true,
  functionsByType: {
    startup: [startup]
  },
  graphQL: {
    resolvers
  },
  mutations,
  queries,
  settings: {
    name: "Pricing"
  }
});
