// Read-only commission-cap figure for the "R50k, then commission stops
// for the year" marketing promise — display only, per the project's
// standing decision that enforcement is deliberately not built yet (see
// the dashboard Payouts page's own comment on this). The R100k
// "registered as a worship team" tier the marketing copy mentions has no
// backing field anywhere in the schema (no Musician.isWorshipTeam or
// equivalent), so every musician is shown against the R50k individual
// figure until that distinction actually exists.
export const COMMISSION_CAP_ZAR = 50000;

export const COMMISSION_CAP_WINDOW_DAYS = 365;

// Only Purchase.platformFee is an actual persisted historical figure.
// TicketPurchase and MerchandiseOrder both run their earnings through the
// same computeCommission() at completion time, but neither table
// persists the fee itself (TicketPurchase stores totalAmount only,
// MerchandiseOrder isn't wired to a checkout at all yet) — recomputing
// it after the fact from current subscription status would misrepresent
// what was actually taken at the time, not just be incomplete. Scoped to
// track-sale commission only, honestly, rather than a number that reads
// as more complete than it is.
