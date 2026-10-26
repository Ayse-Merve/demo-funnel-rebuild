# Roadmap

| # | Item | Notes |
|---|---|---|
| 1 | Flow: add non-members who book via the website link | Booking without a form submission → add to the demo campaign as *Meeting Booked* (Contact first, else Lead). Decide what to do when no record exists. |
| 2 | Flow: Campaign Member created → look back for a booking | Covers "booking first, form later". 30-day lookback on `InviteeEmail` or `UtmContent`. |
| 3 | Slack Zap: Lead + Contact support | Find Record steps, direct record link and country for both. |
| 4 | Honeypot field in the form component | The script already checks for it. |
| 5 | 48-hour reminder email | Engagement Studio for *Demo Requested* without a booking; country-specific host link via dynamic content; links carry `utm_content` so bookings still match. |
| 6 | Retire the old Zaps and campaigns | After a parallel run confirms the new flow catches every booking. |
| 7 | Server-side bot protection | Own Turnstile widget verified by a serverless function (e.g. a Cloudflare Worker) in front of a handler whose URL is never exposed. The old public handler is deleted afterwards. Pardot's visitor cookie must be forwarded to keep visit history. |
| 8 | Cancellation alerts | On `invitee.canceled` with `IsRescheduled = false` for the website slug, notify the host; campaign status unchanged. |
