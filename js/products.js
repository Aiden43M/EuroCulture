// Europa Culture — Collection I catalog.
// Images live in assets/products/<id>/<color>-<n>.jpg
//   1 = model front · 2 = flat lay front · 3 = flat lay back · 4 = model back
// `stripeLink` (optional): paste a Stripe Payment Link per product to enable direct checkout.
window.EC_CURRENCY = "€";

window.EC_COLORS = {
  grey:  { label: "Heather Grey", swatch: "#C9C9C7" },
  black: { label: "Noir",         swatch: "#151515" },
  white: { label: "Ivory White",  swatch: "#F4F2EE" }
};

// Where the blackjack popup sends collected emails (JSON POST). Empty = kept in the visitor's browser only.
window.EC_EMAIL_ENDPOINT = "";

const P = (id, name, collection, hero, blurb) => ({
  id, name, collection, hero, blurb,
  price: 35,
  colors: ["grey", "black", "white"],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  stripeLink: ""
});

window.EC_PRODUCTS = [
  P("integrate-or-evacuate",           "Integrate Or Evacuate",               "borders",  "grey",  "One line. No footnotes. Heavyweight oversized tee with a bold chest print."),
  P("respect-the-host",                "Respect The Host",                    "borders",  "black", "Good manners built every great city. Classical serif capitals on heavyweight cotton."),
  P("love-it-or-leave-it",             "Love It Or Leave It",                 "borders",  "white", "An old ultimatum, set in inscription capitals."),
  P("make-europe-safe-again",          "Make Europe Safe Again",              "borders",  "grey",  "Walk home at night again. Stacked bold print, oversized fit."),
  P("i-want-my-streets-back",          "I Want My Streets Back",              "borders",  "black", "For anyone who remembers what the high street used to feel like."),
  P("christianity-for-europe",         "Christianity For Europe",             "faith",    "white", "The faith that raised the cathedrals. Bold chest print."),
  P("make-europe-christian-again",     "Make Europe Christian Again",         "faith",    "grey",  "Bells on Sunday. Stacked bold print, heavyweight cotton."),
  P("deus-vult-always",                "Deus Vult. Always.",                  "faith",    "black", "Two words, nine centuries, still standing."),
  P("built-by-believers",              "Built By Believers",                  "faith",    "white", "A line map of the continent with the truth set across it: none of it was built by accident."),
  P("european-by-culture",             "European By Culture",                 "nations",  "grey",  "Not a passport. A way of living. Classical serif capitals."),
  P("stubborn-like-the-swiss",         "Stubborn Like The Swiss",             "nations",  "black", "Neutral on most things. Not on this."),
  P("proud-like-poland",               "Proud Like Poland",                   "nations",  "white", "A nation that knows exactly who it is."),
  P("be-like-hungary",                 "Be Like Hungary",                     "nations",  "grey",  "Short, bold, and guaranteed to start a conversation."),
  P("better-far-right-than-far-wrong", "Better To Be Far Right Than Far Wrong", "politics", "black", "The shirt that answers the label before anyone uses it."),
  P("not-far-right-just-right",        "Not Far Right, Just Right",           "politics", "white", "Common sense, printed large.")
];

// Featured on the home page, in this order, with the colour shown.
window.EC_FEATURED = [
  { id: "integrate-or-evacuate",  color: "black" },
  { id: "make-europe-safe-again", color: "white" },
  { id: "european-by-culture",    color: "grey" }
];
