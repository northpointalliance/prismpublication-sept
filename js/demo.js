/**
 * Chat transcript demo. Local catalog only. Niches: travel, health and wellness, persona.
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
      niche: "travel",
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
      niche: "travel",
      title: "Universal travel adapter",
      description: "One plug for hotel rooms when you already asked about the trip.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("universal travel adapter"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "travel adapter plug hotel outlet trip abroad charger flight"
    },
    {
      id: "ad_hw_protein",
      niche: "health-wellness",
      title: "Protein powder for a training week",
      description: "Whey and plant protein when someone asks what to buy this week.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("whey protein powder"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "protein powder whey plant training fitness workout gym lifting sleep recovery"
    },
    {
      id: "ad_hw_sleep",
      niche: "health-wellness",
      title: "A quieter night",
      description: "Sleep masks and sound machines when someone asks for a practical sleep aid.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("sleep sound machine"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "sleep night rest sound machine mask quieter bedtime wellness pause"
    },
    {
      id: "ad_persona_prompts",
      niche: "persona",
      title: "Conversation cards for a first meeting",
      description: "Prompt cards when someone is already asking what to say in person.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("conversation starter cards adults"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "conversation date talk questions icebreaker first meeting social persona chat"
    }
  ];

  var NICHES = [
    {
      id: "travel",
      label: "Travel",
      title: "Travel assistant",
      subtitle: "Trips, packing, carry-on",
      scenario: "Someone is packing a carry-on and asking about the hotel plug. When the topic matches, a labeled partner card shows up in the thread.",
      greeting: "Ask about packing, a trip, or a carry-on. Hit Play, or type your own line.",
      placeholder: "Ask about packing, carry-on, or a trip",
      ageGate: "",
      replies: [
        "Pack the outfit you will actually wear twice. Leave the just-in-case pile at home.",
        "A carry-on week is packing cubes, one pair of shoes that walk, and a charger that fits the seat.",
        "If you don't know the hotel outlet, one adapter beats a bag of cables.",
        "Build the bag around the first 24 hours. Everything else is optional."
      ],
      script: [
        { role: "user", content: "I have a four-day trip and I refuse to check a bag." },
        { role: "bot", content: "A carry-on week is packing cubes, one pair of shoes that walk, and a charger that fits the seat." },
        { role: "ad", topic: "I need packing cubes for a carry-on trip" },
        { role: "user", content: "What about the hotel plug? I never remember the adapter." },
        { role: "bot", content: "If you don't know the hotel outlet, one adapter beats a bag of cables." },
        { role: "ad", topic: "universal travel adapter for the hotel" }
      ]
    },
    {
      id: "health-wellness",
      label: "Health and wellness",
      title: "Health and wellness assistant",
      subtitle: "Training, protein, sleep",
      scenario: "Someone asks about protein and sleep. A labeled card can show when that matches. We stay out of clinical claims.",
      greeting: "Ask about training, protein, or sleep. Hit Play, or type your own line.",
      placeholder: "Ask about protein, rest days, or sleep",
      ageGate: "",
      replies: [
        "Consistency beats intensity. Three solid sessions a week beat five you cannot sustain.",
        "Protein is the thing most people underdo. Eggs, Greek yogurt, chicken, cottage cheese add up fast.",
        "Sleep is the habit most people skip. Dim the lights an hour before bed.",
        "Recovery is where the gains happen. Do not skip rest days."
      ],
      script: [
        { role: "user", content: "Any protein powder recommendations for lifting?" },
        { role: "bot", content: "Protein is the thing most people underdo. Eggs, yogurt, chicken. A powder is one way to hit the week." },
        { role: "ad", topic: "protein powder for lifting" },
        { role: "user", content: "I have been struggling to sleep lately." },
        { role: "bot", content: "Sleep is the habit most people skip. Dim the lights an hour before bed. Keep it practical, not a diagnosis." },
        { role: "ad", topic: "sleep sound machine for winding down" }
      ]
    },
    {
      id: "persona",
      label: "Persona",
      title: "Persona chat",
      subtitle: "Social and dating conversation",
      scenario: "A persona bot people already talk to. A partner offer only when the topic matches, with a clear label. This demo is 18+.",
      greeting: "This demo is 18+. Ask about first conversations. Hit Play, or type your own line.",
      placeholder: "Ask about first dates or what to say",
      ageGate: "18+ demo",
      replies: [
        "Stay curious. Ask questions and listen. People remember how they felt more than the exact words.",
        "Ask what they're excited about right now. People open up when they talk about something they care about.",
        "Confidence often looks like being comfortable with silence.",
        "First impressions are overrated. Most real connections take more than one awkward start."
      ],
      script: [
        { role: "user", content: "I freeze on first dates. What do I even ask?" },
        { role: "bot", content: "Ask what they're excited about right now. People open up when they talk about something they care about." },
        { role: "ad", topic: "conversation cards for a first meeting" },
        { role: "user", content: "I try too hard to be impressive and it falls flat." },
        { role: "bot", content: "Being yourself holds up longer than performing. Light, honest talk lands better than a speech." },
        { role: "ad", topic: "conversation starter questions for adults" }
      ]
    }
  ];

  var STOP = {
    any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
    what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
    with: 1, from: 1, your: 1, our: 1, are: 1, was: 1, have: 1
  };

  function nicheById(id) {
    for (var i = 0; i < NICHES.length; i++) {
      if (NICHES[i].id === id) return NICHES[i];
    }
    return NICHES[0];
  }

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

  function matchPrompt(nicheId, prompt) {
    var queryVec = vector(tokenize(prompt));
    var pool = CATALOG.filter(function (ad) {
      return ad.niche === nicheId;
    });
    var scored = pool.map(function (ad) {
      return { ad: ad, score: cosine(queryVec, vector(tokenize(ad.title + " " + ad.description + " " + ad.tokens))) };
    });
    scored.sort(function (x, y) {
      return y.score - x.score;
    });
    var best = scored[0];
    if (!prompt || !best || best.score < THRESHOLD) return null;
    return best.ad;
  }

  function pickReply(niche, index) {
    var list = niche.replies;
    var i = ((Number(index) % list.length) + list.length) % list.length;
    return list[i];
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
  var scenarioEl = document.querySelector("[data-demo-scenario]");
  var titleEl = document.querySelector("[data-demo-title]");
  var subtitleEl = document.querySelector("[data-demo-subtitle]");
  var ageEl = document.querySelector("[data-demo-age]");
  var tablist = document.querySelector("[data-demo-tabs]");

  var niche = nicheById("travel");
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
    else if (index >= niche.script.length && index > 0) playBtn.textContent = "Replay";
    else playBtn.textContent = "Play";
  }

  function paintChrome() {
    if (scenarioEl) scenarioEl.textContent = niche.scenario;
    if (titleEl) titleEl.textContent = niche.title;
    if (subtitleEl) subtitleEl.textContent = niche.subtitle;
    if (ageEl) {
      ageEl.hidden = !niche.ageGate;
      ageEl.textContent = niche.ageGate;
    }
    if (input) input.placeholder = niche.placeholder;
    if (tablist) {
      tablist.querySelectorAll("[data-niche]").forEach(function (btn) {
        btn.setAttribute("aria-selected", btn.getAttribute("data-niche") === niche.id ? "true" : "false");
      });
    }
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
      var ad = matchPrompt(niche.id, item.topic);
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
    while (index < niche.script.length && playing && token === runId) {
      await showItem(niche.script[index], token);
      if (token !== runId) return;
      index += 1;
      if (playing && index < niche.script.length) await sleep(BETWEEN_MS);
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
    appendBubble("bot", niche.greeting);
    setPlayLabel();
  }

  function selectNiche(id) {
    niche = nicheById(id);
    paintChrome();
    reset();
  }

  function sendLive() {
    var text = String(input && input.value ? input.value : "").trim();
    if (!text || playing) return;
    input.value = "";
    messages += 1;
    liveTurns += 1;
    if (stats.messages) stats.messages.textContent = String(messages);
    appendBubble("user", text);
    appendBubble("bot", pickReply(niche, liveTurns));
    var ad = matchPrompt(niche.id, text);
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
      if (index >= niche.script.length) reset();
      playLoop();
    });
  }
  if (resetBtn) resetBtn.addEventListener("click", reset);
  document.querySelectorAll("[data-niche]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      selectNiche(btn.getAttribute("data-niche"));
    });
  });
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

  paintChrome();
  reset();
})();
