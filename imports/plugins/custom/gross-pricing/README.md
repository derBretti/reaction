# Gross Pricing

Calculates prices including taxes based on available information about orgigin an destination.

**Example**

``` js
// old addCartItems() funcitons

...
const {
      catalogProduct,
      parentVariant,
      variant: chosenVariant
    } = await findProductAndVariant(collections, productId, productVariantId);

    const variantPriceInfo = chosenVariant.pricing[providedPrice.currencyCode];
    if (!variantPriceInfo) {
      throw new ReactionError("invalid-param", `This product variant does not have a price for ${price.currencyCode}`);
    }
...

// new addCartItems() function with simple-pricing
const {
      catalogProduct,
      parentVariant,
      variant: chosenVariant
    } = await findProductAndVariant(collections, productId, productVariantId);

    const variantPriceInfo = await queries.getVariantPrice(context, chosenVariant, currencyCode);
    if (!variantPriceInfo) {
      throw new ReactionError("invalid-param", `This product variant does not have a price for ${price.currencyCode}`);
    }
```

## Queries

### Price Queries
**getVariantPrice**
This query is used to get a selected product's real price.

**getCurrentCatalogPriceForProductConfiguration**
This query is used to verify a product's price is correct before we process the order.

### Catalog Price Queries
TBD
