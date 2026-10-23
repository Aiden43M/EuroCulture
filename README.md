# Europa Culture

Minimal, classical storefront for **Europa Culture** — garments for people who believe buildings should be beautiful. Collection I: *Make Architecture Great Again*.

Pure HTML/CSS/JS. No build step, no dependencies — deploys anywhere static (GitHub Pages, Vercel, Netlify, Render).

## Structure
```
index.html        Home: hero, collection grid, manifesto, quote, newsletter
product.html      Product page (?id=<product-id>)
css/style.css     All styling (Cormorant Garamond + Inter, ivory/ink palette)
js/products.js    Product catalog — edit names, prices, colors, sizes here
js/app.js         Rendering, cart drawer (localStorage), checkout hook
assets/           Favicon
```

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy on GitHub Pages
Settings → Pages → Source: `main` branch, `/ (root)`.

## Editing products
Each entry in `js/products.js` has `fabric` (garment color), `ink` (print color) and `lines` (the slogan). Garments render as SVG mockups, so new colorways need no photography. Swap in real product photos later by replacing `garmentSVG()` output with `<img>` tags.

## Checkout
Add a [Stripe Payment Link](https://stripe.com/payments/payment-links) to a product's `stripeLink` field and single-item carts redirect straight to Stripe. For multi-item carts, plug in Shopify Buy Button, Snipcart, or a Stripe Checkout serverless function inside `checkout()` in `js/app.js`.
