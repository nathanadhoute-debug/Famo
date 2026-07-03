import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error:"Unauthorized" },{ status:401 });
  // TODO: implémenter la logique du cron rx-expiry
  return NextResponse.json({ ok:true, cron:"rx-expiry", ts: new Date().toISOString() });
}
