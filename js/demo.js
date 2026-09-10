/**
 * Phone-sized travel chat demo. Local catalog only.
 * Fill when cosine >= 0.65. Do not import in a production chat widget.
 */
(function () {
  var AMAZON_TAG = "prismpublicat-20";
  var THRESHOLD = 0.65;
  var WORD_MS = 28;
  var BETWEEN_MS = 420;

  function amazonSearchUrl(query) {
    return "https://www.amazon.com/s?k=" + encodeURIComponent(query) + "&tag=" + AMAZON_TAG;
  }

  var CATALOG = [
    {
      id: "ad_travel_cubes",
      title: "Packing cubes for a carry-on week",
      description: "Compress a short trip without checking a bag.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("packing cubes carry on"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "packing cubes carry luggage suitcase trip flight travel bag organize"
    },
    {
      id: "ad_travel_adapter",
      title: "Universal travel adapter",
      description: "One plug for hotel rooms when you already asked about the trip.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("universal travel adapter"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "travel adapter plug hotel outlet trip abroad charger flight"
    }
  ];

  var GREETING = "Ask about packing, a trip, or a carry-on. Hit Play, or type your own line.";
  var REPLIES = [
    "Pack the outfit you will actually wear twice. Leave the just-in-case pile at home.",
    "A carry-on week is packing cubes, one pair of shoes that walk, and a charger that fits the seat.",
    "If you don't know the hotel outlet, one adapter beats a bag of cables.",
    "Build the bag around the first 24 hours. Everything else is optional."
  ];
  var SCRIPT = [
    { role: "user", content: "I have a four-day trip and I refuse to check a bag." },
    { role: "bot", content: "A carry-on week is packing cubes, one pair of shoes that walk, and a charger that fits the seat." },
    { role: "ad", topic: "I need packing cubes for a carry-on trip" },
    { role: "user", content: "What about the hotel plug? I never remember the adapter." },
    { role: "bot", content: "If you don't know the hotel outlet, one adapter beats a bag of cables." },
    { role: "ad", topic: "universal travel adapter for the hotel" }
  ];

  var STOP = {
    any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
    what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
    with: 1, from: 1, your: 1, our: 1, are: 1, was: 1, have: 1
  };

  function tokenize(value) {
    return String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(function (word) {
        return word.length > 2 && !STOP[word];
      });
  }

  function vector(tokens) {
    var vec = {};
    for (var i = 0; i < tokens.length; i++) {
      vec[tokens[i]] = (vec[tokens[i]] || 0) + 1;
    }
    return vec;
  }

  function cosine(a, b) {
    var dot = 0;
    var magA = 0;
    var magB = 0;
    var key;
    for (key in a) {
      if (Object.prototype.hasOwnProperty.call(a, key)) magA += a[key] * a[key];
    }
    for (key in b) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        magB += b[key] * b[key];
        if (a[key]) dot += a[key] * b[key];
      }
    }
    if (!magA || !magB) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  function matchPrompt(prompt) {
    var queryVec = vector(tokenize(prompt));
    var scored = CATALOG.map(function (ad) {
      return { ad: ad, score: cosine(queryVec, vector(tokenize(ad.title + " " + ad.description + " " + ad.tokens))) };
    });
    scored.sort(function (x, y) {
      return y.score - x.score;
    });
    var best = scored[0];
    if (!prompt || !best || best.score < THRESHOLD) return null;
    return best.ad;
  }

  function pickReply(index) {
    var i = ((Number(index) % REPLIES.length) + REPLIES.length) % REPLIES.length;
    return REPLIES[i];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var log = document.querySelector("[data-chat-log]");
  var stats = {
    messages: document.querySelector("[data-stat-messages]"),
    ads: document.querySelector("[data-stat-ads]")
  };
  var playBtn = document.querySelector("[data-demo-play]");
  var resetBtn = document.querySelector("[data-demo-reset]");
  var input = document.querySelector("[data-demo-input]");
  var sendBtn = document.querySelector("[data-demo-send]");

  var timer = null;
  var index = 0;
  var messages = 0;
  var ads = 0;
  var playing = false;
  var runId = 0;
  var liveTurns = 0;

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      timer = setTimeout(resolve, ms);
    });
  }

  function clearSleep() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function scrollLog() {
    if (log) log.scrollTop = log.scrollHeight;
  }

  function setComposerEnabled(on) {
    if (input) input.disabled = !on;
    if (sendBtn) sendBtn.disabled = !on;
  }

  function setPlayLabel() {
    if (!playBtn) return;
    if (playing) playBtn.textContent = "Pause";
    else if (index >= SCRIPT.length && index > 0) playBtn.textContent = "Replay";
    else playBtn.textContent = "Play";
  }

  function appendBubble(role, text) {
    var el = document.createElement("div");
    el.className = "bubble " + role;
    el.textContent = text;
    if (log) log.appendChild(el);
    scrollLog();
    return el;
  }

  async function typeInto(el, text, token) {
    if (reduceMotion()) {
      el.textContent = text;
      scrollLog();
      return;
    }
    var acc = "";
    var parts = String(text).split(/(\s+)/);
    for (var i = 0; i < parts.length; i++) {
      if (token !== runId || !playing) {
        el.textContent = text;
        scrollLog();
        return;
      }
      acc += parts[i];
      el.textContent = acc;
      scrollLog();
      if (parts[i].trim()) await sleep(WORD_MS);
    }
  }

  function renderAd(ad) {
    var el = document.createElement("article");
    el.className = "match-card";
    var rel = ad.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer";
    el.innerHTML =
      '<span class="badge">Sponsored · ' +
      escapeHtml(ad.advertiser) +
      "</span><h4>" +
      escapeHtml(ad.title) +
      "</h4><p>" +
      escapeHtml(ad.description) +
      '</p><p><a class="btn primary" href="' +
      escapeHtml(ad.clickUrl) +
      '" target="_blank" rel="' +
      rel +
      '">' +
      escapeHtml(ad.ctaText) +
      "</a></p>";
    if (log) log.appendChild(el);
    scrollLog();
  }

  async function showItem(item, token) {
    if (item.role === "ad") {
      var ad = matchPrompt(item.topic);
      if (token !== runId) return;
      if (!ad) return;
      ads += 1;
      if (stats.ads) stats.ads.textContent = String(ads);
      renderAd(ad);
      return;
    }
    messages += 1;
    if (stats.messages) stats.messages.textContent = String(messages);
    var el = document.createElement("div");
    el.className = "bubble " + item.role;
    if (log) log.appendChild(el);
    await typeInto(el, item.content, token);
  }

  async function playLoop() {
    if (playing) return;
    playing = true;
    setComposerEnabled(false);
    var token = (runId += 1);
    setPlayLabel();
    while (index < SCRIPT.length && playing && token === runId) {
      await showItem(SCRIPT[index], token);
      if (token !== runId) return;
      index += 1;
      if (playing && index < SCRIPT.length) await sleep(BETWEEN_MS);
    }
    playing = false;
    setComposerEnabled(true);
    setPlayLabel();
  }

  function stopPlayback() {
    playing = false;
    runId += 1;
    clearSleep();
    setComposerEnabled(true);
    setPlayLabel();
  }

  function reset() {
    stopPlayback();
    index = 0;
    messages = 0;
    ads = 0;
    liveTurns = 0;
    if (log) log.innerHTML = "";
    if (stats.messages) stats.messages.textContent = "0";
    if (stats.ads) stats.ads.textContent = "0";
    appendBubble("bot", GREETING);
    setPlayLabel();
  }

  function sendLive() {
    var text = String(input && input.value ? input.value : "").trim();
    if (!text || playing) return;
    input.value = "";
    messages += 1;
    liveTurns += 1;
    if (stats.messages) stats.messages.textContent = String(messages);
    appendBubble("user", text);
    appendBubble("bot", pickReply(liveTurns));
    var ad = matchPrompt(text);
    if (ad) {
      ads += 1;
      if (stats.ads) stats.ads.textContent = String(ads);
      renderAd(ad);
    }
  }

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (playing) {
        stopPlayback();
        return;
      }
      if (index >= SCRIPT.length) reset();
      playLoop();
    });
  }
  if (resetBtn) resetBtn.addEventListener("click", reset);
  if (sendBtn) {
    sendBtn.addEventListener("click", function (event) {
      event.preventDefault();
      sendLive();
    });
  }
  var form = input && input.closest("form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      sendLive();
    });
  }

  reset();
})();
