import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  free: {
    label:      "Gratuit",
    price:      "0 €/mois",
    maxMembers: 3,
    maxDocs:    10,
    features:   ["3 membres max", "10 documents", "Médicaments", "Journal"],
  },
  premium: {
    label:      "Premium",
    price:      "9 €/mois",
    priceId:    process.env.STRIPE_PREMIUM_PRICE_ID!,
    maxMembers: 10,
    maxDocs:    -1,
    features:   ["10 membres", "Documents illimités", "Rappels email", "Export PDF"],
  },
} as const;
