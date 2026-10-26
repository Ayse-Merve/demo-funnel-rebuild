# Zapier

Zapier is used only for **notifications**. All state changes happen in Salesforce.

## 1. Fix: webinar Zap registered every form submitter

The Zap starts on *Pardot → New Form Submission* and branches into paths (one per webinar region). Each path continues only if the form handler matches that region's webinar.

**Bug:** the path conditions used **(Date/time) Equals** on the form handler name, e.g. `Form Handler Name (Date/time) Equals "US WEBINAR | …"`. Neither value is a date, so both sides were parsed as "no date" and compared as equal. Every path continued for every form, including the demo form.

**Fix:** all paths changed to **(Text) Exactly matches**.

**Verification:** a demo test submission shows every path as *did not continue*; a real webinar signup continues on exactly one path.

## 2. New: Slack notification for website demo bookings

### Why not trigger on Calendly

Zapier's Calendly trigger doesn't expose the event-type slug. It only has the event name, which hosts translate, and a per-host event-type ID (a managed event creates one copy per host). Neither is a stable filter. The slug is available on the Salesforce `Calendly Action` record, so the Zap starts there.

### Steps

1. **Trigger:** Salesforce → New Record → *Calendly Action*
2. **Filter:** `Event Type Slug` exactly matches `website_demo` AND `Name` exactly matches `invitee.created`
3. *(planned)* Salesforce → Find Record → Lead by `Invitee Email` (continue if not found)
4. *(planned)* Salesforce → Find Record → Contact by `Invitee Email` (continue if not found)
5. *(planned)* Formatter → Default Value: Lead ID, else Contact ID
6. *(planned)* Formatter → Default Value: Lead Country, else Contact Mailing Country
7. Slack → Send Channel Message (as bot, icon `:four_leaf_clover:`)

### Message template

```
🍀 It's your lucky day [Event Primary Publisher Name], a demo has been booked in your Calendly!

*Name:* [Invitee Name]
*Company:* [Custom Response 1]
*Country:* [Country]
*Email:* [Invitee Email]
*Message:* [Custom Response 2]
*Salesforce link:* https://<org>.lightning.force.com/[Record ID]
```

`https://<org>.lightning.force.com/<id>` opens the right record for both Leads and Contacts.

### Notes

- Connect both apps with a shared service account, not a personal one, so the Zap survives people leaving.
- The Salesforce *New Record* trigger polls the API. If the org's API limit becomes tight, the notification can move into the Flow (Slack action in Flow).
- To @-mention the host, Slack needs the member ID (`<@U…>`). Map host email → Slack ID with a Formatter lookup table.
