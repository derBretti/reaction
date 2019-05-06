import { xformPricingArray } from "@reactioncommerce/reaction-graphql-xforms/product";
import getDisplayPrice from "/imports/plugins/included/simple-pricing/server/no-meteor/util/getDisplayPrice";
import taxesForShop from "/imports/plugins/included/taxes-rates/server/no-meteor/util/taxesForShop";
import { taxesForItem } from "/imports/plugins/included/taxes-rates/server/no-meteor/util/calculateItemTaxes";
import isTaxIncluded from "/imports/plugins/included/taxes-rates/server/no-meteor/util/isTaxIncluded";

function getMaxMinPrices (product, maxMinPricing = {
  minTaxCode: null,
  maxTaxCode: null,
  maxPrice: 0,
  minPrice: null,
  isTaxable: false
}) {
  if (product.price !== undefined && product.price !== null 
    && typeof product.price !== "object") {
      if (product.price > maxMinPricing.maxPrice) {
        maxMinPricing.maxPrice = product.price;
        if (product.isTaxable && product.taxCode) {
          maxMinPricing.isTaxable = true;
          maxMinPricing.maxTaxCode = product.taxCode;
        } else{
          maxMinPricing.maxTaxCode = null;
        }
      }
      if (maxMinPricing.minPrice === null || product.price < maxMinPricing.minPrice) {
        maxMinPricing.minPrice = product.price;
        if (product.isTaxable && product.taxCode) {
          maxMinPricing.isTaxable = true;
          maxMinPricing.minTaxCode = product.taxCode;
        } else{
          maxMinPricing.minTaxCode = null;
        }
      }
  }
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant) => {
      getMaxMinPrices (variant, maxMinPricing);
    });
  }
  if (product.options && Array.isArray(product.options)) {
    product.options.forEach((option) => {
      getMaxMinPrices (option, maxMinPricing);
    });
  }
  return maxMinPricing;
}

/**
 * Aggregates max/min prices for all currencies
 * @param {Object} aggregate 
 * @param {Object} current 
 */
function aggregateMaxMinPricing (aggregate, current) {
  Object.entries(current).forEach(([c, p]) => {
    let { maxPrice, minPrice } = p;
    if (aggregate[c]) {
      if (maxPrice > aggregate[c].maxPrice) {
        aggregate[c].maxPrice = maxPrice;
      }
      if (minPrice < aggregate[c].minPrice) {
        aggregate[c].minPrice = minPrice;
      }
    }else {
      aggregate[c] = {
        maxPrice,
        minPrice
      };
    }
  });
  return aggregate;
}

export function getGrossPrice (price, allTaxes, taxCode) {
  const taxes = taxesForItem(allTaxes, { amount: price, taxCode });
  return taxes.reduce((sum, taxDef) => sum + taxDef.tax, price);
}

function setGrossPricing (product, allTaxes, currencies) {
  const maxMinPricing = {};
  let lowerMaxMinPricing;
  if (product.variants && Array.isArray(product.variants)) {
    lowerMaxMinPricing = product.variants.map((variant) => {
      return setGrossPricing (variant, allTaxes, currencies);
    }).reduce(aggregateMaxMinPricing, {});
  }
  if (product.options && Array.isArray(product.options)) {
    lowerMaxMinPricing = product.options.map((option) => {
      return setGrossPricing (option, allTaxes, currencies);
    }).reduce(aggregateMaxMinPricing, {});
  }
  if (!lowerMaxMinPricing) {
    lowerMaxMinPricing = {};
  }

  const { taxCode } = product;
  if (product.pricing) {
    Object.entries(product.pricing).forEach(([c, p]) => {
      let { maxPrice, minPrice } = p;
      // use new calculations from child items for max and min price, since taxCode might vary in options
      if (lowerMaxMinPricing[c]) {
        minPrice = lowerMaxMinPricing[c].minPrice;
        maxPrice = lowerMaxMinPricing[c].maxPrice;
      } else {
        minPrice = getGrossPrice(minPrice, allTaxes, taxCode);
        maxPrice = getGrossPrice(maxPrice, allTaxes, taxCode);
      }
      // if (p.price !== null) {
      //   p.price = getGrossPrice(p.price, allTaxes, taxCode);
      // }
      // if (p.compareAtPrice !== null) {
      //   p.compareAtPrice = getGrossPrice(p.compareAtPrice, allTaxes, taxCode);
      // }
      p.displayPrice = getDisplayPrice(minPrice, maxPrice, currencies[c]);
      // p.minPrice = minPrice;
      // p.maxPrice = maxPrice;
      maxMinPricing[c] = { minPrice, maxPrice };
    });
  }
  return maxMinPricing;
}

