# Root cause analysis

The investigation followed the data rather than the configuration. For each hypothesis, a test either confirmed or ruled it out before anything was changed.

## 1. When did it break?

Campaign member counts per month, by the user that created them:

| Month | "Booked a demo" campaign | "Unfinished demo request" campaign |
|---|---|---|
| May | 9 | 7 |
| Jun | 20 | 17 |
| Jul | 28 | 13 |
| Aug | 19 | 16 |
| **Sep** | 17 | **0** |
| Oct | 14 | 2 |

Bookings kept arriving, because they came through Calendly. Form-only requests dropped to zero in September, the same month the Pardot handler stopped receiving submissions.

## 2. Hypotheses and tests

| Hypothesis | Test | Result |
|---|---|---|
| The email field name doesn't match the handler mapping | `document.getElementById("Email-address").name` in the console | Ruled out: `Email-address` on both sides (Webflow publishes "Email address" as `Email-address`) |
| The script isn't on the page | Search the live HTML for a marker string; read `form.action` | Ruled out: action pointed at the Pardot handler |
| Webflow cancels the native submit | Submit listener logging `event.defaultPrevented` | **Confirmed:** `true` |
| Nothing reaches the hidden iframe | Read `iframe.contentWindow.location.href` after submit | **Confirmed:** `about:blank` |
| Pardot rejects the data | Manual `fetch()` POST from the console with an empty form | Pardot answered with its error redirect (`errors=true`, "This field is required"), so it is reachable |
| Pardot accepts valid data | Same POST with a filled form | **Confirmed:** prospect created, submission recorded |
| The script targets the wrong element | `[...document.forms].map(f => f.id)` | **Confirmed:** the form ID was `wf-form-demo-form`; the looked-up ID sat on the wrapper |

One more detail: when the Console's execution context was the Calendly iframe instead of `top`, element lookups returned `null` and produced misleading errors. Checking the context selector was part of the routine.

## 3. Site-wide coverage

A crawl of all 1,310 sitemap URLs, inspecting each form's name, action and field IDs, found:

- the demo form on **212 pages**, the script on only **30**;
- homepages using `email` instead of `Email-address` as the field name;
- download forms sharing the name `demo-form` (distinguishable by a `First-Name` field);
- one locale with its own, diverging Calendly routing.

## 4. The webinar email

The live page sent the demo submission only to the demo handler (Network tab and page-source audit), and Webflow had no webhooks registered. The email was therefore triggered *after* the data landed. The cause was a Zapier path condition using **(Date/time) Equals** on a text value, which evaluates to true for any input.

## 5. Unreliable booking state

`Tag`, `Asset` and `Inbound Lead Action` were used to infer "booked a demo". Profiling the `Asset` values showed three naming styles for the same assets and constant overwriting by guide and webinar conversions. A Zap also overwrote `Lead Source`. These fields could not serve as a booking signal.
