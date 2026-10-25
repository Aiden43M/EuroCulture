/* Europa Culture — "Beat the dealer" welcome game.
   Play blackjack until you win; win → enter email → unlock 15% off (applied to the bag automatically).
   Every card is dealt one at a time from the shoe; scores count up as each card lands.
   Emails are kept in this browser. To collect them, set window.EC_EMAIL_ENDPOINT in js/products.js
   to any URL that accepts a JSON POST (Formspree, Klaviyo, Zapier/n8n webhook, etc.). */
(function () {
  const CODE = "BLACKJACK15", PCT = 15;
  const K = { won: "ec_bj_won", seen: "ec_bj_seen", disc: "ec_discount", email: "ec_bj_email" };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = reduced ? { deal: 60, gap: 80, flip: 60, think: 120 } : { deal: 460, gap: 230, flip: 520, think: 520 };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SUITS = [["♠", 0], ["♥", 1], ["♦", 1], ["♣", 0]];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const $ = (s) => document.querySelector(s);

  let deck = [], player = [], dealer = [], busy = false, holeEl = null, holeShown = false;

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
  const soft = (hand) => { let t = 0, a = 0; for (const c of hand) { if (c.r === "A") { a++; t += 1; } else t += ["J","Q","K"].includes(c.r) ? 10 : +c.r; } return a > 0 && t + 10 <= 21; };
  const isBJ = (h) => h.length === 2 && total(h) === 21;

  /* ---------- rendering ---------- */
  function cardEl(c, faceDown) {
    const el = document.createElement("div");
    el.className = "bj-card" + (faceDown ? " down" : "") + (c.red ? " red" : "");
    el.innerHTML = `<div class="bj-inner">
      <div class="bj-face"><span class="tl">${c.r}<i>${c.s}</i></span><span class="mid">${c.s}</span><span class="br">${c.r}<i>${c.s}</i></span></div>
      <div class="bj-back"><span>EC</span></div></div>`;
    return el;
  }
  function setScore(id, value, label) {
    const el = $(id), text = String(label || value);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function scores() {
    const pt = total(player);
    setScore("#bj-pt", pt, soft(player) && pt < 21 && player.length ? `${pt - 10} / ${pt}` : "");
    const visible = holeShown ? dealer : dealer.filter((_, i) => i !== 1);
    setScore("#bj-dt", total(visible), !holeShown && dealer.length > 1 ? `${total(visible)} + ?` : "");
  }
  async function dealTo(who, faceDown) {
    const c = draw();
    (who === "p" ? player : dealer).push(c);
    const el = cardEl(c, faceDown);
    $(who === "p" ? "#bj-player" : "#bj-dealer").appendChild(el);
    if (faceDown) holeEl = el;
    await sleep(T.deal * 0.55);           // score updates as the card lands
    scores();
    await sleep(T.deal * 0.45 + T.gap);
  }
  async function revealHole() {
    if (!holeEl || holeShown) return;
    holeEl.classList.remove("down"); holeShown = true;
    await sleep(T.flip * 0.5); scores(); await sleep(T.flip * 0.5 + T.gap);
  }

  function msg(text, tone) { const m = $("#bj-msg"); m.textContent = text; m.dataset.tone = tone || ""; m.classList.remove("show"); void m.offsetWidth; m.classList.add("show"); }
  function controls(state) {
    $("#bj-hit").hidden = $("#bj-stand").hidden = state !== "play";
    $("#bj-deal").hidden = state !== "again";
    $("#bj-hit").disabled = $("#bj-stand").disabled = busy;
  }
  const lock = (v) => { busy = v; $(".bj-table").classList.toggle("busy", v); $("#bj-hit").disabled = $("#bj-stand").disabled = $("#bj-deal").disabled = v; };

  /* ---------- game flow ---------- */
  async function deal() {
    if (busy) return; lock(true);
    player = []; dealer = []; holeEl = null; holeShown = false;
    $("#bj-player").innerHTML = ""; $("#bj-dealer").innerHTML = "";
    $("#bj-pt").textContent = "0"; $("#bj-dt").textContent = "0";
    $(".bj-table").classList.remove("won", "lost");
    controls("none"); msg("Dealing…");
    await sleep(reduced ? 0 : 250);
    await dealTo("p"); await dealTo("d"); await dealTo("p"); await dealTo("d", true);
    lock(false);
    if (isBJ(player) || isBJ(dealer)) return finish();
    msg("Your move. Hit for another card, or stand.");
    controls("play");
  }
  async function hit() {
    if (busy) return; lock(true); controls("none");
    await dealTo("p");
    lock(false);
    const t = total(player);
    if (t > 21) return finish();
    if (t === 21) return stand();
    msg(t >= 17 ? `${t}. Brave — hit again, or stand?` : `${t}. Hit or stand?`);
    controls("play");
  }
  async function stand() {
    if (busy) return; lock(true); controls("none");
    msg("Dealer's turn…");
    await revealHole();
    while (total(dealer) < 17) { await sleep(T.think * 0.4); await dealTo("d"); }
    lock(false);
    finish();
  }
  async function finish() {
    lock(true);
    if (total(player) <= 21) await revealHole();
    lock(false);
    const p = total(player), d = total(dealer);
    let res;
    if (p > 21) res = "lose";
    else if (isBJ(player) && !isBJ(dealer)) res = "win";
    else if (isBJ(dealer) && !isBJ(player)) res = "lose";
    else if (d > 21 || p > d) res = "win";
    else if (p < d) res = "lose";
    else res = "push";
    const table = $(".bj-table");
    if (res === "win") {
      table.classList.add("won");
      msg(isBJ(player) ? "Blackjack! You win." : d > 21 ? `Dealer busts with ${d}. You win!` : `You win, ${p} to ${d}!`, "win");
      controls("none");
      setTimeout(showUnlock, reduced ? 300 : 1500);
    } else if (res === "push") { msg(`Push at ${p}. Deal again.`); controls("again"); }
    else {
      table.classList.add("lost");
      msg(p > 21 ? `Bust with ${p}. Deal again — play until you win.` : `Dealer wins, ${d} to ${p}. Deal again.`, "lose");
      controls("again");
    }
  }

  /* ---------- unlock ---------- */
  function showUnlock() { $("#bj-game").hidden = true; $("#bj-unlock").hidden = false; $("#bj-email").focus(); }
  async function submitEmail(e) {
    e.preventDefault();
    const email = $("#bj-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("#bj-email").focus(); return; }
    set(K.email, email); set(K.won, "1"); set(K.disc, JSON.stringify({ code: CODE, pct: PCT }));
    const url = window.EC_EMAIL_ENDPOINT;
    if (url) { try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email, source: "blackjack", code: CODE }) }); } catch {} }
    $("#bj-unlock").hidden = true; $("#bj-done").hidden = false;
    document.dispatchEvent(new CustomEvent("ec:discount"));
    $("#bj-tab")?.remove();
  }

  /* ---------- modal ---------- */
  function open() {
    set(K.seen, "1");
    document.body.classList.add("bj-open");
    $("#bj-modal").hidden = false;
    if (!player.length && !busy) { if (!deck.length) newDeck(); setTimeout(deal, reduced ? 0 : 450); }
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
          <p class="bj-sub">Win one hand of blackjack and the discount is yours. Lose? Deal again — play until you win.</p>
          <div class="bj-table">
            <div class="bj-shoe" aria-hidden="true"></div>
            <div class="bj-row"><span class="bj-label">Dealer<b id="bj-dt">0</b></span><div class="bj-hand" id="bj-dealer"></div></div>
            <div class="bj-row"><span class="bj-label">You<b id="bj-pt">0</b></span><div class="bj-hand" id="bj-player"></div></div>
            <p class="bj-msg" id="bj-msg" aria-live="polite"></p>
            <div class="bj-actions">
              <button class="btn bj-btn" id="bj-hit" hidden>Hit</button>
              <button class="btn bj-btn solid" id="bj-stand" hidden>Stand</button>
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
    document.addEventListener("keydown", (e) => {
      if (m.hidden) return;
      if (e.key === "Escape") close();
      else if (!$("#bj-hit").hidden && !busy && (e.key === "h" || e.key === "H")) hit();
      else if (!$("#bj-stand").hidden && !busy && (e.key === "s" || e.key === "S")) stand();
    });
    $("#bj-hit").addEventListener("click", hit);
    $("#bj-stand").addEventListener("click", stand);
    $("#bj-deal").addEventListener("click", deal);
    $("#bj-unlock").addEventListener("submit", submitEmail);
    if (get(K.won) === "1") return;
    if (!get(K.seen)) setTimeout(open, 1200); else addTab();
  }
  document.addEventListener("DOMContentLoaded", mount);
})();
