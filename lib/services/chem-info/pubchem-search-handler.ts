import { writeSyncLog } from "@/lib/services/chem-info/chemical-reference-sync";
import {
  PubChemSearchError,
  httpStatusForPubChemError,
  pubChemErrorMessage,
  type PubChemErrorCode,
} from "@/lib/services/chem-info/pubchem-errors";
import { searchPubChem, type PubChemSearchHit, type PubChemSearchMode } from "@/lib/services/chem-info/pubchem";
import type { PubChemSearchHitView } from "@/types/chem-info";

export { PubChemSearchError, pubChemErrorMessage, type PubChemErrorCode };

export type PubChemOnlineSearchParams = {
  query: string;
  mode?: PubChemSearchMode;
  limit?: number;
  performedBy?: string;
};

export type PubChemOnlineSearchSuccess = {
  ok: true;
  items: PubChemSearchHitView[];
  notFound?: boolean;
};

export type PubChemOnlineSearchFailure = {
  ok: false;
  code: PubChemErrorCode;
  error: string;
  message: string;
  status: number;
};

export type PubChemOnlineSearchResult = PubChemOnlineSearchSuccess | PubChemOnlineSearchFailure;

function mapHits(hits: PubChemSearchHit[]): PubChemSearchHitView[] {
  return hits.map((hit) => ({
    cid: hit.cid,
    name: hit.name,
    cas: hit.cas,
    molecularFormula: hit.molecularFormula,
    molecularWeight: hit.molecularWeight,
    structure2dUrl: hit.structure2dUrl,
  }));
}

export async function safeWriteSyncLog(input: Parameters<typeof writeSyncLog>[0]) {
  try {
    await writeSyncLog(input);
  } catch (logErr) {
    console.error("[pubchem-sync-log]", logErr);
  }
}

export async function handlePubChemOnlineSearch(
  params: PubChemOnlineSearchParams,
): Promise<PubChemOnlineSearchResult> {
  const query = params.query.trim();
  const mode = params.mode ?? "all";
  const limit = params.limit ?? 20;
  const performedBy = params.performedBy ?? "anonymous";

  if (!query) {
    const code: PubChemErrorCode = "EMPTY_QUERY";
    return {
      ok: false,
      code,
      error: pubChemErrorMessage(code),
      message: pubChemErrorMessage(code),
      status: httpStatusForPubChemError(code),
    };
  }

  try {
    const items = await searchPubChem(query, mode, limit);

    if (!items.length) {
      await safeWriteSyncLog({
        action: "search",
        query,
        status: "success",
        message: "No results",
        performedBy,
      });
      return { ok: true, items: [], notFound: true };
    }

    await safeWriteSyncLog({
      action: "search",
      query,
      status: "success",
      message: `Found ${items.length} hit(s)`,
      performedBy,
    });

    return { ok: true, items: mapHits(items) };
  } catch (err) {
    const code: PubChemErrorCode =
      err instanceof PubChemSearchError ? err.code : "INTERNAL";
    const message =
      err instanceof PubChemSearchError ? err.message : pubChemErrorMessage("INTERNAL");

    await safeWriteSyncLog({
      action: "search",
      query,
      status: "error",
      message,
      performedBy,
    });

    return {
      ok: false,
      code,
      error: message,
      message,
      status: httpStatusForPubChemError(code),
    };
  }
}

export function toJsonResponse(result: PubChemOnlineSearchResult): {
  body: Record<string, unknown>;
  status: number;
} {
  if (result.ok) {
    return {
      status: 200,
      body: {
        items: result.items,
        ...(result.notFound ? { code: "NOT_FOUND" as const, message: pubChemErrorMessage("NOT_FOUND") } : {}),
      },
    };
  }
  return {
    status: result.status,
    body: {
      error: result.error,
      code: result.code,
      message: result.message,
    },
  };
}
