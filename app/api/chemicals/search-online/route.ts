import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import {
  handlePubChemOnlineSearch,
  toJsonResponse,
} from "@/lib/services/chem-info/pubchem-search-handler";
import type { PubChemSearchMode } from "@/lib/services/chem-info/pubchem";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json(
      {
        error: auth.error,
        code: "UNAUTHORIZED",
        message: "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.",
      },
      { status: 401 },
    );
  }

  let body: { query?: string; limit?: number; mode?: string };
  try {
    body = (await request.json()) as { query?: string; limit?: number; mode?: string };
  } catch {
    return NextResponse.json(
      {
        error: "Body JSON không hợp lệ",
        code: "PARSE_ERROR",
        message: "Body JSON không hợp lệ",
      },
      { status: 400 },
    );
  }

  const modeRaw = body.mode?.trim() ?? "all";
  const mode: PubChemSearchMode =
    modeRaw === "name" || modeRaw === "cas" || modeRaw === "formula" ? modeRaw : "all";
  const limitRaw = Number(body.limit ?? 20);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

  const result = await handlePubChemOnlineSearch({
    query: body.query ?? "",
    mode,
    limit,
    performedBy: auth.user.name || auth.user.email,
  });

  const { body: responseBody, status } = toJsonResponse(result);
  return NextResponse.json(responseBody, { status });
}
