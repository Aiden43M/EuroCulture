# Europa Culture

Storefront for **Europa Culture — Collection I**: fifteen heavyweight oversized slogan tees in Heather Grey, Noir and Ivory White.

Pure HTML/CSS/JS. No build step, no dependencies. Deploys anywhere static (Render Static Site, GitHub Pages, Vercel, Netlify).

## Structure
```
index.html        Home: architecture photo carousel, featured-product carousel, collections, manifesto, quote, newsletter
shop.html         Shop all, filterable by collection (?c=borders|faith|nations|politics)
product.html      Product page (?id=<product-id>&color=grey|black|white): gallery, colour + size pickers
css/style.css     All styling (Cormorant Garamond + Inter, ivory/ink palette)
js/products.js    Catalog: names, collections, prices, colours, sizes, Stripe links
js/scenes.js      Hero carousel photos + credits
js/app.js         Rendering, carousels, filters, cart drawer (localStorage), checkout hook
assets/products/  <id>/<color>-1..4.jpg  (1 model front · 2 flat front · 3 flat back · 4 model back)
```

## Run locally
```bash
python3 -m http.server 8000   # open http://localhost:8000
```

## Deploy on Render
New → Static Site → this repo · Build command: leave blank · Publish directory: `.`

## Adding a product
1. Drop four photos per colour into `assets/products/<new-id>/` named `grey-1.jpg … white-4.jpg`.
2. Add one line to `js/products.js`.

## Checkout
Set a product's `stripeLink` to a Stripe Payment Link and single-item bags redirect straight to Stripe. For multi-item bags, wire Shopify Buy Button, Snipcart or a Stripe Checkout function into `checkout()` in `js/app.js`.

## Photography
Hero and quote backgrounds are hot-linked from Wikimedia Commons (CC BY-SA); credits render in the footer from `js/scenes.js`.
