import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import {
  handlePubChemOnlineSearch,
  toJsonResponse,
} from "@/lib/services/chem-info/pubchem-search-handler";
import type { PubChemSearchMode } from "@/lib/services/chem-info/pubchem";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const modeRaw = searchParams.get("mode")?.trim() ?? "all";
  const mode: PubChemSearchMode =
    modeRaw === "name" || modeRaw === "cas" || modeRaw === "formula" ? modeRaw : "all";
  const limitRaw = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

  const result = await handlePubChemOnlineSearch({
    query: q,
    mode,
    limit,
    performedBy: auth.user.name || auth.user.email,
  });

  const { body, status } = toJsonResponse(result);
  return NextResponse.json(body, { status });
}
