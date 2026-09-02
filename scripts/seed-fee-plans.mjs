// Seeds the three paid FeePlan tiers (ENKORE Connect is free/non-selling,
// so it isn't a fee plan). Numbers are the real, published rates from the
// Pricing page (Soundcheck 15%/monthly, Mainstage 12%/bi-weekly, Headliner
// 10%/weekly) — not placeholders. Idempotent: upserts by name, safe to
// re-run.
//
// No code reads monthlyFee/upfrontPaymentMonths/termMonths yet (billing
// invoicing isn't automated — see SubscriptionPayment's own doc comment),
// so there's no established convention to match. Chosen here: monthlyFee
// is the effective monthly-equivalent rate (published total price ÷
// termMonths) — R200/month across all three tiers, just billed in
// different upfront chunks, so termMonths × monthlyFee = the real
// published price (R1,200 for Mainstage's 6 months, R2,400 for
// Headliner's 12).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const PLANS = [
  {
    name: "Soundcheck",
    termMonths: 1,
    monthlyFee: 200,
    upfrontPaymentMonths: 1,
    platformCommissionPercentage: 15,
    payoutFrequency: "MONTHLY",
    description: "Start building. Pay month-to-month. Billed monthly, in advance.",
  },
  {
    name: "Mainstage",
    termMonths: 6,
    monthlyFee: 200, // ZAR 1,200 / 6 months
    upfrontPaymentMonths: 6,
    platformCommissionPercentage: 12,
    payoutFrequency: "BI_WEEKLY",
    description: "Lower commission. Faster payouts. Billed every 6 months, in advance.",
  },
  {
    name: "Headliner",
    termMonths: 12,
    monthlyFee: 200, // ZAR 2,400 / 12 months
    upfrontPaymentMonths: 12,
    platformCommissionPercentage: 10,
    payoutFrequency: "WEEKLY",
    description: "Best rate. Paid every week. Billed yearly, in advance.",
  },
];

for (const plan of PLANS) {
  const existing = await prisma.feePlan.findFirst({ where: { name: plan.name } });
  if (existing) {
    await prisma.feePlan.update({ where: { id: existing.id }, data: plan });
    console.log(`updated ${plan.name}`);
  } else {
    await prisma.feePlan.create({ data: plan });
    console.log(`created ${plan.name}`);
  }
}

await prisma.$disconnect();
