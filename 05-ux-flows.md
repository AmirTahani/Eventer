# 5. UX Flows

## 5.1 Telegram bot flows

**`/start` (no invite payload, unknown user)**
→ "This is a private events platform. You need an invitation to join." (no signup form —
there is no public entry point, matching §1 non-negotiable).

**`/start?start=invite_<token>`**
→ look up Invitation by token → if valid & PENDING: show inviter's name (if you want
transparency) + "Accept invitation" button → on accept: create/approve User, set
`vouched_by_user_id`, mark Invitation ACCEPTED, send welcome message + main menu.
→ if already ACCEPTED/REVOKED/invalid token: friendly error, no main menu.

**Main menu** (persistent reply keyboard or inline, your call — recommend inline for
richer callback control): `Events | My Registrations | My Tickets | Waitlist | Profile |
Language`.

**Events → list**
→ paginated inline list of events visible to this user (query already filtered
server-side) → tap → event card (per your §10 template; location line always says
"Hidden until released" or shows the address, driven entirely by API response) →
`[Register] [View Details]`. Price line shows the **currently active tier price**
(resolved server-side per D16) — e.g. `💰 $75 (increases to $100 in 3 days)` if you opt
into the "increases to" hint, or just `💰 $75` if not.

**Register flow**
1. "How many people?" `[-] N [+]` (bounded by `max_people_per_registration`, live check
   against remaining capacity — if user requests more than remaining: show "Only N spots
   available" + `[Request More Tickets]` + `[Register for N]`).
2. If `people_count > 1`: guest collection wizard — for each guest slot, try
   `[Select Telegram user]` (Telegram's user-sharing UI feature, `KeyboardButtonRequestUser`)
   first; fallback `[Enter name manually]` → First name / Last name prompts.
3. Confirmation summary screen: names, price × count, total.
4. If `approval_required`: submit → `PENDING_APPROVAL` → "Your request has been sent to
   the organizer." User can `[Cancel Request]` anytime before decision.
   Organizer approves (via bot notification's inline `[Approve] [Reject]` buttons, or
   dashboard) → user notified → proceeds to step 5.
5. If not `approval_required` (or just approved): payment handoff — bot sends a payment
   link/button (provider-specific, out of scope for MVP architecture) → on success →
   `CONFIRMED` → ticket message with QR image attached.
6. If capacity unavailable at submission: offer `[Join Waitlist]` instead of failing
   silently.

**Waitlist promotion**
→ push notification: "A spot opened up for <Event>! You have 1 hour to claim it." →
`[Claim Spot]` → re-runs the normal registration flow from step 2 onward, capacity
already reserved via the shadow reservation.

**Location release notification** (auto, confirmed attendees + guests only)
→ "📍 Location released for <Event>: <venue>, <address> [Google Maps link]".

**Location change notification** (confirmed only, post-release edits)
→ "⚠️ The location for <Event> has changed: <new details>".

**Cancellation**
→ event cancelled: all non-terminal registrants notified, tickets shown as void in
`My Tickets`.
→ user-initiated cancellation: only allowed pre-payment per your spec (§5); confirmed/
paid cancellation is a Phase 2 refund-flow concern, but the *button* can exist and simply
route to "Contact the organizer" in MVP if you want it visible.

**Language switching**
→ `Profile → Language → English/فارسی` → sets `User.locale`, immediately re-renders
current menu in new language.

**Error states**
- Event full mid-registration → race lost → "Sorry, this event just filled up. Join the
  waitlist?"
- Expired pending payment → "Your reservation expired. You can register again." (fresh
  registration flow, old row stays `EXPIRED` for history)
- Duplicate registration attempt → "You already have an active registration for this
  event" + link to `My Registrations`.

## 5.2 Web dashboard flows

**Auth:** landing page → "Log in with Telegram" widget → redirected into dashboard scoped
to role. A plain `User` with no elevated role who somehow logs in sees only their own
profile/registrations (essentially the same view as the bot, just on web) — not an error
state, just a minimal dashboard.

**Organizer: Create event**
`Events → Create Event` → multi-step form: Basics (name/description/category/dress
code/age restriction) → DJs (search existing/create new, multi-select) → Location
(none / search existing / create new — clearly labeled "hidden from attendees until you
release it") → Schedule & Capacity (start/end, capacity, max-per-registration) →
**Pricing** (single base price by default; toggle "Add pricing tiers" to reveal a
repeatable `[Tier name] [Price] [Starts at]` row builder — UI enforces `starts_at`
values are strictly increasing and all before the event's `start_at`; live preview shows
the derived windows, e.g. "Early Bird: now → Aug 10 · Standard: Aug 10 → Aug 17 · Last
Day: Aug 17 → event start") → Access (approval toggle, visibility mode + selector for
SELECTED_USERS/SELECTED_VOUCHERS) → Review → **Save as Draft** or **Publish**.

**Organizer: Manage a live event**
Event detail page tabs: `Overview | Registrations | Waitlist | Check-in | Attendees |
Requests | Edit`.
- `Registrations`: table with status filter, `[Approve][Reject]` inline for pending, click
  → registration detail (guests, payment status, capacity-override requests).
- `Requests`: capacity-override requests queue, `[Approve N extra][Reject]`.
- `Check-in`: big scan-mode toggle (opens camera via browser QR scan library) +
  manual-search fallback; live counter "142 / 300 checked in."
- `[Release Location]` button — confirmation modal ("This is permanent and cannot be
  undone") — disabled/hidden once already released, replaced with `[Edit Location]`.
- `Edit`: same form as create, with guardrails: capacity can't drop below confirmed count
  (D13), price/date changes trigger the mandatory-notification banner explaining who gets
  notified.

**Voucher: Invitations**
`Vouchers` (if you keep it as a distinct nav item — otherwise folded into Profile for
non-admins) → list of sent invitations with status → `[New Invitation]` → enter Telegram
username (best-effort lookup) or generate a shareable deep link if the username isn't
resolvable → shows acceptance status live.

**Admin-only sections**
`Users`: approve/reject/suspend, role assignment, "invited by" column with drill-down to
full voucher chain.
`Audit Logs`: filterable by actor/entity/action/date range, before/after diff viewer.
`Payments` (global): cross-event payment status, useful once a real provider is wired up.

## 5.3 Open UX questions for you

- Do you want the **Telegram bot itself** to expose a lightweight "Organizer mode" (per
  §4 of your spec: "important organizer actions should also be available through
  Telegram")? Recommend limiting bot-side organizer actions to **approve/reject
  registrations and release location** only in MVP — full event creation/editing stays
  web-only, since a multi-field form is painful in a chat UI. Confirm this scope is okay.
- Should Voucher-only (non-Organizer, non-Admin) users get any web dashboard access at
  all, or is inviting purely a bot-side action for them? Recommend bot-only for MVP,
  dashboard access is a nice-to-have not a requirement.
