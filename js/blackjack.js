/* Europa Culture — "Beat the dealer" welcome game.
   Play blackjack until you win; win → enter email → unlock 15% off (applied to the bag automatically).
   Emails are kept in this browser. To collect them, set window.EC_EMAIL_ENDPOINT in js/products.js
   to any URL that accepts a JSON POST (Formspree, Klaviyo, Zapier/n8n webhook, etc.). */
(function () {
  const CODE = "BLACKJACK15", PCT = 15;
  const K = { won: "ec_bj_won", seen: "ec_bj_seen", disc: "ec_discount", email: "ec_bj_email" };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const SUITS = [["♠", 0], ["♥", 1], ["♦", 1], ["♣", 0]];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  let deck = [], player = [], dealer = [], over = false;
  const $ = (s) => document.querySelector(s);

  function newDeck() {
    deck = [];
    for (let d = 0; d < 2; d++) for (const [s, red] of SUITS) for (const r of RANKS) deck.push({ r, s, red });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }
  const draw = () => { if (deck.length < 15) newDeck(); return deck.pop(); };
  function total(hand) {
    let t = 0, aces = 0;
    for (const c of hand) { if (c.r === "A") { aces++; t += 11; } else t += ["J", "Q", "K"].includes(c.r) ? 10 : +c.r; }
    while (t > 21 && aces--) t -= 10;
    return t;
  }
  const isBJ = (h) => h.length === 2 && total(h) === 21;

  function cardHTML(c, hidden, i) {
    if (hidden) return `<div class="bj-card back" style="--i:${i}"><span>EC</span></div>`;
    return `<div class="bj-card${c.red ? " red" : ""}" style="--i:${i}">
      <span class="tl">${c.r}<br>${c.s}</span><span class="mid">${c.s}</span><span class="br">${c.r}<br>${c.s}</span></div>`;
  }
  function render(reveal) {
    $("#bj-dealer").innerHTML = dealer.map((c, i) => cardHTML(c, !reveal && i === 1, i)).join("");
    $("#bj-player").innerHTML = player.map((c, i) => cardHTML(c, false, i)).join("");
    $("#bj-dt").textContent = reveal ? total(dealer) : total([dealer[0]]);
    $("#bj-pt").textContent = total(player);
  }
  function msg(text, tone) { const m = $("#bj-msg"); m.textContent = text; m.dataset.tone = tone || ""; }
  function controls(state) {
    $("#bj-hit").hidden = $("#bj-stand").hidden = state !== "play";
    $("#bj-deal").hidden = state !== "again";
  }

  function deal() {
    over = false; player = [draw(), draw()]; dealer = [draw(), draw()];
    render(false); controls("play"); msg("Hit to take a card. Stand to hold.");
    if (isBJ(player) || isBJ(dealer)) finish();
  }
  function hit() {
    if (over) return; player.push(draw()); render(false);
    const t = total(player);
    if (t > 21) finish(); else if (t === 21) stand();
  }
  function stand() {
    if (over) return;
    while (total(dealer) < 17) dealer.push(draw());
    finish();
  }
  function finish() {
    over = true; render(true);
    const p = total(player), d = total(dealer);
    let res;
    if (p > 21) res = "lose";
    else if (isBJ(player) && !isBJ(dealer)) res = "win";
    else if (isBJ(dealer) && !isBJ(player)) res = "lose";
    else if (d > 21 || p > d) res = "win";
    else if (p < d) res = "lose";
    else res = "push";
    if (res === "win") {
      msg(p > 21 ? "" : `You win, ${p} against ${d > 21 ? "a bust" : d}.`, "win");
      controls("none");
      setTimeout(showUnlock, 900);
    } else if (res === "push") { msg(`Push at ${p}. Deal again.`); controls("again"); }
    else { msg(p > 21 ? `Bust at ${p}. Deal again — you can play until you win.` : `Dealer wins, ${d} to ${p}. Deal again.`, "lose"); controls("again"); }
  }

  function showUnlock() {
    $("#bj-game").hidden = true; $("#bj-unlock").hidden = false;
    $("#bj-email").focus();
  }
  async function submitEmail(e) {
    e.preventDefault();
    const email = $("#bj-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("#bj-email").focus(); return; }
    set(K.email, email); set(K.won, "1");
    set(K.disc, JSON.stringify({ code: CODE, pct: PCT }));
    const url = window.EC_EMAIL_ENDPOINT;
    if (url) { try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email, source: "blackjack", code: CODE }) }); } catch {} }
    $("#bj-unlock").hidden = true; $("#bj-done").hidden = false;
    document.dispatchEvent(new CustomEvent("ec:discount"));
    $("#bj-tab")?.remove();
  }

  function open() {
    set(K.seen, "1");
    document.body.classList.add("bj-open");
    $("#bj-modal").hidden = false;
    if (!player.length) { newDeck(); deal(); }
  }
  function close() {
    document.body.classList.remove("bj-open");
    $("#bj-modal").hidden = true;
    if (get(K.won) !== "1") addTab();
  }
  function addTab() {
    if (document.getElementById("bj-tab")) return;
    const t = document.createElement("button");
    t.id = "bj-tab"; t.className = "bj-tab"; t.innerHTML = "<span>♠</span> Win 15% off";
    t.addEventListener("click", open); document.body.appendChild(t);
  }

  function mount() {
    const m = document.createElement("div");
    m.id = "bj-modal"; m.className = "bj-modal"; m.hidden = true;
    m.innerHTML = `
      <div class="bj-scrim" data-bj-close></div>
      <div class="bj-panel" role="dialog" aria-modal="true" aria-labelledby="bj-title">
        <button class="bj-x" data-bj-close aria-label="Close">×</button>
        <div id="bj-game">
          <p class="bj-eyebrow">Welcome to Europa Culture</p>
          <h2 id="bj-title">Beat the dealer.<br><em>Win 15% off.</em></h2>
          <p class="bj-sub">Play blackjack. Win one hand and your discount is unlocked. Lose? Deal again — play until you win.</p>
          <div class="bj-table">
            <div class="bj-row"><span class="bj-label">Dealer <b id="bj-dt">0</b></span><div class="bj-hand" id="bj-dealer"></div></div>
            <div class="bj-row"><span class="bj-label">You <b id="bj-pt">0</b></span><div class="bj-hand" id="bj-player"></div></div>
            <p class="bj-msg" id="bj-msg" aria-live="polite"></p>
            <div class="bj-actions">
              <button class="btn bj-btn" id="bj-hit">Hit</button>
              <button class="btn bj-btn solid" id="bj-stand">Stand</button>
              <button class="btn bj-btn solid" id="bj-deal" hidden>Deal again</button>
            </div>
          </div>
          <button class="bj-skip" data-bj-close>No thanks, shop at full price</button>
        </div>
        <form id="bj-unlock" class="bj-unlock" hidden>
          <p class="bj-eyebrow">You beat the dealer</p>
          <h2>15% off is <em>yours.</em></h2>
          <p class="bj-sub">Enter your email to unlock the discount. It's applied to your bag automatically.</p>
          <label class="sr-only" for="bj-email">Email</label>
          <input id="bj-email" type="email" required placeholder="Email address" autocomplete="email">
          <button class="btn bj-btn solid wide" type="submit">Unlock 15% off</button>
          <p class="bj-fine">We'll send new drops occasionally. Unsubscribe any time.</p>
        </form>
        <div id="bj-done" class="bj-unlock" hidden>
          <p class="bj-eyebrow">Discount unlocked</p>
          <h2>Your code: <em>${CODE}</em></h2>
          <p class="bj-sub">15% off everything in your bag — already applied at checkout.</p>
          <a href="shop.html" class="btn bj-btn solid wide">Shop T-shirts</a>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target.closest("[data-bj-close]")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) close(); });
    $("#bj-hit").addEventListener("click", hit);
    $("#bj-stand").addEventListener("click", stand);
    $("#bj-deal").addEventListener("click", deal);
    $("#bj-unlock").addEventListener("submit", submitEmail);

    if (get(K.won) === "1") return;
    if (!get(K.seen)) setTimeout(open, 1200); else addTab();
  }
  document.addEventListener("DOMContentLoaded", mount);
})();
