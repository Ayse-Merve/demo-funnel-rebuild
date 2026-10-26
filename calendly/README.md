# Calendly: one managed event for all demo hosts

## Before

- Each host had their own demo event type, with different names ("Live Demo with …", "Introductory Call with …", "Disco with …") and generated slugs.
- One locale page routed a region to a different host than the other locales.
- Salesforce could not reliably tell a website demo from any other meeting, so a Zap wrote a `calendly-demo` tag on **every** booking.

An audit of all Calendly Action records in Salesforce (229 distinct slugs since 2023) was used to map which old link belonged to which host and to choose a slug with no collisions.

## After

A **managed event** created in *Admin center → Managed events* and assigned to every demo host:

| Setting | Value |
|---|---|
| Event (admin template name) | `WEBSITE \| Demo Meeting` |
| Slug | `website_demo`, **locked** in *Booking page options* |
| Link per host | `calendly.com/<host-username>/website_demo` |
| Invitee form | Q1 *Organization name* (required) · Q2 *Tell us about you and your community* (optional) |

### Lock settings

| Section | Hosts can edit? | Why |
|---|---|---|
| Name / duration / location | Yes | Hosts translate the title and choose their own video tool |
| Booking page options (slug) | **No** | The slug is the integration key for Salesforce and the website |
| Invitee form | Yes | Hosts translate the questions (order must stay the same) |
| Payment | No | Not used |

Calendly rule to keep in mind: when a section is editable by hosts, later template changes to that section **do not sync** to them. To push a change, lock the section, save, then unlock again.

## Routing

The website script picks the host from the visitor's country selection:

| Country | Host key |
|---|---|
| Germany, Austria, Switzerland | `dach` |
| United States | `us` |
| Australia, New Zealand | `anz` |
| Netherlands | `nl` |
| Belgium | `be` |
| France | `fr` |
| United Kingdom | `uk` |
| Everything else, incl. no selection | `other` |

Changing a region's host means editing one username in the script.

## Event names

Calendly writes only two action names to Salesforce, and they are fixed: `invitee.created` (bookings, including the new booking created by a reschedule) and `invitee.canceled`. A reschedule arrives as a `canceled` + `created` pair, with `IsRescheduled = true` on the cancellation.