export async function calculateGrossPricing ({ items, shippingAddress, currencies }, context) {
  const { collections, shopId } = context;
  const allTaxes = await taxesForShop(collections, { shippingAddress, shopId });

  items.forEach((item) => {
    if (item.product) {
      setGrossPricing (item.product, allTaxes, currencies);
    }
  });
  return items;
}

export default async function xformsGrossPrices(node, args, context) {
  const { collections, shopId } = context;
  let shippingAddress;
  if (node.shippingAddress) {
    shippingAddress = node.shippingAddress;
  }
  const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);

  if (!includeTaxInItemPrice) {
    return xformPricingArray(node.pricing);
  }

  const shop = await context.queries.shopById(context, shopId);
  const { currencies, addressBook } = shop;
  let isTaxable = false;
  let taxCode = null;
  let minTaxCode = null
  let maxTaxCode = null;

  // use first address (change when cart with shipping or user is available)
  if (!shippingAddress) {
    shippingAddress = addressBook.find((address) => address.isBillingDefault);
  }

  const allTaxes = await taxesForShop(collections, { shippingAddress, shopId });

  if (node.isTaxable && node.taxCode) {
    isTaxable = node.isTaxable;
    taxCode = node.taxCode;
  } else {
    const maxMinPricing = getMaxMinPrices(node);
    if (maxMinPricing.isTaxable) {
      maxTaxCode = maxMinPricing.maxTaxCode;
      minTaxCode = maxMinPricing.minTaxCode;
      isTaxable = true;
    }
  }

  return xformPricingArray(node.pricing).map((pricing) => {
    const { minPrice, maxPrice, price } = pricing;
    let grossMinPrice;
    let grossMaxPrice;
    if (isTaxable) {
      if (price === null) {
        const minTaxes = taxesForItem(allTaxes, { amount: minPrice, taxCode: minTaxCode });
        const maxTaxes = taxesForItem(allTaxes, { amount: maxPrice, taxCode: maxTaxCode });
        grossMinPrice = minTaxes.reduce((sum, taxDef) => sum + taxDef.tax, minPrice);
        grossMaxPrice = maxTaxes.reduce((sum, taxDef) => sum + taxDef.tax, maxPrice);
      } else {
        const taxes = taxesForItem(allTaxes, { amount: price, taxCode });
        grossMinPrice = taxes.reduce((sum, taxDef) => sum + taxDef.tax, price);
        grossMaxPrice = grossMinPrice;
      }
    } else {
      grossMinPrice = minPrice;
      grossMaxPrice = maxPrice;
    }
    const displayPrice = getDisplayPrice(grossMinPrice, grossMaxPrice, currencies[pricing.currencyCode]);
    return {...pricing, displayPrice};
  });
}

export async function xformsWithTaxes(cart, context) {
  let { items: cartItems } = cart;
  const { collections, shopId } = context;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return cart;
  }

  const includeTaxInItemPrice = await isTaxIncluded(collections, shopId);
  if (!includeTaxInItemPrice) {
    return cart;
  }
  // taxes should be included, calculate taxes for tax summary if it does not exist
  if (!cart.taxSummary) {
    const shop = await context.queries.shopById(context, shopId);
    const { addressBook } = shop;
    const shippingAddress = addressBook.find((address) => address.isBillingDefault);
    const allTaxes = await taxesForShop(collections, { shippingAddress, shopId });

    cartItems.forEach((item) => {
      const { price, taxCode } = item;
      const { amount } = price;
      const taxes = taxesForItem(allTaxes, { amount, taxCode });
      item.tax = taxes.reduce((sum, taxDef) => sum + taxDef.tax, 0);
    });
  }

  cartItems.forEach((item) => {
    if (item.tax) {
      item.subtotal.amount += item.tax;
      item.price.amount += item.tax / item.quantity;
    }
  });
  return {
    ...cart,
    items: cartItems
  };

  // export async function xformsItemGrossPrice({ shippingAddress, item }, context) {

  //   const { price, taxCode } = item;
  //   const { amount } = price;
  //   const taxes = taxesForItem(allTaxes, { amount, taxCode });
  //   item.tax = taxes.reduce((sum, taxDef) => sum + taxDef.tax, 0);
  // }
}
