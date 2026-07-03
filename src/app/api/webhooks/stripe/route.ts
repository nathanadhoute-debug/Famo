import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createAdminClient();

  const syncSub = async (sub: Stripe.Subscription) => {
    const familyId = sub.metadata?.family_id;
    if (!familyId) return;
    await supabase.from("families").update({
      stripe_subscription_id: sub.id,
      subscription_status:    sub.status,
    }).eq("id", familyId);
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSub(event.data.object as Stripe.Subscription); break;
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode === "subscription" && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        await syncSub(sub);
      }
      break;
    }
  }
  return NextResponse.json({ received: true });
}
