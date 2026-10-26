# Design decisions

## D1: The slug, not the event name, identifies a website demo

Event names are visible to invitees and translated by hosts. The slug of a managed event is locked by the admin and identical for every host. The Flow's entry condition is `Event Type Slug = website_demo`, compared with **equals**: an old slug `…-website-demo` exists, so *contains* would match it.

## D2: No derived "demo booked" flag based on multi-purpose fields

`Tag`, `Asset` and `Inbound Lead Action` are rewritten whenever a lead downloads a guide or registers for a webinar. Instead, the booking is read from the Calendly integration's own record at the moment it's created. The existing *Inbound Demo Request* checkbox is set only by the Flow, as an output, never as an input.

## D3: Processing in Salesforce, not in an integration tool

Record-triggered Flows run inside the transaction, don't consume API calls (the org hit its daily API limit during the project), and don't depend on a third party's uptime. Zapier is kept for notifications only.

## D4: Event-driven, with no waiting periods

The old setup waited 48 hours and checked once. The new design reacts to whichever event comes **second**:

| First | Second | Handled by |
|---|---|---|
| Form submitted | Booking | Flow on Calendly Action created |
| Booking | Form submitted | Flow on Campaign Member created (planned) |

## D5: Survive email changes in Calendly

The website passes the form email to Calendly as `utm_content`. The Flow matches on it first and falls back to the invitee email. Name matching was considered and rejected: the form doesn't collect names, so the lead name is a placeholder.

## D6: A fresh form handler and campaign

Repairing the old handler would have kept its automations and side effects. A new handler with a single completion action and a new campaign with explicit statuses (*Demo Requested*, *Meeting Booked*) start from a clean state.

## D7: One script, configured centrally

The script lives once in the site-wide custom code and finds forms by their email field. Form IDs, wrapper IDs and locale differences no longer matter.

## D8: Bot protection in layers, honest about limits

Client side: honeypot plus "Turnstile token exists". These stop cheap bots without hurting real visitors. They cannot stop direct POSTs to the handler URL; that needs server-side verification (roadmap).
