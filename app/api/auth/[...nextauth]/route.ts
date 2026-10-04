import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`auth_get_${ip}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many authentication requests. Please retry in a moment." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Stricter limit on credential verification attempts (15 per minute)
  const rl = checkRateLimit(`auth_post_${ip}`, { limit: 15, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many authentication attempts. Please wait before retrying." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }
  return handlers.POST(req);
}
