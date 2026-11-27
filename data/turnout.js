// Polling turnout, 1 Nov 2026. Figures come from news reports and collectors' updates, not the SEC's final table
// (the SEC said final figures follow on Monday). Keep each reading with its time: a 3 PM figure can't be ranked
// against a closing one, because voting picks up late (Eluru: 43.84% at 3 PM, 59.64% at close).
// Row: [body id, percent, source key]
window.AP_TURNOUT = {
  updated: "2026-11-02T21:00:00+05:30",
  state: [["9 AM", 8.39], ["11 AM", 22.08], ["1 PM", 37.13], ["3 PM", 48.03], ["Final", 60.96]],
  stateVoters: "SEC final: 59.06 lakh of 96.89 lakh voters (60.96%); Eenadu reports 62.16%",
  repoll: "Re-polling done on 2 Nov at 12 booths in 6 bodies: Pulivendula (4), Jammalamadugu (3), Macherla (2), Anantapur, Chimakurthi and Kadapa (1 each)",
  repollTe: "నవంబర్ 2న 6 సంస్థల్లోని 12 బూత్‌లలో రీపోలింగ్ పూర్తి: పులివెందుల (4), జమ్మలమడుగు (3), మాచర్ల (2), అనంతపురం, చీమకుర్తి, కడప (ఒక్కొక్కటి)",
  sources: {
    aj: ["Andhra Jyothy", "https://www.andhrajyothy.com/2026/andhra-pradesh/krishna/ap-municipal-elections-polling-percentage-suri-1572470.html"],
    ajwg: ["Andhra Jyothy (Eluru dist)", "https://www.andhrajyothy.com/2026/andhra-pradesh/west-godavari/municipal-elections--1572579.html"],
    ajsk: ["Andhra Jyothy (Srikakulam)", "https://www.andhrajyothy.com/2026/andhra-pradesh/srikakulam/polling-is-peaceful-1572557.html"],
    ajkn: ["Andhra Jyothy (Kurnool)", "https://www.andhrajyothy.com/2026/andhra-pradesh/kurnool/urban-polls-conclude-1572549.html"],
    tv9: ["TV9 Telugu", "https://tv9telugu.com/andhra-pradesh/ap-municipal-corporations-municipalities-nagar-panchayats-voting-live-updates-tdp-jsp-bjp-ycp-polling-percentage-latest-news-in-telugu-1947880.html"],
    envz: ["Eenadu (Vizianagaram)", "https://www.eenadu.net/telugu-news/districts/vizianagaram-news/12/126198694"],
    enct: ["Eenadu (Tirupati dist)", "https://www.eenadu.net/telugu-news/districts/chittoor-news/2/126198672"],
    hm: ["hmtv", "https://www.hmtvlive.com/telugu-news/anantapur/kalyandurg-municipal-elections-7315-turnout-207813"],
    hans: ["The Hans India", "https://www.thehansindia.com/news/cities/guntur/guntur-polling-passes-off-peacefully-1138244"],
    hans3: ["The Hans India", "https://www.thehansindia.com/andhra-pradesh/ap-municipal-elections-polling-reaches-4803-by-3pm-1138182"],
    m9: ["m9.news", "https://www.m9.news/politics/ap-municipal-elections-voter-turnout-november-1/"],
    dc: ["Deccan Chronicle", "https://www.deccanchronicle.com/southern-states/andhra-pradesh/jammalamadugu-records-highest-polling-at-6092-2000782"],
    dcg: ["Deccan Chronicle", "https://www.deccanchronicle.com/southern-states/andhra-pradesh/guntur-records-higher-turnout-than-vijayawada-2000939"],
    dct: ["Deccan Chronicle", "https://www.deccanchronicle.com/southern-states/andhra-pradesh/tirupati-civic-polls-see-poor-turnout-parties-trade-rigging-charges-2000937"],
    dcn: ["Deccan Chronicle", "https://www.deccanchronicle.com/southern-states/andhra-pradesh/municipal-polls-in-nellore-prakasam-see-turnout-of-537-to-8345-per-cent-2000930"],
    hv: ["The Hans India", "https://www.thehansindia.com/news/cities/visakhapatnam/gvmc-registers-5147-poll-percentage-1138255"],
    hk: ["The Hans India", "https://www.thehansindia.com/andhra-pradesh/polling-concludes-amid-sporadic-tensions-in-kurnool-nandyal-1138268"],
    ha: ["The Hans India", "https://www.thehansindia.com/news/cities/anantapur/anantapur-polling-crosses-53-per-cent-1138272"],
    hp: ["The Hans India", "https://www.thehansindia.com/news/cities/guntur/6981-polling-in-four-municipalities-of-palnadu-1138247"],
    sf: ["The South First (SEC final)", "https://thesouthfirst.com/andhrapradesh/andhra-municipal-elections-60-96-percent-polling-recorded/"],
    en62: ["Eenadu (SEC final)", "https://www.eenadu.net/telugu-news/andhra-pradesh/62-percent-voter-turnout-in-andhra-pradesh-municipal-corporations/1701/126199359"],
    en11: ["Eenadu", "https://www.eenadu.net/telugu-news/andhra-pradesh/ap-municipal-elections-polling-update-at-11am/1701/126198595"],
  },
  close: [
    ["betamcherla", 78.54, "ajkn"],
    ["kuppam", 75.38, "tv9"], ["tiruvuru", 73.81, "tv9"], ["atmakur-nandyal", 73.23, "ajkn"], ["kalyandurg", 73.15, "hm"],
    ["jaggayyapeta", 72.92, "tv9"], ["palamaner", 72.66, "dct"], ["nandigama", 72.67, "tv9"], ["nuzvid", 72.31, "ajwg"],
    ["kondapalli", 72.09, "tv9"], ["bobbili", 71.30, "envz"], ["palasa-kasibugga", 70.15, "ajsk"], ["dhone", 67.84, "ajkn"],
    ["salur", 65.58, "envz"], ["ichchapuram", 65.55, "ajsk"], ["sullurpeta", 65.18, "enct"], ["parvathipuram", 63.62, "envz"],
    ["punganur", 63.47, "tv9"], ["vizianagaram", 62.73, "envz"], ["nandyal", 62.49, "ajkn"], ["chittoor", 62.53, "dct"], ["puttur", 78.73, "dct"], ["sattenapalle", 76.17, "hp"], ["rayadurg", 75.72, "ha"], ["markapur", 74.31, "dcn"], ["vinukonda", 74.20, "hp"], ["atmakur-nellore", 73.09, "dcn"], ["giddalur", 71.87, "dcn"], ["madanapalle", 71.00, "dct"], ["naidupeta", 69.99, "dct"], ["venkatagiri", 69.25, "dct"], ["yemmiganur", 67.90, "hk"], ["macherla", 66.95, "hp"], ["tadipatri", 65.53, "ha"], ["chilakaluripet", 65.40, "hp"], ["buchireddypalem", 60.17, "dcn"], ["guntakal", 59.03, "ha"], ["gooty", 54.93, "ha"],
    ["ongole", 71.27, "sf"], ["tirupati", 46.85, "sf"], ["greater-visakhapatnam", 50.02, "sf"], ["kurnool", 53.77, "sf"], ["vijayawada", 55.35, "sf"], ["guntur", 56.15, "sf"], ["anantapur", 56.12, "sf"], ["nellore", 57.72, "sf"], ["tenali", 58.10, "sf"], ["eluru", 59.64, "sf"], ["chimakurthi", 84.36, "sf"], ["kanigiri", 83.86, "sf"], ["gudur-kurnool", 83.73, "sf"], ["penukonda", 80.58, "sf"], ["nandikotkur", 80.35, "sf"], ["badvel", 80.34, "sf"], ["nellimarla", 80.31, "sf"], ["addanki", 79.92, "sf"], ["pedana", 79.42, "sf"], ["nagari", 78.77, "sf"], ["adoni", 53.60, "sf"], ["jangareddygudem", 61.06, "sf"], ["machilipatnam", 70.83, "en62"], ["pulivendula", 70.56, "sf"],
  ],
  pm3: [ ["jammalamadugu", 69.57, "tv9"], ["gollaprolu", 63.55, "tv9"], ["pithapuram", 63.16, "tv9"],
    ["akividu", 61.94, "hans3"], ["yeleswaram", 61.22, "tv9"], ["palakonda", 58.84, "m9"],
    ["narasapuram", 58.11, "m9"], ["samalkot", 58.00, "tv9"], ["peddapuram", 57.02, "tv9"], ["tuni", 55.95, "tv9"], ["kadapa", 41.21, "hans3"], ],
  am11: [
    ["yelamanchili", 36.66, "dc"], ["repalle", 31.28, "tv9"], ["chirala", 23.01, "tv9"], ["rajampet", 29.10, "en11"],
    ["vuyyuru", 25.11, "en11"],
  ],
};

