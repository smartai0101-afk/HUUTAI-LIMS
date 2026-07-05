import { CatalogTestMethodsClient } from "@/components/admin/CatalogTestMethodsClient";
import { db } from "@/lib/db";
import { listTestCategories } from "@/lib/services/catalog/test-categories";
import { listTestMethodsWithStats } from "@/lib/services/catalog/test-methods";

export const dynamic = "force-dynamic";

export default async function AdminTestMethodsPage() {
  const [testMethods, categories, analyticalMethods] = await Promise.all([
    listTestMethodsWithStats(false),
    listTestCategories(false),
    db.analyticalMethod.findMany({
      select: { id: true, methodCode: true, methodName: true },
      orderBy: { methodCode: "asc" },
      take: 200,
    }),
  ]);
  return (
    <CatalogTestMethodsClient
      initial={testMethods}
      categories={categories}
      analyticalMethods={analyticalMethods}
    />
  );
}
