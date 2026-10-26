# Webflow: site-wide demo form script

[`demo-form.js`](demo-form.js) replaces the per-page scripts that used to be copied into individual pages and locales.

## Install

In **Site settings → Custom code → Before `</body>` tag**:

```html
<link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css">
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
<script>
  /* contents of demo-form.js */
</script>
```

Then remove every page-level copy of the old script, including locale overrides. Otherwise Calendly opens twice.

A single **Publish** pushes all pages and locales.

## Why it works where the old script didn't

| Old script | New script |
|---|---|
| Looked up the form by ID, which on one locale sat on the Form Block wrapper | Finds the form through its email field (`emailEl.form`) |
| Pointed `form.action` at Pardot and relied on the native submit into a hidden iframe | Sends with `fetch()`, independent of Webflow's submit handling |
| Webflow's form model cancels the native submit (`defaultPrevented === true`), so nothing was sent | Webflow keeps handling its own copy; the Pardot POST happens in parallel |
| Copied per page and locale; country routing diverged | One copy for the whole site; local spellings of countries map to the same host |
| No bot filtering | Honeypot + wait for Webflow's Turnstile token |

## Field names

Webflow shows field names with spaces in the Designer ("Email address") but publishes them with dashes (`Email-address`). The script and the Pardot handler use the published names.

## Honeypot field

Add a text field to the demo form component:

- Name: `hp_field`, no label, not required
- Custom attributes: `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`
- Class with `position: absolute; left: -9999px` (not `display: none`; some bots skip hidden fields)

## Verifying a page

In the browser console (context: `top`):

```js
[window.demoFunnel, document.documentElement.innerHTML.split("initPopupWidget").length - 1]
```

`forms` should be ≥ 1 and the count must be `1`. A higher count means a page-level copy is still there.

## Debugging technique used during the investigation

To confirm *why* submissions weren't arriving, this listener was run in the console before submitting:

```js
(() => {
  const f = document.getElementById("Email-address").form;
  f.addEventListener("submit", e => setTimeout(() => {
    console.log("1) Submit cancelled:", e.defaultPrevented);
    setTimeout(() => {
      try { console.log("2) iframe:", document.querySelector('iframe[name="pardot_iframe"]').contentWindow.location.href); }
      catch { console.log("2) iframe: cross-origin page loaded, data reached Pardot"); }
    }, 4000);
  }, 0));
})();
```

The result `true` / `about:blank` proved that Webflow cancelled the submit and nothing reached the handler.

## Limits

- The Turnstile check confirms that a token **exists**, not that it's valid. Only a server can verify it (see the roadmap).
- Bots that POST directly to the Pardot handler URL bypass the form entirely. This was also true before the rebuild.
