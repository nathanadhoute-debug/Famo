import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error:"Unauthorized" },{ status:401 });
  // TODO: implémenter la logique du cron daily-doses
  return NextResponse.json({ ok:true, cron:"daily-doses", ts: new Date().toISOString() });
}
