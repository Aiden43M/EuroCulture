/* Europa Culture — storefront logic (no build step, no dependencies) */
(function () {
  const P = window.EC_PRODUCTS || [];
  const S = window.EC_SCENES || [];
  const CUR = window.EC_CURRENCY || "€";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => `${CUR}${n.toFixed(2).replace(/\.00$/, "")}`;
  const byId = (id) => P.find((p) => p.id === id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const kind = (p) => (p.type === "tote" ? "Canvas tote" : p.type === "hoodie" ? "Heavyweight hoodie" : "Heavyweight tee");
  // daylight scenes read best behind garments
  const DAY = [2, 3, 4, 5, 0, 1];
  const sceneFor = (p) => S[DAY[P.indexOf(p) % DAY.length]] || S[0];

  /* ---------- Garment renderer (SVG mockups — swap for product photos later) ---------- */
  function garmentSVG(p, opts = {}) {
    const f = p.fabric, ink = p.ink;
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    const text = (y0, size, gap) =>
      p.lines.map((l, i) => `<text x="200" y="${y0 + i * gap}" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="${size}" font-weight="500" letter-spacing="1.2" fill="${ink}">${l}</text>`).join("");
    const shade = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>`;
    const edge = `stroke="#000" stroke-opacity=".16" stroke-width="1.5"`;
    let body;
    if (p.type === "tote") {
      body = `<path d="M150 140 C150 40 250 40 250 140" fill="none" stroke="${f}" stroke-width="14" stroke-linecap="round"/>
        <path d="M150 140 C150 40 250 40 250 140" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="14"/>
        <rect x="88" y="130" width="224" height="290" rx="3" fill="${f}" ${edge}/>
        <rect x="88" y="130" width="224" height="290" rx="3" fill="url(#${gid})"/>${text(258, 19, 26)}`;
    } else {
      const tee = "M140 48 Q200 84 260 48 L330 70 L392 150 L338 190 L310 165 L310 425 L90 425 L90 165 L62 190 L8 150 L70 70 Z";
      const hood = p.type === "hoodie"
        ? `<path d="M128 60 C128 -6 272 -6 272 60 Q200 104 128 60 Z" fill="${f}" ${edge}/><path d="M128 60 C128 -6 272 -6 272 60 Q200 104 128 60 Z" fill="#000" fill-opacity=".18"/>` : "";
      const extras = p.type === "hoodie"
        ? `<path d="M128 330 L272 330 L292 405 L108 405 Z" fill="#000" fill-opacity=".14"/>
           <line x1="186" y1="80" x2="182" y2="150" stroke="${ink}" stroke-opacity=".5" stroke-width="2"/>
           <line x1="214" y1="80" x2="218" y2="150" stroke="${ink}" stroke-opacity=".5" stroke-width="2"/>
           <rect x="90" y="410" width="220" height="15" fill="#000" fill-opacity=".15"/>`
        : `<path d="M140 48 Q200 84 260 48" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="5"/>`;
      body = `${hood}<path d="${tee}" fill="${f}" ${edge}/><path d="${tee}" fill="url(#${gid})"/>${extras}${text(p.type === "hoodie" ? 205 : 190, 21, 29)}`;
    }
    return `<svg viewBox="0 0 400 440" role="img" aria-label="${p.name}, ${p.colorway}" class="garment ${opts.cls || ""}">${shade}${body}</svg>`;
  }

  /* ---------- Product card (photo backdrop + garment) ---------- */
  function card(p, i) {
    const sc = sceneFor(p);
    return `<a class="pcard" href="product.html?id=${p.id}">
      <div class="pcard-media">
        <div class="pcard-bg" style="background-image:url(&quot;${sc.src}&quot;)"></div>
        ${garmentSVG(p)}
        <span class="pcard-no">${String(i + 1).padStart(2, "0")}</span>
        <span class="pcard-cta">View piece →</span>
      </div>
      <div class="pcard-body"><div><p class="pcard-name">${p.lines.join(" ")}</p>
        <p class="pcard-meta">${kind(p)} · ${p.colorway}</p></div>
        <p class="pcard-price">${money(p.price)}</p></div></a>`;
  }

  /* ---------- Hero carousel ---------- */
  function heroCarousel() {
    const wrap = $("#hero-slides"); if (!wrap || !S.length) return;
    wrap.innerHTML = S.map((s, i) => `<figure class="slide${i === 0 ? " active" : ""}" data-i="${i}">
      <img src="${s.src}" alt="${s.place}, ${s.city}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></figure>`).join("");
    const bars = $("#hero-bars");
    bars.innerHTML = S.map((s, i) => `<button class="bar" aria-label="Show ${s.place}" data-go="${i}"><span></span></button>`).join("");
    const DUR = 5500;
    let idx = 0, timer;
    const slides = () => $$(".slide", wrap);

    $$("img", wrap).forEach((img) => img.addEventListener("error", () => {
      const fig = img.closest(".slide"); const i = +fig.dataset.i;
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
        const cand = ((n + k) % list.length + list.length) % list.length;
        if (!list[cand].classList.contains("broken")) { idx = cand; break; }
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
    $("#feat-next")?.addEventListener("click", () => { next(); hold(); });
    $("#feat-prev")?.addEventListener("click", () => { prev(); hold(); });
    let timer, paused = false;
    const tick = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => !paused && !document.hidden && next(), 3800); };
    const hold = () => { paused = true; clearTimeout(hold.t); hold.t = setTimeout(() => (paused = false), 6000); };
    track.addEventListener("mouseenter", () => (paused = true));
    track.addEventListener("mouseleave", () => (paused = false));
    track.addEventListener("touchstart", hold, { passive: true });
    // progress line
    const line = $("#feat-line");
    track.addEventListener("scroll", () => {
      const max = track.scrollWidth - track.clientWidth;
      line && (line.style.transform = `scaleX(${max > 0 ? Math.max(0.08, track.scrollLeft / max) : 1})`);
    }, { passive: true });
    tick();
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
    $$("[data-cart-count]").forEach((el) => (el.textContent = count));
    const list = $("#cart-lines"); if (!list) return;
    list.innerHTML = !cart.length
      ? `<p class="cart-empty">Your bag is empty.<br><span>Beauty is waiting.</span></p>`
      : cart.map((l, i) => {
          const p = byId(l.id); if (!p) return "";
          return `<div class="cart-line">
            <div class="cart-thumb">${garmentSVG(p)}</div>
            <div class="cart-info"><p class="cart-name">${p.lines.join(" ")}</p>
              <p class="cart-meta">${kind(p)} · ${p.colorway} · ${l.size}</p>
              <div class="qty"><button data-q="-1" data-i="${i}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-q="1" data-i="${i}" aria-label="Increase">+</button></div></div>
            <p class="cart-price">${money(p.price * l.qty)}</p></div>`;
        }).join("");
    const sub = cart.reduce((s, l) => s + (byId(l.id)?.price || 0) * l.qty, 0);
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

  /* ---------- Pages ---------- */
  function renderShop() {
    const grid = $("#shop-grid"); if (!grid) return;
    grid.innerHTML = P.map((p, i) => `<div class="reveal" style="--d:${(i % 3) * 80}ms">${card(p, i)}</div>`).join("");
  }
  function renderProduct() {
    const root = $("#product"); if (!root) return;
    const p = byId(new URLSearchParams(location.search).get("id")) || P[0];
    const sc = sceneFor(p);
    document.title = `${p.lines.join(" ")} — ${p.colorway} | Europa Culture`;
    let size = p.sizes.length === 1 ? p.sizes[0] : null;
    root.innerHTML = `
      <div class="pdp-media"><div class="pcard-bg" style="background-image:url(&quot;${sc.src}&quot;)"></div>${garmentSVG(p, { cls: "big" })}
        <span class="pdp-scene">${sc.place}, ${sc.city}</span></div>
      <div class="pdp-info">
        <p class="eyebrow">Collection I · ${p.colorway}</p>
        <h1 class="pdp-title">${p.lines.join("<br>")}</h1>
        <p class="pdp-sub">${kind(p)}</p>
        <p class="pdp-price">${money(p.price)}</p>
        <p class="pdp-blurb">${p.blurb}</p>
        <p class="label">Size</p>
        <div class="sizes" role="radiogroup" aria-label="Size">
          ${p.sizes.map((s) => `<button role="radio" aria-checked="${s === size}" data-size="${s}">${s}</button>`).join("")}
        </div>
        <button class="btn btn-solid btn-wide" id="add">${size ? "Add to bag" : "Select a size"}</button>
        <ul class="perks"><li>Free EU &amp; US shipping over ${CUR}100</li><li>30-day returns</li><li>Organic cotton</li></ul>
        <details open><summary>Details</summary><p>Organic cotton, pre-shrunk. Screen printed by hand. Boxy, slightly cropped fit — take your usual size.</p></details>
        <details><summary>Shipping &amp; returns</summary><p>Ships in 2–4 business days. Free shipping across the EU &amp; US over ${CUR}100. Free returns within 30 days.</p></details>
        <details><summary>Care</summary><p>Wash cold, inside out. Hang dry. Do not iron the print. Treat it like a façade: it should last a century.</p></details>
      </div>`;
    const add = $("#add");
    $$("[data-size]", root).forEach((b) => b.addEventListener("click", () => {
      size = b.dataset.size;
      $$("[data-size]", root).forEach((x) => x.setAttribute("aria-checked", x === b));
      add.textContent = "Add to bag";
    }));
    add.addEventListener("click", () => {
      if (!size) { add.classList.add("shake"); setTimeout(() => add.classList.remove("shake"), 400); return; }
      addToCart(p.id, size);
    });
    const more = $("#more-grid");
    if (more) more.innerHTML = P.filter((x) => x.id !== p.id).slice(0, 3).map((x) => card(x, P.indexOf(x))).join("");
  }
  function renderCredits() {
    const el = $("#credits"); if (!el) return;
    el.innerHTML = "Photography via Wikimedia Commons: " + S.map((s) =>
      `<a href="${s.page}" target="_blank" rel="noopener">${s.place}</a> — ${s.credit} (${s.license})`).join(" · ") + ".";
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    heroCarousel(); productCarousel(); renderShop(); renderProduct(); renderCart(); renderCredits();
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
