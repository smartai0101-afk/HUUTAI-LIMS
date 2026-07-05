import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";
import { listTestMethodsForMatrix } from "@/lib/services/catalog/test-methods";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const matrixId = url.searchParams.get("matrixId");

  if (matrixId) {
    if (!hasPermission(user.role, user.permissions, "catalog_test_methods", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tests = await listTestMethodsForMatrix(matrixId);
    return NextResponse.json({ tests });
  }

  if (!hasPermission(user.role, user.permissions, "catalog_matrices", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const matrices = await listSampleMatrices();
  return NextResponse.json({ matrices });
}
