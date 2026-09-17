// Public endpoint: GET /campaign/:token
// The advertiser's one link back to their submission -- no login, no
// account, just the token returned by /api/submit. Shows current status,
// and once approved, lets them buy prepaid click credit to go live
// (Stage 5 of docs/run-ads-strategy-2026-09-16.md).

import { CREDIT_PACKS_CENTS, PRICE_PER_CLICK_CENTS, formatUsd } from "../api/_lib/pricing.js";

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function page({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | Prism Publication</title>
    <meta name="robots" content="noindex,nofollow" />
    <link rel="stylesheet" href="/css/styles.css" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <header class="site">
      <div class="container">
        <a class="brand" href="/">Prism Publication</a>
        <nav class="primary" aria-label="Primary">
          <a href="/run-ads/">Run ads</a>
          <a href="/ad-submission/">Ad submission</a>
        </nav>
      </div>
    </header>
    <main id="main">
      <section class="hero page-hero">
        <div class="container">${body}</div>
      </section>
    </main>
    <footer>
      <div class="container footer-grid">
        <div>
          <p>&copy; 2026 Prism Publication.</p>
          <p>Bookmark this page -- it's the only link back to this campaign.</p>
        </div>
      </div>
    </footer>
  </body>
</html>`;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

const STATUS_COPY = {
  pending: "Under review. A person checks every submission -- usually within 2 business days.",
  needs_review: "Under manual review. A person checks every submission -- usually within 2 business days.",
  rejected: "Not approved.",
};

export async function onRequestGet(context) {
  const { env, params } = context;
  const token = String(params.token || "").trim();

  const { results } = await env.DB.prepare(
    `SELECT id, status, brand, title, description, review_notes, credit_active
     FROM ad_submissions WHERE access_token = ?`
  )
    .bind(token)
    .all();
  const ad = results[0];

  if (!ad) {
    return html(page({ title: "Not found", body: "<h1>Campaign not found</h1><p class=\"subhead\">Check the link, or email <a href=\"mailto:info@prismpublication.com\">info@prismpublication.com</a>.</p>" }), 404);
  }

  const cardSummary = `<p class="meta"><strong>${escapeHtml(ad.brand)}</strong> -- ${escapeHtml(ad.title)}</p>`;

  if (ad.status === "rejected") {
    return html(
      page({
        title: "Not approved",
        body: `<h1>Not approved</h1>${cardSummary}<p class="subhead">${escapeHtml(ad.review_notes || "No reason given.")}</p><p class="meta">Questions: <a href="mailto:info@prismpublication.com">info@prismpublication.com</a>.</p>`,
      })
    );
  }

  if (ad.status !== "approved") {
    return html(
      page({
        title: "Under review",
        body: `<h1>Under review</h1>${cardSummary}<p class="subhead">${escapeHtml(STATUS_COPY[ad.status] || STATUS_COPY.pending)}</p>`,
      })
    );
  }

  const { results: ledgerRows } = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS balance,
            COALESCE(SUM(CASE WHEN kind = 'click' THEN 1 ELSE 0 END), 0) AS clicks
     FROM credit_ledger WHERE ad_submission_id = ?`
  )
    .bind(ad.id)
    .all();
  const balanceCents = ledgerRows[0]?.balance ?? 0;
  const clicks = ledgerRows[0]?.clicks ?? 0;

  const live = ad.credit_active === 1 && balanceCents > 0;

  const statusBlock = live
    ? `<p class="demo-live">Live</p><p class="meta">Credit remaining: <strong>${formatUsd(balanceCents)}</strong> (about ${Math.floor(balanceCents / PRICE_PER_CLICK_CENTS)} more clicks at ${formatUsd(PRICE_PER_CLICK_CENTS)}/click). Clicks so far: ${clicks}.</p>`
    : `<p class="meta">Approved, but not live -- buy credit below to start showing this card.</p>`;

  const packButtons = CREDIT_PACKS_CENTS.map(
    (cents) => `<button type="button" class="btn secondary pack-btn" data-cents="${cents}">${formatUsd(cents)}</button>`
  ).join("");

  return html(
    page({
      title: live ? "Live" : "Approved",
      body: `
        <h1>${live ? "Your campaign is live" : "Your campaign is approved"}</h1>
        ${cardSummary}
        ${statusBlock}
        <div id="buy-credit" class="card" style="max-width: 480px; text-align: left; margin-top: 1rem;">
          <p class="meta">${live ? "Add more credit:" : "Buy a credit pack to go live:"}</p>
          <div class="row-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;" id="pack-buttons">${packButtons}</div>
          <p class="meta" id="pay-status" role="status" style="margin-top: 0.75rem;"></p>
          <div id="paypal-button-container"></div>
        </div>
        <p class="meta" style="margin-top: 1rem;">Questions or want a refund of unused credit: <a href="mailto:info@prismpublication.com">info@prismpublication.com</a>.</p>
        <script>
          (function () {
            var token = ${JSON.stringify(token)};
            var payStatus = document.getElementById("pay-status");
            var container = document.getElementById("paypal-button-container");
            var selectedCents = null;

            function loadPayPalSdk() {
              return fetch("/api/paypal/config")
                .then(function (res) {
                  if (!res.ok) throw new Error("PayPal is not available right now.");
                  return res.json();
                })
                .then(function (config) {
                  return new Promise(function (resolve, reject) {
                    var script = document.createElement("script");
                    script.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(config.clientId) + "&currency=USD&intent=capture";
                    script.onload = resolve;
                    script.onerror = function () { reject(new Error("Could not load PayPal.")); };
                    document.head.appendChild(script);
                  });
                });
            }

            var rendered = false;
            document.querySelectorAll(".pack-btn").forEach(function (btn) {
              btn.addEventListener("click", function () {
                selectedCents = Number(btn.dataset.cents);
                payStatus.textContent = "Loading PayPal…";
                if (rendered) return;
                rendered = true;
                loadPayPalSdk()
                  .then(function () {
                    payStatus.textContent = "";
                    window.paypal.Buttons({
                      createOrder: function () {
                        return fetch("/api/paypal/create-order", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ packCents: selectedCents }),
                        })
                          .then(function (res) { return res.json(); })
                          .then(function (data) {
                            if (!data.orderId) throw new Error(data.error || "Could not start checkout.");
                            return data.orderId;
                          });
                      },
                      onApprove: function (paypalData) {
                        payStatus.textContent = "Payment approved -- crediting your campaign…";
                        return fetch("/api/credit/purchase", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ token: token, paypalOrderId: paypalData.orderID }),
                        })
                          .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
                          .then(function (result) {
                            if (!result.res.ok) {
                              payStatus.textContent = "Payment succeeded, but crediting failed: " + (result.body.error || "Something went wrong.") + ". Email info@prismpublication.com with your payment confirmation.";
                              return;
                            }
                            payStatus.textContent = "Credited. Reloading…";
                            window.location.reload();
                          });
                      },
                      onError: function (err) {
                        payStatus.textContent = "PayPal error: " + (err && err.message ? err.message : "something went wrong.");
                      },
                    }).render("#paypal-button-container");
                  })
                  .catch(function (err) {
                    payStatus.textContent = "Error: " + err.message;
                  });
              });
            });
          })();
        </script>
      `,
    })
  );
}
