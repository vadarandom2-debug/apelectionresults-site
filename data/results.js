// LIVE RESULTS — edit this file on counting day; the site re-reads it every 60 seconds.
//
// bodies: keyed by body id (lowercase, hyphenated name, e.g. "greater-visakhapatnam", "gudur-kurnool").
//   declared : number of wards whose result is declared
//   wards    : { PARTY: wardsWon }                     parties: TDP JSP BJP YSRCP INC LEFT OTH
//   leads    : { PARTY: wardsLeading }   (optional, while counting)
//   head     : { party, name, status: "leading" | "won", margin }   — directly elected Mayor / Chairperson
//   turnout  : polling percentage, e.g. 63.4
//
// Example:
//   "vijayawada": { declared: 40, wards: { TDP: 22, YSRCP: 12, JSP: 4, BJP: 2 },
//                   head: { party: "TDP", name: "Candidate name", status: "leading", margin: 4210 }, turnout: 58.2 },
//
// rural: { zptc: { declared, seats: {PARTY: n} }, mptc: {...}, gp: {...} }
window.AP_RESULTS = {
  updated: null,          // e.g. "2026-10-30T11:45:00+05:30"
  turnout: null,          // statewide urban turnout %, after polling
  bodies: {},
  rural: {},
};
