import type { PrismaClient } from "@prisma/client";
import { parseDate } from "../helpers";
import {
  DEMO_REQUEST_PREFIX,
  DEMO_SAMPLE_PREFIX,
  SAMPLE_DEMO_DEFINITIONS,
} from "./sample-definitions";
import {
  resolveChemicalId,
  resolveEquipmentId,
  resolveMethod,
  resolveStandardId,
} from "./resolvers";

async function wipeDemoSamples(prisma: PrismaClient): Promise<void> {
  const demoSamples = await prisma.sample.findMany({
    where: { sampleCode: { startsWith: DEMO_SAMPLE_PREFIX } },
    select: { id: true },
  });
  const sampleIds = demoSamples.map((s) => s.id);

  if (sampleIds.length > 0) {
    await prisma.sampleAuditLog.deleteMany({
      where: { entityType: "sample", entityId: { in: sampleIds } },
    });
    await prisma.sample.deleteMany({ where: { id: { in: sampleIds } } });
  }

  const demoRequests = await prisma.sampleRequest.findMany({
    where: { requestCode: { startsWith: DEMO_REQUEST_PREFIX } },
    select: { id: true },
  });
  const requestIds = demoRequests.map((r) => r.id);

  if (requestIds.length > 0) {
    await prisma.sampleAuditLog.deleteMany({
      where: { entityType: "sample_request", entityId: { in: requestIds } },
    });
    await prisma.sampleRequest.deleteMany({ where: { id: { in: requestIds } } });
  }
}

async function upsertCodeSequences(prisma: PrismaClient): Promise<void> {
  await prisma.codeSequence.upsert({
    where: { prefix: DEMO_REQUEST_PREFIX.slice(0, -1) },
    create: { prefix: "PR-20260629", lastValue: 10 },
    update: { lastValue: 10 },
  });
  await prisma.codeSequence.upsert({
    where: { prefix: "SPL-20260629" },
    create: { prefix: "SPL-20260629", lastValue: 10 },
    update: { lastValue: 10 },
  });
}

