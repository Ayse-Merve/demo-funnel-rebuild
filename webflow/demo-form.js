/*
 * Site-wide demo form handler for Webflow
 * ---------------------------------------
 * Install once in: Site settings → Custom code → Before </body> tag
 * (wrap in <script>…</script> and load Calendly's widget assets first, see README.md).
 *
 * What it does, for every demo form on any page / locale:
 *   1. Opens the Calendly host that matches the selected country.
 *   2. Drops the submission if the hidden honeypot field is filled.
 *   3. Waits (max 5 s) for Webflow's Cloudflare Turnstile token, then POSTs
 *      email + country to the Pardot form handler with fetch().
 *
 * Webflow's own form handling (stored submissions, email notifications) is left untouched.
 * All values below are placeholders.
 */
(function () {
  if (window.demoFunnel) return;               // run once per page
  window.demoFunnel = { forms: 0 };

  // ===== Settings =====
  var PARDOT_HANDLER  = "https://go.example.com/l/000000/0000-00-00/xxxxx";
  var DEMO_FORM_NAMES = ["demo-form", "demo form", "wf-form-demo-form"];
  var HONEYPOT_NAME   = "hp_field";                // hidden field; humans leave it empty
  var TURNSTILE_NAME  = "cf-turnstile-response";   // Webflow's Turnstile token
  var TOKEN_WAIT_MS   = 5000;

  // ===== Calendly: calendly.com/<username>/<slug> (managed event, same slug for all hosts) =====
  var DEMO_SLUG = "website_demo";
  var HOSTS = {
    dach:  "host-dach",
    us:    "host-us",
    anz:   "host-anz",
    nl:    "host-nl",
    be:    "host-be",
    fr:    "host-fr",
    uk:    "host-uk",
    other: "host-global"      // everything else, incl. no country selected
  };

  // English + local spellings, so translated dropdowns route the same way
  var COUNTRY_TO_TEAM = {
    "germany": "dach", "deutschland": "dach", "duitsland": "dach", "allemagne": "dach",
    "austria": "dach", "österreich": "dach", "oostenrijk": "dach", "autriche": "dach",
    "switzerland": "dach", "schweiz": "dach", "zwitserland": "dach", "suisse": "dach",
    "united states": "us", "usa": "us", "verenigde staten": "us", "états-unis": "us", "vereinigte staaten": "us",
    "australia": "anz", "australië": "anz", "australie": "anz", "australien": "anz",
    "new zealand": "anz", "nieuw-zeeland": "anz", "nouvelle-zélande": "anz", "neuseeland": "anz",
    "netherlands": "nl", "the netherlands": "nl", "nederland": "nl", "pays-bas": "nl", "niederlande": "nl",
    "belgium": "be", "belgië": "be", "belgie": "be", "belgique": "be", "belgien": "be",
    "france": "fr", "frankrijk": "fr", "frankreich": "fr",
    "united kingdom": "uk", "verenigd koninkrijk": "uk", "royaume-uni": "uk", "vereinigtes königreich": "uk"
  };

  // ===== Helpers =====
  function calendlyUrl(country) {
    var team = COUNTRY_TO_TEAM[(country || "").trim().toLowerCase()] || "other";
    return "https://calendly.com/" + HOSTS[team] + "/" + DEMO_SLUG;
  }

  // Demo forms are recognised by their Webflow form name; download forms with a
  // First-Name field share the name on some pages and are skipped.
  function isDemoForm(form) {
    var n = (form.getAttribute("data-name") || form.getAttribute("name") || "").trim().toLowerCase();
    if (DEMO_FORM_NAMES.indexOf(n) === -1) return false;
    return !form.querySelector('[name="First-Name"]');
  }

  function value(el) { return el ? (el.value || "").trim() : ""; }

  function selectedCountry(sel) {
    if (!sel) return "";
    var txt = sel.selectedIndex >= 0 ? (sel.options[sel.selectedIndex].text || "").trim() : "";
    return value(sel) || txt;
  }

  function sendToPardot(data) {
    // no-cors: Pardot doesn't send CORS headers; the response isn't needed.
    // credentials: include → Pardot's visitor cookie is sent, so prior page views stay linked.
    fetch(PARDOT_HANDLER, { method: "POST", mode: "no-cors", credentials: "include", body: data })
      .catch(function (err) { console.warn("[demoFunnel] Pardot submit failed:", err); });
  }

  // ===== Attach to every demo form on the page =====
  function bind(form) {
    if (form.getAttribute("data-demo-bound")) return;
    // The form is found through its email field, so wrapper/form ID differences don't matter.
    var emailEl = form.querySelector('[name="Email-address"], [name="email"], input[type="email"]');
    if (!emailEl) return;
    form.setAttribute("data-demo-bound", "1");
    window.demoFunnel.forms++;

    var sending = false;

    form.addEventListener("submit", function () {
      var email   = value(emailEl);
      var country = selectedCountry(form.querySelector('select[name="Select-Country"], select[name="Country"]'));

      // 1) Calendly opens immediately (must stay inside the user gesture)
      var url = calendlyUrl(country) + "?hide_event_type_details=1&hide_gdpr_banner=1";
      var utm = { utmSource: "website", utmMedium: "demo-form", utmContent: email, utmTerm: country };
      if (window.Calendly && Calendly.initPopupWidget) {
        Calendly.initPopupWidget({ url: url, prefill: { email: email }, utm: utm });
      } else {
        window.open(url + "&email=" + encodeURIComponent(email) +
          "&utm_source=website&utm_medium=demo-form" +
          "&utm_content=" + encodeURIComponent(email) +
          "&utm_term=" + encodeURIComponent(country), "_blank");
      }

      // 2) Honeypot: filled = bot
      if (value(form.querySelector('[name="' + HONEYPOT_NAME + '"]'))) {
        console.warn("[demoFunnel] Honeypot filled, not sent");
        return;
      }
      if (!email || sending) return;
      sending = true;

      // Standardised field names, whatever the form calls them
      var data = new URLSearchParams();
      data.set("Email-address", email);
      if (country) data.set("Select-Country", country);

      // 3) Only send once Webflow's Turnstile produced a token
      var waited = 0;
      (function check() {
        if (value(form.querySelector('[name="' + TURNSTILE_NAME + '"]'))) {
          sending = false;
          sendToPardot(data);
          return;
        }
        if (waited >= TOKEN_WAIT_MS) {
          sending = false;
          console.warn("[demoFunnel] No Turnstile token, not sent");
          return;
        }
        waited += 250;
        setTimeout(check, 250);
      })();
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("form"), function (f) {
      if (isDemoForm(f)) bind(f);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
