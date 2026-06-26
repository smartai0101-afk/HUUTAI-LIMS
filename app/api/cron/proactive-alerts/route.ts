import { NextResponse } from "next/server";
import { runProactiveAlerts } from "@/lib/services/proactive-alerts";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runProactiveAlerts();
  return NextResponse.json(result);
}
