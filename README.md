# VAT features

One major major shortcoming of  Reaction Commerce was the way it handles taxes, which might be fine for North America but is insufficient to comply with European rules. Since I cannot wait for the missing features to be implemented within the main project, I created a fork and went ahead taking on those issues.
My longer term goal is to make the new features fit for the main project, such that they can eventually me integrated. Hence, I am happy for comments and PRs.

Features:
-   Allow taxation based on origin. The `taxLocale` field already existed in the `Taxes` schema, but was not used. If the `taxLocale` is now set to `origin`, the tax rate is applied, if the address of origin (for now the first of the shops' addresses) matches.
-   Support charging tax on fulfillment prices (https://github.com/reactioncommerce/reaction/issues/4812). Like products, shipmentMethods now have an `isTaxable` and a `taxCode` field. The taxes apply to both, the shipping rate and handling charges.
-   Being able to set Tax inclusive on Tax settings (https://github.com/reactioncommerce/reaction/issues/3342)
-   Include taxes in display prices (https://github.com/reactioncommerce/reaction-feature-requests/issues/61)
    -   There is now an option in the shop settings to display prices with tax included
    -   Since the final tax is unknown until the shipping address has been entered in the checkout process, the following fallback options are used to calculate taxes for items in the catlog and in the cart:
        -   If the user has a cart and has already entered a shipping addres, it is used
        -   If the user has no cart, but is logged in, the first address registered to their account is used
        -   If neither applies, the shop's address is used (it is assumed that the order is shipped whitin the same jurisdiction)
    -   If taxes are to be included in prices, the following figures are added to the invoice:
        -   The net amount (i.e. the total excluding taxes but including net shipping, handling, surcharges and discounts)
        -   Gross and net prices of each item, subtotal and shipping   

TODO:
-   Handle taxes correctly in discounts and surcharges (this is straight forward for surcharges and discounts which apply to specific items, if they apply to an entire order, things get messier)
-   Review code structure and design decisions
    -   It was not possible to add the features as a simple tax plugin like `taxes-rates` and quite a few changes had to be made to core plugins. I tried to keep my code consistent with the existing code base and follow the guidelines whereever possible. However, in quite a few cases, I did not have a lot of guidance and, since I could not wait for my ideas to be discussed thoroughly, went ahead implementing the functionality in a way I deemed appropriate. These decisions might need a secound thought.
    -   I implemented changes to the catalog to display gross prices in a custom plugin. If the feature moves to the main project, the code should be integrated with the core plugin.
-   Show net prices to commercial customers. In some shops, commercial customers (i.e. those who can pass on VAT to their customers), see net prices. We could use the "commercial address" flag to this end.
-   Find a better way to specify the address of origin (either for each product in a shop or per shop)
-   Allow for taxes to apply only to the shipping rate or handling (I am not sure if there is a use case for this)
-   Allow for taxes on shipping and handling to depend on the items in the order. In Germany (maybe this applies in other countries as well), shipping and handling are treated as an 'auxiliary' services and shall be taxed in the same way as the items in the order. In practice this means, that the tax rate, which applies to the majority of items in the order (by value), also applies to shipping and handling as well as surcharges and discounts on the entire order.

# Reaction Commerce

[![Circle CI](https://circleci.com/gh/reactioncommerce/reaction.svg?style=svg)](https://circleci.com/gh/reactioncommerce/reaction) [![Gitter](https://badges.gitter.im/JoinChat.svg)](https://gitter.im/reactioncommerce/reaction?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Open Source Helpers](https://www.codetriage.com/reactioncommerce/reaction/badges/users.svg)](https://www.codetriage.com/reactioncommerce/reaction)

[Reaction](http://reactioncommerce.com) is an event-driven, real-time reactive commerce platform built with JavaScript (ES6). It plays nicely with npm, Docker, and React.

![Reaction v.1.x](https://raw.githubusercontent.com/reactioncommerce/reaction-docs/v1.7.0/assets/Reaction-Commerce-Illustration-BG-800px.png)

## Features

Reaction’s out-of-the-box core features include:

-	One-step cart and checkout
-   Order processing
-   Payments with Stripe
-   Shipping
-   Taxes
-   Multi-currency support
-   Discounts
-   Integration with dozens of third-party apps
-   See full list of features on our [roadmap](https://reactioncommerce.com/roadmap)

Since anything in our codebase can be extended, overwritten, or installed as a package, you may also develop, scale, and customize anything on our platform.

# Getting started

Follow the documentation to install Reaction with [Reaction Platform](https://docs.reactioncommerce.com/docs/installation-reaction-platform) for all operating systems.

> Installing an older version of Reaction? Follow the documentation for installing pre-2.0 Reaction on [OS X](https://docs.reactioncommerce.com/docs/1.16.0/installation-osx), [Windows](https://docs.reactioncommerce.com/docs/1.16.0/installation-windows) or [Linux](https://docs.reactioncommerce.com/docs/1.16.0/installation-linux).

# Get involved

## Read documentation & tutorials

-   [Reaction Commerce: Developer documentation](https://docs.reactioncommerce.com)
-   [Reaction Design System](http://designsystem.reactioncommerce.com/)
-   [Reaction Commerce: API documentation](http://api.docs.reactioncommerce.com)
-   [Reaction Commerce engineering blog posts](https://blog.reactioncommerce.com/tag/engineering/)
-   [Reaction Commerce YouTube videos](https://www.youtube.com/user/reactioncommerce/videos)

## Get help & contact the team

-   [Reaction Commerce Gitter chat](https://gitter.im/reactioncommerce/reaction)
-   [Reaction Commerce forum](https://forums.reactioncommerce.com/)
-   [Security reporting instructions](https://docs.reactioncommerce.com/reaction-docs/master/reporting-vulnerabilities): Report security vulnerabilities to <mailto:security@reactioncommerce.com>.

## Contribute

:star: Star us on GitHub — it helps!

Want to request a feature? Use our [Reaction Feature Requests repository](https://github.com/reactioncommerce/reaction-feature-requests) to file a request.

We love your pull requests! Check our our [`Good First Issue`](https://github.com/reactioncommerce/reaction/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) and [`Help Wanted`](https://github.com/reactioncommerce/reaction/issues?q=label%3A%22help+wanted%22) tags for good issues to tackle.

Pull requests should:

- Pass all Circle CI checks:
    - Run `docker-compose run --rm reaction npm run lint` to make sure your code follows [Reaction's ESLint rules](https://github.com/reactioncommerce/reaction-eslint-config).
    - Run `docker-compose run --rm reaction reaction test` to run [acceptance tests and unit tests](https://docs.reactioncommerce.com/reaction-docs/master/testing-reaction).
    - Make sure you're following the [Reaction Code Style Guide](https://docs.reactioncommerce.com/reaction-docs/master/styleguide) and
- Follow the pull request template.

Get more details in our [Contributing Guide](https://docs.reactioncommerce.com/reaction-docs/master/contributing-to-reaction).

## Deploy on Docker

We ensure that all releases are deployable as [Docker](https://hub.docker.com/r/reactioncommerce/reaction/) containers. While we don't regularly test other methods of deployment, our community has documented deployment strategies for AWS, [Digital Ocean](https://gist.github.com/jshimko/745ca66748846551692e24c267a56060), and Galaxy. For an introduction to Docker deployment, the [Reaction deployment guide](https://docs.reactioncommerce.com/reaction-docs/master/deploying) has detailed examples.

### License

Copyright © [GNU General Public License v3.0](./LICENSE.md)
