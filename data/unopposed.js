// Unopposed (ఏకగ్రీవం) watch: wards and head posts with only one candidate left.
// status: "declared" = officially declared by the Returning Officer (after withdrawals close, 21 Oct 3 pm)
//         "likely"   = reported as all-but-certain (only one valid nomination left)
//         "possible" = the opposition filed few or no nominations; depends on scrutiny and withdrawals
// Sources are news reports; update to "declared" only when officials announce it.
window.AP_UNOPPOSED = {
  updated: "2026-10-31T19:00:00+05:30",
  // The 19 bodies the SEC singled out for review after the Supreme Court order (Eenadu, 21 Oct); results there may change.
  // Statewide unopposed tallies. Divisions/wards: Newsmeter 26 Oct (116 of the final 118 divisions have a party split).
  // ZPTC: 77 per the SEC (Deccan Chronicle / Andhra Jyothy, 28 Oct). MPTC: 1,985 declared by the SEC; the only party
  // split (Eenadu / Newsmeter, 29 Oct) covers 2,043, i.e. those plus 58 seats expected to go the same way.
  totals: {
    chairs: { TDP: 15, JSP: 1, BJP: 1 },
    divisions: { total: 118, split: { TDP: 109, JSP: 3, BJP: 3, YSRCP: 1 } },
    wards: { total: 637, split: { TDP: 553, JSP: 35, BJP: 25, YSRCP: 18, LEFT: 1, OTH: 5 } },
    zptc: { total: 77, split: { TDP: 71, JSP: 2, BJP: 3, YSRCP: 1 } },
    mptc: { total: 1985, splitTotal: 2043, split: { TDP: 1781, JSP: 101, BJP: 52, YSRCP: 93, OTH: 16 } },
  },
  wardsTotal: 755, // official statewide count (118 divisions + 637 wards); the items below list only reported towns
  review: [],
  reviewNote: "Declarations issued by the Returning Officers on 25 Oct. On 27 Oct the Supreme Court disposed of YSRCP's plea and did not disturb them; anyone claiming they were wrongly kept out can file an election petition.",
  items: [
    {
      "body": "proddatur",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 52
      },
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Nandyala Raghava Reddy"
      },
      "text": "Declared unopposed: Nandyala Raghava Reddy (TDP) elected Chairperson. Unopposed wards: TDP 52.",
      "te": "చైర్‌పర్సన్‌గా నంద్యాల రాఘవరెడ్డి ఏకగ్రీవం; 52 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "kamalapuram",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 22,
        "BJP": 1
      },
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Gongalireddy Swapna"
      },
      "text": "Declared unopposed: Gongalireddy Swapna (TDP) elected Chairperson. Unopposed wards: TDP 22, BJP 1.",
      "te": "చైర్‌పర్సన్‌గా గొంగలిరెడ్డి స్వప్న ఏకగ్రీవం; 23 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "yerraguntla",
      "status": "declared",
      "party": "BJP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 27,
      "head": {
        "party": "BJP",
        "name": "Gorla Madhulatha"
      },
      "text": "Declared unopposed: Gorla Madhulatha (BJP) elected Chairperson. 27 wards also unopposed. One ward still goes to a vote.",
      "te": "చైర్‌పర్సన్‌గా గొర్ల మధులత ఏకగ్రీవం; 27 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "badvel",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Somasila Divya Teja"
      },
      "text": "Declared unopposed: Somasila Divya Teja (TDP) elected Chairperson.",
      "te": "చైర్‌పర్సన్‌గా సోమశిల దివ్యతేజ ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "mydukur",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Dhanapala Jagan Mohan Raju"
      },
      "text": "Declared unopposed: Dhanapala Jagan Mohan Raju (TDP) elected Chairperson.",
      "te": "చైర్‌పర్సన్‌గా ధనపాల జగన్‌మోహన్ రాజు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "rajampet",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Dr. Dontham Gayathri"
      },
      "text": "Declared unopposed: Dr. Dontham Gayathri (TDP) elected Chairperson. Announced by the election officer.",
      "te": "చైర్‌పర్సన్‌గా డా. దొంతం గాయత్రి ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "The Hans India, 26 Oct",
          "https://www.thehansindia.com/news/cities/kadapa/alliance-wins-six-municipalities-unopposed-in-kadapa-dist-1135765"
        ]
      ]
    },
    {
      "body": "dachepalli",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 28,
      "head": {
        "party": "TDP",
        "name": "Tangella Srinivasa Rao"
      },
      "text": "Declared unopposed: Tangella Srinivasa Rao (TDP) elected Chairperson. 28 wards also unopposed. All 28 wards to coalition candidates.",
      "te": "చైర్‌పర్సన్‌గా తంగెళ్ల శ్రీనివాసరావు ఏకగ్రీవం; 28 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "gurazala",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 23,
      "head": {
        "party": "TDP",
        "name": "Nelavalli Bollaiah"
      },
      "text": "Declared unopposed: Nelavalli Bollaiah (TDP) elected Chairperson. 23 wards also unopposed. All 23 wards to coalition candidates.",
      "te": "చైర్‌పర్సన్‌గా నెలవల్లి బొల్లయ్య ఏకగ్రీవం; 23 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "piduguralla",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Sheikh Babavali"
      },
      "text": "Declared unopposed: Sheikh Babavali (TDP) elected Chairperson. Announced by officials.",
      "te": "చైర్‌పర్సన్‌గా షేక్ బాబావలి ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "darsi",
      "status": "declared",
      "party": "JSP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 28,
      "head": {
        "party": "JSP",
        "name": "Daram Subba Rao"
      },
      "text": "Declared unopposed: Daram Subba Rao (JSP) elected Chairperson. 28 wards also unopposed. All 28 wards to coalition candidates.",
      "te": "చైర్‌పర్సన్‌గా దారా సుబ్బారావు ఏకగ్రీవం; 28 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "kanigiri",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 30,
      "head": {
        "party": "TDP",
        "name": "Achala Tirupatamma"
      },
      "text": "Declared unopposed: Achala Tirupatamma (TDP) elected Chairperson. 30 wards also unopposed. 30 of 32 wards unopposed.",
      "te": "చైర్‌పర్సన్‌గా అచ్చాల తిరుపతమ్మ ఏకగ్రీవం; 30 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "atmakur-nandyal",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 27,
      "head": {
        "party": "TDP",
        "name": "Dr. Avula Govindarajulu"
      },
      "text": "Declared unopposed: Dr. Avula Govindarajulu (TDP) elected Chairperson. 27 wards also unopposed. 27 of 32 wards unopposed.",
      "te": "చైర్‌పర్సన్‌గా డా. గోవిందరాజులు ఏకగ్రీవం; 27 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "Andhra Jyothy, 21 Oct",
          "https://www.andhrajyothy.com/2026/andhra-pradesh/unanimous-elections-1569207.html"
        ]
      ]
    },
    {
      "body": "rayachoti",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 40,
        "BJP": 3,
        "JSP": 1
      },
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Khader Vali Shaik"
      },
      "text": "Declared unopposed: Khader Vali Shaik (TDP) elected Chairperson. Unopposed wards: TDP 40, BJP 3, JSP 1. All 44 wards unopposed.",
      "te": "చైర్‌పర్సన్‌గా ఖాదర్ వలీ ఏకగ్రీవం; 44 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "punganur",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 32,
      "head": {
        "party": "TDP",
        "name": "Nayeema Taj"
      },
      "text": "Declared unopposed: Nayeema Taj (TDP) elected Chairperson. 32 wards also unopposed. 32 of 36 wards unopposed; YSRCP withdrew from the contest.",
      "te": "చైర్‌పర్సన్‌గా నయీమా తాజ్ ఏకగ్రీవం; 32 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "nagari",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": 3,
      "head": {
        "party": "TDP",
        "name": "E. N. Srinivasan"
      },
      "text": "Declared unopposed: E. N. Srinivasan (TDP) elected Chairperson. 3 wards also unopposed. YSRCP's Chairperson nomination was rejected at scrutiny; RK Roja (YSRCP) said she would challenge it in the High Court.",
      "te": "చైర్‌పర్సన్‌గా ఈ.ఎన్. శ్రీనివాసన్ ఏకగ్రీవం; 3 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ],
        [
          "BIG TV, 19 Oct",
          "https://www.bigtvlive.com/andhra-pradesh/nagari-municipality-chairman-election-unopposed-rk-roja-approach-high-court.html"
        ]
      ]
    },
    {
      "body": "allagadda",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 22,
        "YSRCP": 8,
        "JSP": 2
      },
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Shaik Aneesha"
      },
      "text": "Declared unopposed: Shaik Aneesha (TDP) elected Chairperson. Unopposed wards: TDP 22, YSRCP 8, JSP 2. All 32 wards unopposed.",
      "te": "చైర్‌పర్సన్‌గా షేక్ అనీషా ఏకగ్రీవం; 32 వార్డులు ఏకగ్రీవం.",
      "src": [
        [
          "Deccan Chronicle, 21 Oct",
          "https://www.deccanchronicle.com/southern-states/andhra-pradesh/td-secures-allagadda-municipal-chairperson-post-1997700"
        ]
      ]
    },
    {
      "body": "gooty",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": null,
      "wardsApprox": null,
      "head": {
        "party": "TDP",
        "name": "Govindarajulu Tamil Selvi"
      },
      "text": "Declared unopposed: Govindarajulu Tamil Selvi (TDP) elected Chairperson. Some wards still go to a vote.",
      "te": "చైర్‌పర్సన్‌గా గోవిందరాజులు తమిళ్ సెల్వి ఏకగ్రీవం; కొన్ని వార్డుల్లో పోలింగ్.",
      "src": [
        [
          "hmtv (SEC list), 26 Oct",
          "https://www.hmtvlive.com/telugu-news/amaravathi/ap-municipal-elections-17-chairpersons-unopposed-in-sec-list-204417"
        ],
        [
          "Deccan Chronicle",
          "https://www.deccanchronicle.com/southern-states/andhra-pradesh/polling-today-in-92-urban-local-bodies-of-ap-from-7-am-to-5-pm-2000729"
        ]
      ]
    },
    {
      "body": "kadapa",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 47,
        "BJP": 2,
        "JSP": 1
      },
      "head": null,
      "text": "50 of 66 divisions declared unopposed (TDP 47, BJP 2, Jana Sena 1). The Mayor post and 16 divisions go to a vote on 1 Nov.",
      "te": "66 డివిజన్లలో 50 ఏకగ్రీవం; మేయర్ సహా 16 డివిజన్లకు 1న పోలింగ్.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "tadipatri",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 30
      },
      "head": null,
      "text": "30 of 48 wards declared unopposed for TDP. The Chairperson post is contested.",
      "te": "48 వార్డుల్లో 30 టీడీపీకి ఏకగ్రీవం; చైర్‌పర్సన్ పదవికి పోటీ.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "pulivendula",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 20
      },
      "head": null,
      "text": "20 of 40 wards unopposed for TDP (wards 1–5, 7, 14, 16, 17, 19, 22, 29, 30, 32, 34–38, 40). The Chairperson post and 20 wards go to a TDP vs YSRCP contest.",
      "te": "40 వార్డుల్లో 20 టీడీపీకి ఏకగ్రీవం; చైర్‌పర్సన్ పదవికి టీడీపీ, వైఎస్సార్‌సీపీ మధ్య పోటీ.",
      "src": [
        [
          "Deccan Chronicle, 25 Oct",
          "https://www.deccanchronicle.com/southern-states/andhra-pradesh/td-wins-20-wards-unanimously-in-pulivendula-1998798"
        ]
      ]
    },
    {
      "body": "chilakaluripet",
      "status": "declared",
      "party": null,
      "wards": null,
      "wardsSplit": {
        "JSP": 16
      },
      "head": null,
      "text": "16 of 48 wards unopposed for coalition candidates; five candidates contest the Chairperson post.",
      "te": "48 వార్డుల్లో 16 కూటమికి ఏకగ్రీవం; చైర్‌పర్సన్ బరిలో ఐదుగురు.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    },
    {
      "body": "kovvur",
      "status": "declared",
      "party": "TDP",
      "wards": null,
      "wardsSplit": {
        "TDP": 4
      },
      "head": null,
      "text": "4 wards unopposed for TDP; the rest go to a vote.",
      "te": "4 వార్డులు టీడీపీకి ఏకగ్రీవం.",
      "src": [
        [
          "ETV Bharat, 25 Oct",
          "https://www.etvbharat.com/te/state/some-nda-alliance-candidates-elected-unopposed-in-local-body-elections-2026-aps26102503853"
        ]
      ]
    }
  ],
};
