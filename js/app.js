/* Europa Culture — storefront logic (no build step, no dependencies) */
(function () {
  const P = window.EC_PRODUCTS || [];
  const CUR = window.EC_CURRENCY || "€";
  const $ = (s, r = document) => r.querySelector(s);
  const money = (n) => `${CUR}${n.toFixed(2).replace(/\.00$/, "")}`;
  const byId = (id) => P.find((p) => p.id === id);

  /* ---------- Garment renderer (SVG mockups, swap for photos later) ---------- */
  function garmentSVG(p, opts = {}) {
    const f = p.fabric, ink = p.ink;
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    const text = (y0, size, gap) =>
      p.lines
        .map((l, i) => `<text x="200" y="${y0 + i * gap}" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="${size}" font-weight="500" letter-spacing="1.2" fill="${ink}">${l}</text>`)
        .join("");
    const shade = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>`;
    let body = "";
    if (p.type === "tote") {
      body = `
        <path d="M150 140 C150 40 250 40 250 140" fill="none" stroke="${f}" stroke-width="14" stroke-linecap="round" filter="brightness(.9)"/>
        <path d="M150 140 C150 40 250 40 250 140" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="14"/>
        <rect x="88" y="130" width="224" height="290" rx="3" fill="${f}" stroke="#000" stroke-opacity=".14" stroke-width="1.5"/>
        <rect x="88" y="130" width="224" height="290" rx="3" fill="url(#${gid})"/>
        ${text(258, 19, 26)}`;
    } else {
      const tee = "M140 48 Q200 84 260 48 L330 70 L392 150 L338 190 L310 165 L310 425 L90 425 L90 165 L62 190 L8 150 L70 70 Z";
      const hood = p.type === "hoodie"
        ? `<path d="M128 60 C128 -6 272 -6 272 60 Q200 104 128 60 Z" fill="${f}"/><path d="M128 60 C128 -6 272 -6 272 60 Q200 104 128 60 Z" fill="#000" fill-opacity=".18"/>`
        : "";
      const extras = p.type === "hoodie"
        ? `<path d="M128 330 L272 330 L292 405 L108 405 Z" fill="#000" fill-opacity=".14"/>
           <line x1="186" y1="80" x2="182" y2="150" stroke="${ink}" stroke-opacity=".5" stroke-width="2"/>
           <line x1="214" y1="80" x2="218" y2="150" stroke="${ink}" stroke-opacity=".5" stroke-width="2"/>
           <rect x="90" y="410" width="220" height="15" fill="#000" fill-opacity=".15"/>`
        : `<path d="M140 48 Q200 84 260 48" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="5"/>`;
      body = `${hood}<path d="${tee}" fill="${f}" stroke="#000" stroke-opacity=".14" stroke-width="1.5"/><path d="${tee}" fill="url(#${gid})"/>${extras}
        ${text(p.type === "hoodie" ? 205 : 190, 21, 29)}`;
    }
    return `<svg viewBox="0 0 400 440" role="img" aria-label="${p.name}, ${p.colorway}" class="garment ${opts.cls || ""}">${shade}${body}</svg>`;
  }

  /* ---------- Cathedral line drawing (original, generic Gothic facade) ---------- */
  function lancet(x1, x2, spring, bottom) {
    const w = x2 - x1, mid = (x1 + x2) / 2, apex = spring - w * 0.866;
    return `M${x1} ${bottom} L${x1} ${spring} A${w} ${w} 0 0 1 ${mid} ${apex} A${w} ${w} 0 0 1 ${x2} ${spring} L${x2} ${bottom}`;
  }
  function cathedralSVG() {
    const d = [];
    // towers + nave block
    d.push("M60 700 L60 70 L220 70 L220 700", "M380 700 L380 70 L540 70 L540 700", "M220 700 L220 250 L380 250 L380 700");
    d.push("M50 70 L230 70 M370 70 L550 70", "M50 250 L550 250 M50 262 L550 262", "M50 470 L550 470");
    // tower belfry lancets
    [[78, 132], [148, 202], [398, 452], [468, 522]].forEach(([a, b]) => d.push(lancet(a, b, 140, 230)));
    // crenellation on tower tops
    for (let x = 60; x < 220; x += 20) d.push(`M${x} 70 L${x} 58 L${x + 10} 58 L${x + 10} 70`);
    for (let x = 380; x < 540; x += 20) d.push(`M${x} 70 L${x} 58 L${x + 10} 58 L${x + 10} 70`);
    // king's gallery
    for (let x = 64; x < 536; x += 26) d.push(lancet(x, x + 18, 455, 470).replace(/^M\S+ \S+ /, `M${x} 470 `));
    // side windows mid-level
    [[100, 180], [420, 500]].forEach(([a, b]) => d.push(lancet(a, b, 340, 440)));
    // portals
    d.push(lancet(250, 350, 590, 700), lancet(262, 338, 600, 700));
    d.push(lancet(95, 185, 600, 700), lancet(415, 505, 600, 700));
    // rose window
    const cx = 300, cy = 360, r = 78;
    const rose = [`<circle cx="${cx}" cy="${cy}" r="${r}"/>`, `<circle cx="${cx}" cy="${cy}" r="${r - 12}"/>`, `<circle cx="${cx}" cy="${cy}" r="16"/>`];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rose.push(`<line x1="${cx + 16 * Math.cos(a)}" y1="${cy + 16 * Math.sin(a)}" x2="${cx + (r - 12) * Math.cos(a)}" y2="${cy + (r - 12) * Math.sin(a)}"/>`);
      const b = a + Math.PI / 16;
      rose.push(`<circle cx="${cx + (r - 30) * Math.cos(b)}" cy="${cy + (r - 30) * Math.sin(b)}" r="9"/>`);
    }
    return `<svg viewBox="0 0 600 710" class="cathedral" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">
      ${d.map((p) => `<path d="${p}" pathLength="1"/>`).join("")}${rose.join("")}
      <line x1="0" y1="700" x2="600" y2="700"/></svg>`;
  }

  /* ---------- Cart (localStorage, guarded) ---------- */
  const KEY = "ec_cart_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  let cart = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} renderCart(); };

  function addToCart(id, size, qty = 1) {
    const line = cart.find((l) => l.id === id && l.size === size);
    line ? (line.qty += qty) : cart.push({ id, size, qty });
    save(); openCart();
  }
  function renderCart() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = count));
    const list = $("#cart-lines"); if (!list) return;
    if (!cart.length) {
      list.innerHTML = `<p class="cart-empty">Your bag is empty.<br><span>Beauty is waiting.</span></p>`;
    } else {
      list.innerHTML = cart.map((l, i) => {
        const p = byId(l.id); if (!p) return "";
        return `<div class="cart-line">
          <div class="cart-thumb" style="background:${p.type === "tote" ? "#ece6da" : "#e9e4da"}">${garmentSVG(p)}</div>
          <div class="cart-info"><p class="cart-name">${p.name.split(" — ")[1] || p.name}</p>
            <p class="cart-meta">${p.lines.join(" ")} · ${p.colorway} · ${l.size}</p>
            <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="1" data-i="${i}" aria-label="Increase">+</button></div></div>
          <p class="cart-price">${money(p.price * l.qty)}</p></div>`;
      }).join("");
    }
    const sub = cart.reduce((s, l) => s + (byId(l.id)?.price || 0) * l.qty, 0);
    $("#cart-subtotal").textContent = money(sub);
    $("#cart-ship").textContent = sub >= 100 || sub === 0 ? "Free" : "Calculated at checkout";
  }
  function openCart() { document.body.classList.add("cart-open"); }
  function closeCart() { document.body.classList.remove("cart-open"); }

  function checkout() {
    const note = $("#checkout-note");
    if (!cart.length) return;
    const single = cart.length === 1 && byId(cart[0].id)?.stripeLink;
    if (single) { window.location.href = byId(cart[0].id).stripeLink; return; }
    note.hidden = false;
  }

  /* ---------- Page renderers ---------- */
  function renderGrid() {
    const grid = $("#product-grid"); if (!grid) return;
    grid.innerHTML = P.map((p, i) => `
      <a class="card reveal" href="product.html?id=${p.id}" style="--d:${i * 60}ms">
        <div class="card-media">${garmentSVG(p)}<span class="card-tag">${String(i + 1).padStart(2, "0")}</span></div>
        <div class="card-body"><div><p class="card-name">${p.lines.join(" ")}</p>
          <p class="card-meta">${p.type === "tote" ? "Canvas tote" : p.type === "hoodie" ? "Hoodie" : "Tee"} · ${p.colorway}</p></div>
          <p class="card-price">${money(p.price)}</p></div></a>`).join("");
  }

  function renderProduct() {
    const root = $("#product"); if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const p = byId(id) || P[0];
    document.title = `${p.lines.join(" ")} — ${p.colorway} | Europa Culture`;
    let size = p.sizes.length === 1 ? p.sizes[0] : null;
    root.innerHTML = `
      <div class="pdp-media">${garmentSVG(p, { cls: "big" })}</div>
      <div class="pdp-info">
        <p class="eyebrow">Collection I · ${p.colorway}</p>
        <h1 class="pdp-title">${p.lines.join("<br>")}</h1>
        <p class="pdp-sub">${p.type === "tote" ? "Canvas tote" : p.type === "hoodie" ? "Heavyweight hoodie" : "Heavyweight tee"}</p>
        <p class="pdp-price">${money(p.price)}</p>
        <p class="pdp-blurb">${p.blurb}</p>
        <div class="sizes" role="radiogroup" aria-label="Size">
          ${p.sizes.map((s) => `<button role="radio" aria-checked="${s === size}" data-size="${s}">${s}</button>`).join("")}
        </div>
        <button class="btn btn-solid btn-wide" id="add">${size ? "Add to bag" : "Select a size"}</button>
        <details open><summary>Details</summary><p>Organic cotton, pre-shrunk. Screen printed by hand in Porto, Portugal. Boxy, slightly cropped fit — take your usual size.</p></details>
        <details><summary>Shipping & returns</summary><p>Ships in 2–4 business days from the EU. Free shipping across the EU & US over ${CUR}100. Free returns within 30 days.</p></details>
        <details><summary>Care</summary><p>Wash cold, inside out. Hang dry. Do not iron the print. Treat it like a façade: it should last a century.</p></details>
      </div>`;
    const add = $("#add");
    root.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => {
      size = b.dataset.size;
      root.querySelectorAll("[data-size]").forEach((x) => x.setAttribute("aria-checked", x === b));
      add.textContent = "Add to bag";
    }));
    add.addEventListener("click", () => {
      if (!size) { add.classList.add("shake"); setTimeout(() => add.classList.remove("shake"), 400); return; }
      addToCart(p.id, size);
    });
    const more = $("#more-grid");
    if (more) more.innerHTML = P.filter((x) => x.id !== p.id).slice(0, 3).map((x) => `
      <a class="card" href="product.html?id=${x.id}"><div class="card-media">${garmentSVG(x)}</div>
      <div class="card-body"><div><p class="card-name">${x.lines.join(" ")}</p><p class="card-meta">${x.colorway}</p></div><p class="card-price">${money(x.price)}</p></div></a>`).join("");
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const hero = $("#hero-art"); if (hero) hero.innerHTML = cathedralSVG();
    const heroTee = $("#hero-tee"); if (heroTee) heroTee.innerHTML = garmentSVG(P[0]);
    renderGrid(); renderProduct(); renderCart();
    $("#year") && ($("#year").textContent = new Date().getFullYear());

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open-cart],[data-close-cart],[data-q],#checkout");
      if (!t) return;
      if (t.matches("[data-open-cart]")) { e.preventDefault(); openCart(); }
      if (t.matches("[data-close-cart]")) closeCart();
      if (t.matches("[data-q]")) {
        const l = cart[+t.dataset.i]; l.qty += +t.dataset.q;
        if (l.qty <= 0) cart.splice(+t.dataset.i, 1); save();
      }
      if (t.id === "checkout") checkout();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

    const form = $("#signup");
    form && form.addEventListener("submit", (e) => {
      e.preventDefault(); form.innerHTML = `<p class="signup-done">Merci. You're on the list.</p>`;
    });

    const io = "IntersectionObserver" in window && new IntersectionObserver((es) => es.forEach((x) => {
      if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

    const header = $(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  });
})();