export async function seedSamples(prisma: PrismaClient): Promise<void> {
  console.log("Seeding sample reception demo data...");
  await wipeDemoSamples(prisma);

  let created = 0;

  for (const def of SAMPLE_DEMO_DEFINITIONS) {
    const request = await prisma.sampleRequest.create({
      data: {
        requestCode: def.requestCode,
        requestDate: parseDate(def.request.requestDate),
        requesterName: def.request.requesterName,
        customerName: def.request.customerName,
        department: def.request.department,
        purpose: def.request.purpose,
        sampleType: def.request.sampleType,
        sampleCount: def.request.sampleCount,
        dueDate: parseDate(def.request.dueDate),
        status: def.request.status,
        note: def.request.note,
        createdBy: "Seed",
        requestedTests: {
          create: def.request.requestedTests.map((parameterName) => ({ parameterName })),
        },
      },
    });

    for (const methodCode of def.request.methodCodes) {
      const method = await resolveMethod(prisma, methodCode);
      if (!method) {
        console.warn(`  Skip method ${methodCode} for ${def.requestCode}`);
        continue;
      }
      await prisma.sampleRequestMethod.create({
        data: {
          requestId: request.id,
          methodId: method.id,
          methodVersionId: method.currentVersionId,
        },
      });
    }

    const primaryMethod = await resolveMethod(prisma, def.sample.primaryMethodCode);

    const sample = await prisma.sample.create({
      data: {
        sampleCode: def.sampleCode,
        sampleName: def.sample.sampleName,
        sampleType: def.sample.sampleType,
        customerSampleCode: def.sample.customerSampleCode,
        requestId: request.id,
        receivedAt: new Date(def.sample.receivedAt),
        deliveredBy: def.sample.deliveredBy,
        receivedBy: def.sample.receivedBy,
        conditionOnReceipt: def.sample.conditionOnReceipt,
        conditionNote: def.sample.conditionNote,
        quantity: def.sample.quantity,
        unit: def.sample.unit,
        containerType: def.sample.containerType,
        preservationCondition: def.sample.preservationCondition,
        storageLocation: def.sample.storageLocation,
        retentionUntil: def.sample.retentionUntil
          ? parseDate(def.sample.retentionUntil)
          : null,
        status: def.sample.status,
        assignedTo: def.sample.assignedTo,
        dueDate: parseDate(def.sample.dueDate),
        note: def.sample.note,
        primaryMethodId: primaryMethod?.id ?? null,
        primaryMethodVersionId: primaryMethod?.currentVersionId ?? null,
        needsMethodAssignment: !primaryMethod,
        createdBy: "Seed",
      },
    });

    await prisma.sampleCustodyEvent.create({
      data: {
        sampleId: sample.id,
        action: "Received",
        fromPerson: def.sample.deliveredBy,
        toPerson: def.sample.receivedBy,
        location: def.sample.storageLocation || "Phòng tiếp nhận",
        note: "Tiếp nhận mẫu demo",
        performedBy: def.sample.receivedBy,
        performedAt: new Date(def.sample.receivedAt),
      },
    });

    if (def.tests?.length) {
      for (const testDef of def.tests) {
        const method = await resolveMethod(prisma, testDef.methodCode);
        const equipmentId = await resolveEquipmentId(prisma, testDef.equipmentCode);

        const test = await prisma.sampleTest.create({
          data: {
            sampleId: sample.id,
            parameterName: testDef.parameterName,
            methodId: method?.id ?? null,
            methodVersionId: method?.currentVersionId ?? null,
            equipmentId,
            assignedTo: testDef.assignedTo,
            status: testDef.status,
            dueDate: parseDate(def.sample.dueDate),
          },
        });

        for (const code of testDef.chemicalCodes ?? []) {
          const chemicalId = await resolveChemicalId(prisma, code);
          if (chemicalId) {
            await prisma.sampleTestChemical.create({
              data: { testId: test.id, chemicalId },
            });
          }
        }

        for (const code of testDef.standardCodes ?? []) {
          const standardId = await resolveStandardId(prisma, code);
          if (standardId) {
            await prisma.sampleTestStandard.create({
              data: { testId: test.id, standardId },
            });
          }
        }
      }
    }

    if (def.storage) {
      await prisma.sampleStorageRecord.create({
        data: {
          sampleId: sample.id,
          storageLocation: def.storage.storageLocation,
          preservationCondition: def.storage.preservationCondition,
          storedAt: new Date(def.storage.storedAt),
          retentionUntil: parseDate(def.storage.retentionUntil),
          storedBy: def.storage.storedBy,
        },
      });

      await prisma.sampleCustodyEvent.create({
        data: {
          sampleId: sample.id,
          action: "Stored",
          fromPerson: def.sample.receivedBy,
          toPerson: def.storage.storedBy,
          location: def.storage.storageLocation,
          note: "Lưu mẫu sau phân tích",
          performedBy: def.storage.storedBy,
          performedAt: new Date(def.storage.storedAt),
        },
      });
    }

    if (def.dispose) {
      await prisma.sampleStorageRecord.create({
        data: {
          sampleId: sample.id,
          storageLocation: "Khu vực hủy mẫu",
          preservationCondition: def.sample.preservationCondition,
          storedAt: new Date(def.sample.receivedAt),
          retentionUntil: def.sample.retentionUntil
            ? parseDate(def.sample.retentionUntil)
            : null,
          storedBy: def.sample.receivedBy,
          disposedBy: def.dispose.disposedBy,
          disposedAt: new Date(def.dispose.disposedAt),
          disposeReason: def.dispose.disposeReason,
        },
      });

      await prisma.sampleCustodyEvent.create({
        data: {
          sampleId: sample.id,
          action: "Disposed",
          fromPerson: def.sample.receivedBy,
          toPerson: def.dispose.disposedBy,
          location: "Khu vực hủy mẫu",
          note: def.dispose.disposeReason,
          performedBy: def.dispose.disposedBy,
          performedAt: new Date(def.dispose.disposedAt),
        },
      });
    }

    await prisma.sampleAuditLog.create({
      data: {
        entityType: "sample",
        entityId: sample.id,
        action: "seed_demo",
        afterJson: JSON.stringify({ sampleCode: def.sampleCode, status: def.sample.status }),
        changedBy: "Seed",
      },
    });

    created++;
    console.log(`  Created ${def.requestCode} → ${def.sampleCode} (${def.sample.status})`);
  }

  await upsertCodeSequences(prisma);
  console.log(`Sample reception demo: ${created} request/sample pairs seeded.`);
}