// MPTC / ZPTC polling, 5 Nov 2026. State figures and the 10 districts are the SEC's (Eenadu, 6 Nov).
// Districts: [name, Telugu name, percent, time reported]
window.AP_TURNOUT_RURAL = {
  updated: "2026-11-07T11:20:00+05:30",
  // SEC figures (Eenadu, 6 Nov): 11.71% in the first two hours, 30.50% at 1 PM, 58.55% at 3 PM, about 67.24% at 5 PM
  // (1,50,84,014 of 2,24,32,460 voters) and 70.02% final, announced on 6 Nov evening
  state: [["9 AM", 11.71], ["11 AM", 21.12], ["1 PM", 30.5], ["3 PM", 58.55], ["5 PM", 67.24], ["తుది", 70.02]],
  final: true,
  // Cyclone Murasu (TV9 Telugu, 5 Nov): polling in these mandals moved to Friday 6 Nov; counting for all on 7 Nov
  note: "మురసు తుఫాన్ కారణంగా ఏలూరు జిల్లాలోని వేలేరుపాడు, బుట్టాయిగూడెం, జీలుగుమిల్లి, పోలవరం మండలాల్లో, తూర్పుగోదావరి జిల్లా గోపాలపురం మండలంలో పోలింగ్ 6 నవంబర్‌కు వాయిదా పడింది. లెక్కింపు అన్ని మండలాల్లో 7 నవంబర్‌న.",
  districts: [
    ["Visakhapatnam", "విశాఖపట్నం", 82.51, "తుది"],
    ["Chittoor", "చిత్తూరు", 76.3, "తుది"],
    ["Anakapalli", "అనకాపల్లి", 75.58, "తుది"],
    ["Krishna", "కృష్ణా", 73.21, "తుది"],
    ["Annamayya", "అన్నమయ్య", 69.19, "తుది"],
    ["Bapatla", "బాపట్ల", 67.47, "తుది"],
    ["Konaseema", "కోనసీమ", 66.33, "తుది"],
    ["Srikakulam", "శ్రీకాకుళం", 65.51, "తుది"],
    ["Anantapur", "అనంతపురం", 64.38, "తుది"],
    ["Alluri Sitharama Raju", "అల్లూరి సీతారామరాజు", 62.01, "తుది"],
  ],

};
