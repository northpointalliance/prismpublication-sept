/**
 * Interactive prompt matcher. Local catalog only. No API key.
 * Cosine similarity on token vectors; serve when score >= 0.65.
 */
(function () {
  var AMAZON_TAG = "prismpublicat-20";
  var THRESHOLD = 0.65;

  function amazonSearchUrl(query) {
    var search = encodeURIComponent(String(query || "fitness training recovery gear"));
    return "https://www.amazon.com/s?k=" + search + "&tag=" + AMAZON_TAG;
  }

  var CATALOG = [
    {
      id: "ad_amazon_protein",
      niche: "fitness",
      title: "Protein powder for a training week",
      description: "Whey and plant protein when someone asks what to buy this week.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("whey protein powder"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "protein powder whey plant training fitness workout gym lifting scoop supplement"
    },
    {
      id: "ad_amazon_bands",
      niche: "fitness",
      title: "Resistance bands for home sessions",
      description: "A simple set for progressive overload at home.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("resistance bands set"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "resistance bands home gym training workout strength overload fitness"
    },
    {
      id: "ad_amazon_watch",
      niche: "fitness",
      title: "GPS running watch",
      description: "Pace and heart rate for people already talking about training.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("gps running watch"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "gps running watch pace cardio heart rate training run fitness"
    },
    {
      id: "ad_amazon_sleep",
      niche: "sleep",
      title: "A quieter night",
      description: "Sleep masks and sound machines when someone asks for practical sleep tools.",
      ctaText: "Shop on Amazon",
      clickUrl: amazonSearchUrl("sleep sound machine"),
      advertiser: "Amazon",
      affiliate: true,
      tokens: "sleep night rest sound machine mask quieter insomnia bedtime"
    },
    {
      id: "ad_notion",
      niche: "productivity",
      title: "Try Notion AI, your second brain",
      description: "Summarize notes, draft emails, and find anything in a workspace.",
      ctaText: "Start free trial",
      clickUrl: "https://www.notion.so/product/ai",
      advertiser: "Notion",
      affiliate: true,
      tokens: "notion notes ai productivity organize docs workspace draft email second brain"
    }
  ];

  var SAMPLES = {
    fitness: { niche: "fitness", prompt: "what's a good protein powder for my workout routine this week?" },
    sleep: { niche: "sleep", prompt: "I need a sound machine so I can sleep through street noise" },
    productivity: { niche: "productivity", prompt: "help me keep a daily planner and draft emails faster" },
    miss: { niche: "fitness", prompt: "what is the weather in lisbon tomorrow" }
  };

  var STOP = {
    any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
    what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
    with: 1, from: 1, your: 1, our: 1, are: 1, was: 1
  };

  var EXPAND = {
    protein: ["protein", "powder", "whey", "supplement", "training"],
    powder: ["protein", "powder", "whey"],
    lifting: ["lifting", "gym", "training", "fitness", "workout"],
    gym: ["gym", "fitness", "training", "workout"],
    running: ["running", "run", "cardio", "watch", "pace"],
    sleep: ["sleep", "night", "rest", "bedtime"],
    machine: ["sound", "machine", "sleep"],
    notes: ["notes", "docs", "organize", "workspace"],
    emails: ["email", "draft", "docs", "productivity"],
    organize: ["organize", "notes", "docs", "workspace", "productivity"]
  };

  function tokenize(value) {
    var raw = String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(function (word) {
        return word.length > 2 && !STOP[word];
      });
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var extra = EXPAND[raw[i]];
      if (extra) {
        out = out.concat(extra);
      } else {
        out.push(raw[i]);
      }
    }
    return out;
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

  function matchPrompt(niche, prompt) {
    var start = performance.now();
    var queryVec = vector(tokenize(prompt));
    var pool = CATALOG.filter(function (ad) {
      return ad.niche === niche;
    });
    var scored = pool.map(function (ad) {
      var doc = vector(tokenize(ad.title + " " + ad.description + " " + ad.tokens));
      return { ad: ad, score: cosine(queryVec, doc) };
    });
    scored.sort(function (x, y) {
      return y.score - x.score;
    });
    var best = scored[0];
    var ms = performance.now() - start;
    if (!prompt || !best) {
      return { ad: null, score: 0, ms: ms, ranked: scored };
    }
    if (best.score >= THRESHOLD) {
      return { ad: best.ad, score: best.score, ms: ms, ranked: scored };
    }
    return { ad: null, score: best.score, ms: ms, ranked: scored };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(result) {
    var panel = document.getElementById("sandbox-output");
    if (!panel) return;

    if (!result.ad) {
      panel.innerHTML =
        '<div class="match-card null">' +
        '<span class="badge">No ad this turn</span>' +
        "<h4>We stay silent</h4>" +
        "<p>The question was not close enough to an approved product. The assistant reply still ships. You would not be billed for this turn.</p>" +
        "</div>";
      return;
    }

    var rel = result.ad.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer";
    panel.innerHTML =
      '<article class="match-card">' +
      '<span class="badge">Sponsored · ' +
      escapeHtml(result.ad.advertiser) +
      "</span>" +
      "<h4>" +
      escapeHtml(result.ad.title) +
      "</h4>" +
      "<p>" +
      escapeHtml(result.ad.description) +
      "</p>" +
      '<p><a class="btn primary" href="' +
      escapeHtml(result.ad.clickUrl) +
      '" rel="' +
      rel +
      '" target="_blank">' +
      escapeHtml(result.ad.ctaText) +
      "</a></p>" +
      "</article>";
  }

  function runFromForm() {
    var niche = document.getElementById("sandbox-niche");
    var input = document.getElementById("sandbox-input");
    var result = matchPrompt(niche && niche.value, input && input.value);
    render(result);
  }

  function applySample(key) {
    var sample = SAMPLES[key];
    if (!sample) return;
    var niche = document.getElementById("sandbox-niche");
    var input = document.getElementById("sandbox-input");
    if (niche) niche.value = sample.niche;
    if (input) input.value = sample.prompt;
    runFromForm();
  }

  function bind() {
    var form = document.getElementById("sandbox-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      runFromForm();
    });

    document.querySelectorAll("[data-sample]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applySample(btn.getAttribute("data-sample"));
      });
    });

    applySample("fitness");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
