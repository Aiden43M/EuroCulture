/* Europa Culture — storefront logic (no build step, no dependencies) */
(function () {
  const P = window.EC_PRODUCTS || [];
  const S = window.EC_SCENES || [];
  const C = window.EC_COLORS || {};
  const COL = window.EC_COLLECTIONS || {};
  const CUR = window.EC_CURRENCY || "€";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => `${CUR}${n.toFixed(2).replace(/\.00$/, "")}`;
  const byId = (id) => P.find((p) => p.id === id);
  const img = (p, color, n) => `assets/products/${p.id}/${color}-${n}.jpg`;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Product card ---------- */
  function card(p, i, color) {
    color = color || p.hero;
    return `<a class="pcard" href="product.html?id=${p.id}&color=${color}">
      <div class="pcard-media">
        <img class="pcard-img" src="${img(p, color, 1)}" alt="${p.name} tee in ${C[color].label}, worn" loading="lazy">
        <img class="pcard-alt" src="${img(p, color, 2)}" alt="" loading="lazy" aria-hidden="true">
        <span class="pcard-no">${String(i + 1).padStart(2, "0")}</span>
        <span class="pcard-cta">View piece →</span>
      </div>
      <div class="pcard-body"><div><p class="pcard-name">${p.name}</p>
        <p class="pcard-meta">${COL[p.collection]} · ${p.colors.length} colours</p>
        <p class="swatches">${p.colors.map((c) => `<span style="--c:${C[c].swatch}" title="${C[c].label}"></span>`).join("")}</p></div>
        <p class="pcard-price">${money(p.price)}</p></div></a>`;
  }

  /* ---------- Hero carousel ---------- */
  function heroCarousel() {
    const wrap = $("#hero-slides"); if (!wrap || !S.length) return;
    wrap.innerHTML = S.map((s, i) => `<figure class="slide${i === 0 ? " active" : ""}" data-i="${i}">
      <img src="${s.src}" alt="${s.place}, ${s.city}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></figure>`).join("");
    const bars = $("#hero-bars");
    bars.innerHTML = S.map((s, i) => `<button class="bar" aria-label="Show ${s.place}" data-go="${i}"><span></span></button>`).join("");
    const DUR = 5500; let idx = 0, timer;
    const slides = () => $$(".slide", wrap);
    $$("img", wrap).forEach((im) => im.addEventListener("error", () => {
      const fig = im.closest(".slide"); const i = +fig.dataset.i;
      fig.classList.add("broken"); bars.querySelector(`[data-go="${i}"]`)?.classList.add("broken");
      if (i === idx) go(idx + 1);
    }));
    function paint() {
      const s = S[idx];
      slides().forEach((el, i) => el.classList.toggle("active", i === idx));
      $$(".bar", bars).forEach((b, i) => { b.classList.toggle("active", i === idx); b.classList.toggle("done", i < idx); });
      $("#hero-place").textContent = s.place;
      $("#hero-city").textContent = `${s.city} · ${s.year}`;
      $("#hero-count").textContent = `${String(idx + 1).padStart(2, "0")} / ${String(S.length).padStart(2, "0")}`;
      bars.style.setProperty("--dur", DUR + "ms");
    }
    function go(n) {
      const list = slides();
      for (let k = 0; k < list.length; k++) {
        const c = ((n + k) % list.length + list.length) % list.length;
        if (!list[c].classList.contains("broken")) { idx = c; break; }
      }
      paint(); restart();
    }
    function restart() { clearTimeout(timer); if (!reduced) timer = setTimeout(() => go(idx + 1), DUR); }
    bars.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); b && go(+b.dataset.go); });
    $("#hero-prev")?.addEventListener("click", () => go(idx - 1));
    $("#hero-next")?.addEventListener("click", () => go(idx + 1));
    document.addEventListener("visibilitychange", () => (document.hidden ? clearTimeout(timer) : restart()));
    paint(); restart();
  }

  /* ---------- Featured product carousel ---------- */
  function productCarousel() {
    const track = $("#feature-track"); if (!track) return;
    track.innerHTML = P.map((p, i) => `<div class="feature-item">${card(p, i)}</div>`).join("");
    const step = () => (track.querySelector(".feature-item")?.offsetWidth || 300) + parseFloat(getComputedStyle(track).columnGap || 24);
    const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    const next = () => track.scrollBy({ left: atEnd() ? -track.scrollWidth : step(), behavior: "smooth" });
    const prev = () => track.scrollBy({ left: track.scrollLeft <= 4 ? track.scrollWidth : -step(), behavior: "smooth" });
    let paused = false;
    const hold = () => { paused = true; clearTimeout(hold.t); hold.t = setTimeout(() => (paused = false), 6000); };
    $("#feat-next")?.addEventListener("click", () => { next(); hold(); });
    $("#feat-prev")?.addEventListener("click", () => { prev(); hold(); });
    track.addEventListener("mouseenter", () => (paused = true));
    track.addEventListener("mouseleave", () => (paused = false));
    track.addEventListener("touchstart", hold, { passive: true });
    const line = $("#feat-line");
    track.addEventListener("scroll", () => {
      const max = track.scrollWidth - track.clientWidth;
      line && (line.style.transform = `scaleX(${max > 0 ? Math.max(0.08, track.scrollLeft / max) : 1})`);
    }, { passive: true });
    if (!reduced) setInterval(() => !paused && !document.hidden && next(), 3800);
  }

  /* ---------- Collections strip (home) ---------- */
  function renderCollections() {
    const el = $("#collections"); if (!el) return;
    el.innerHTML = Object.entries(COL).map(([key, label]) => {
      const items = P.filter((p) => p.collection === key);
      const p = items[0];
      return `<a class="coll reveal" href="shop.html?c=${key}">
        <img src="${img(p, p.hero, 2)}" alt="" loading="lazy">
        <span class="coll-label"><em>${label}</em><small>${items.length} pieces →</small></span></a>`;
    }).join("");
  }

  /* ---------- Cart (localStorage, guarded) ---------- */
  const KEY = "ec_cart_v2";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  let cart = load().filter((l) => byId(l.id));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} renderCart(); };
  function addToCart(id, color, size, qty = 1) {
    const line = cart.find((l) => l.id === id && l.size === size && l.color === color);
    line ? (line.qty += qty) : cart.push({ id, color, size, qty });
    save(); openCart();
  }
  function renderCart() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    $$("[data-cart-count]").forEach((el) => (el.textContent = count));
    const list = $("#cart-lines"); if (!list) return;
    list.innerHTML = !cart.length
      ? `<p class="cart-empty">Your bag is empty.<br><span>Beauty is waiting.</span></p>`
      : cart.map((l, i) => {
          const p = byId(l.id);
          return `<div class="cart-line">
            <a class="cart-thumb" href="product.html?id=${p.id}&color=${l.color}"><img src="${img(p, l.color, 2)}" alt=""></a>
            <div class="cart-info"><p class="cart-name">${p.name}</p>
              <p class="cart-meta">${C[l.color].label} · ${l.size}</p>
              <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="1" data-i="${i}" aria-label="Increase">+</button></div></div>
            <p class="cart-price">${money(p.price * l.qty)}</p></div>`;
        }).join("");
    const sub = cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
    $("#cart-subtotal").textContent = money(sub);
    $("#cart-ship").textContent = sub >= 100 || sub === 0 ? "Free" : "Calculated at checkout";
  }
  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");
  function checkout() {
    if (!cart.length) return;
    const p = cart.length === 1 && byId(cart[0].id);
    if (p && p.stripeLink) { location.href = p.stripeLink; return; }
    $("#checkout-note").hidden = false;
  }

  /* ---------- Shop page ---------- */
  function renderShop() {
    const grid = $("#shop-grid"); if (!grid) return;
    const chips = $("#shop-filters");
    const params = new URLSearchParams(location.search);
    let filter = params.get("c") || "all";
    chips.innerHTML = [["all", "All pieces"], ...Object.entries(COL)].map(([k, l]) =>
      `<button data-f="${k}" aria-pressed="${k === filter}">${l}</button>`).join("");
    const draw = () => {
      const list = P.filter((p) => filter === "all" || p.collection === filter);
      grid.innerHTML = list.map((p, i) => `<div class="reveal in" style="--d:${(i % 3) * 60}ms">${card(p, P.indexOf(p))}</div>`).join("");
      $("#shop-count").textContent = `${list.length} piece${list.length === 1 ? "" : "s"}`;
    };
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]"); if (!b) return;
      filter = b.dataset.f;
      $$("[data-f]", chips).forEach((x) => x.setAttribute("aria-pressed", x === b));
      history.replaceState(null, "", filter === "all" ? "shop.html" : `shop.html?c=${filter}`);
      draw();
    });
    draw();
  }

  /* ---------- Product page ---------- */
  function renderProduct() {
    const root = $("#product"); if (!root) return;
    const q = new URLSearchParams(location.search);
    const p = byId(q.get("id")) || P[0];
    let color = p.colors.includes(q.get("color")) ? q.get("color") : p.hero;
    let size = null, shot = 1;
    document.title = `${p.name} — Europa Culture`;
    root.innerHTML = `
      <div class="pdp-gallery">
        <div class="pdp-main"><img id="pdp-img" alt=""></div>
        <div class="pdp-thumbs" id="pdp-thumbs"></div>
      </div>
      <div class="pdp-info">
        <p class="eyebrow">Collection I · ${COL[p.collection]}</p>
        <h1 class="pdp-title">${p.name}</h1>
        <p class="pdp-sub">Heavyweight oversized tee · 240gsm cotton</p>
        <p class="pdp-price">${money(p.price)}</p>
        <p class="pdp-blurb">${p.blurb}</p>
        <p class="label">Colour — <span id="color-name"></span></p>
        <div class="colors" id="colors">${p.colors.map((c) => `<button data-color="${c}" aria-label="${C[c].label}" style="--c:${C[c].swatch}"></button>`).join("")}</div>
        <p class="label">Size</p>
        <div class="sizes" role="radiogroup" aria-label="Size">${p.sizes.map((s) => `<button role="radio" aria-checked="false" data-size="${s}">${s}</button>`).join("")}</div>
        <button class="btn btn-solid btn-wide" id="add">Select a size</button>
        <ul class="perks"><li>Free EU &amp; US shipping over ${CUR}100</li><li>30-day returns</li><li>Printed to order</li></ul>
        <details open><summary>Details</summary><p>Oversized, dropped-shoulder fit in 240gsm heavyweight cotton. Front print only, back left clean. Take your usual size for a relaxed fit, or size down for a closer cut.</p></details>
        <details><summary>Shipping &amp; returns</summary><p>Printed to order and shipped in 3–5 business days. Free shipping across the EU &amp; US over ${CUR}100. Free returns within 30 days.</p></details>
        <details><summary>Care</summary><p>Wash cold, inside out. Hang dry. Do not iron the print. Treat it like a façade: it should last a century.</p></details>
      </div>`;
    const main = $("#pdp-img"), thumbs = $("#pdp-thumbs"), add = $("#add");
    const labels = ["On model", "Flat lay, front", "Flat lay, back", "On model, back"];
    function paint() {
      main.src = img(p, color, shot); main.alt = `${p.name} in ${C[color].label}, ${labels[shot - 1].toLowerCase()}`;
      thumbs.innerHTML = [1, 2, 3, 4].map((n) => `<button data-shot="${n}" aria-label="${labels[n - 1]}" aria-current="${n === shot}"><img src="${img(p, color, n)}" alt=""></button>`).join("");
      $("#color-name").textContent = C[color].label;
      $$("[data-color]", root).forEach((b) => b.setAttribute("aria-pressed", b.dataset.color === color));
      history.replaceState(null, "", `product.html?id=${p.id}&color=${color}`);
    }
    thumbs.addEventListener("click", (e) => { const b = e.target.closest("[data-shot]"); if (b) { shot = +b.dataset.shot; paint(); } });
    $("#colors").addEventListener("click", (e) => { const b = e.target.closest("[data-color]"); if (b) { color = b.dataset.color; paint(); } });
    $$("[data-size]", root).forEach((b) => b.addEventListener("click", () => {
      size = b.dataset.size;
      $$("[data-size]", root).forEach((x) => x.setAttribute("aria-checked", x === b));
      add.textContent = `Add to bag — ${money(p.price)}`;
    }));
    add.addEventListener("click", () => {
      if (!size) { add.classList.add("shake"); setTimeout(() => add.classList.remove("shake"), 400); return; }
      addToCart(p.id, color, size);
    });
    paint();
    const more = $("#more-grid");
    if (more) {
      const same = P.filter((x) => x.id !== p.id && x.collection === p.collection);
      const rest = P.filter((x) => x.id !== p.id && x.collection !== p.collection);
      more.innerHTML = [...same, ...rest].slice(0, 3).map((x) => card(x, P.indexOf(x))).join("");
    }
  }

  function renderCredits() {
    const el = $("#credits"); if (!el) return;
    el.innerHTML = "Photography via Wikimedia Commons: " + S.map((s) =>
      `<a href="${s.page}" target="_blank" rel="noopener">${s.place}</a> — ${s.credit} (${s.license})`).join(" · ") + ".";
  }

  function renderFooterShop() {
    const el = $("#foot-shop"); if (!el) return;
    el.innerHTML = `<h4>Shop</h4><a href="shop.html">All pieces</a>` +
      Object.entries(COL).map(([k, l]) => `<a href="shop.html?c=${k}">${l}</a>`).join("");
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    heroCarousel(); productCarousel(); renderCollections(); renderShop(); renderProduct(); renderCart(); renderCredits(); renderFooterShop();
    const y = $("#year"); y && (y.textContent = new Date().getFullYear());
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
    form && form.addEventListener("submit", (e) => { e.preventDefault(); form.innerHTML = `<p class="signup-done">Merci. You're on the list.</p>`; });
    const io = "IntersectionObserver" in window && new IntersectionObserver((es) => es.forEach((x) => {
      if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); }
    }), { threshold: 0.12 });
    $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
    const header = $(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  });
})();
