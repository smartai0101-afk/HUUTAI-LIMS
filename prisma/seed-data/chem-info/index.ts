import type { PrismaClient } from "@prisma/client";
import { normalizeChemicalName } from "@/lib/services/chem-info/cas-parser";
import { ELEMENT_SEED, getElementApplications, getElementGridPosition } from "../../../lib/chem-info/elements-data";
import { CHEMICAL_REFERENCE_SEED } from "./chemical-references";
import { COMPATIBILITY_RULE_SEED } from "./compatibility-rules";
import { GHS_PICTOGRAM_SEED } from "./ghs-pictograms";
import { HAZARD_CATEGORIES_BY_CAS } from "./hazard-categories";

const LEGACY_COMPATIBILITY_RULE_CODES = ["ACID_BASE", "OXIDIZER_SOLVENT", "CHROMIC_ALCOHOL"];

function parseRevisionDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function seedChemInfoModule(prisma: PrismaClient) {
  console.log("Seeding chem-info reference data...");

  for (const el of ELEMENT_SEED) {
    const { row, col } = getElementGridPosition(el.atomicNumber);
    const applications = getElementApplications(el.symbol, el.applications);
    await prisma.element.upsert({
      where: { symbol: el.symbol },
      create: {
        symbol: el.symbol,
        name: el.name,
        nameVi: el.nameVi ?? "",
        atomicNumber: el.atomicNumber,
        atomicMass: el.atomicMass,
        group: el.group,
        period: el.period,
        block: el.block,
        classification: el.classification,
        electronConfig: el.electronConfig,
        electronegativity: el.electronegativity,
        meltingPointC: el.meltingPointC,
        boilingPointC: el.boilingPointC,
        gridRow: row,
        gridColumn: col,
        applications: JSON.stringify(applications),
      },
      update: {
        name: el.name,
        nameVi: el.nameVi ?? "",
        atomicMass: el.atomicMass,
        group: el.group,
        period: el.period,
        block: el.block,
        classification: el.classification,
        electronConfig: el.electronConfig,
        electronegativity: el.electronegativity,
        meltingPointC: el.meltingPointC,
        boilingPointC: el.boilingPointC,
        gridRow: row,
        gridColumn: col,
        applications: JSON.stringify(applications),
      },
    });
  }
  console.log(`  Elements: ${ELEMENT_SEED.length} rows`);

  for (const pictogram of GHS_PICTOGRAM_SEED) {
    await prisma.ghsPictogram.upsert({
      where: { code: pictogram.code },
      create: pictogram,
      update: {
        label: pictogram.label,
        imagePath: pictogram.imagePath,
        description: pictogram.description,
      },
    });
  }
  console.log(`  GHS pictograms: ${GHS_PICTOGRAM_SEED.length} rows`);

  for (const rule of COMPATIBILITY_RULE_SEED) {
    await prisma.compatibilityRule.upsert({
      where: { code: rule.code },
      create: {
        code: rule.code,
        ruleType: rule.ruleType,
        operandAKind: rule.operandAKind,
        operandAValue: rule.operandAValue,
        operandBKind: rule.operandBKind,
        operandBValue: rule.operandBValue,
        categoryA: rule.categoryA,
        categoryB: rule.categoryB,
        categoryALabel: rule.categoryALabel,
        categoryBLabel: rule.categoryBLabel,
        severity: rule.severity,
        title: rule.title,
        message: rule.message,
        storageGuidance: rule.storageGuidance,
        examples: JSON.stringify(rule.examples),
        isActive: true,
      },
      update: {
        ruleType: rule.ruleType,
        operandAKind: rule.operandAKind,
        operandAValue: rule.operandAValue,
        operandBKind: rule.operandBKind,
        operandBValue: rule.operandBValue,
        categoryA: rule.categoryA,
        categoryB: rule.categoryB,
        categoryALabel: rule.categoryALabel,
        categoryBLabel: rule.categoryBLabel,
        severity: rule.severity,
        title: rule.title,
        message: rule.message,
        storageGuidance: rule.storageGuidance,
        examples: JSON.stringify(rule.examples),
        isActive: true,
      },
    });
  }
  await prisma.compatibilityRule.updateMany({
    where: { code: { in: LEGACY_COMPATIBILITY_RULE_CODES } },
    data: { isActive: false },
  });
  console.log(`  Compatibility rules: ${COMPATIBILITY_RULE_SEED.length} rows`);

  for (const chem of CHEMICAL_REFERENCE_SEED) {
    const ref = await prisma.chemicalReference.upsert({
      where: { casNumber: chem.casNumber },
      create: {
        casNumber: chem.casNumber,
        name: chem.name,
        normalizedName: normalizeChemicalName(chem.name),
        molecularFormula: chem.molecularFormula,
        molecularWeight: chem.molecularWeight,
        synonyms: JSON.stringify(chem.synonyms),
        pubchemCid: chem.pubchemCid ?? null,
        smiles: chem.smiles ?? "",
        inchi: chem.inchi ?? "",
        inchiKey: chem.inchiKey ?? "",
        notes: chem.notes ?? "",
        source: "seed",
        syncStatus: "local",
      },
      update: {
        name: chem.name,
        normalizedName: normalizeChemicalName(chem.name),
        molecularFormula: chem.molecularFormula,
        molecularWeight: chem.molecularWeight,
        synonyms: JSON.stringify(chem.synonyms),
        pubchemCid: chem.pubchemCid ?? null,
        smiles: chem.smiles ?? "",
        inchi: chem.inchi ?? "",
        inchiKey: chem.inchiKey ?? "",
        notes: chem.notes ?? "",
        source: "seed",
        syncStatus: "local",
      },
    });

    await prisma.chemicalSafetyProfile.upsert({
      where: { chemicalReferenceId: ref.id },
      create: {
        chemicalReferenceId: ref.id,
        signalWord: chem.safety.signalWord,
        hazardStatements: JSON.stringify(chem.safety.hazardStatements),
        precautionaryStatements: JSON.stringify(chem.safety.precautionaryStatements),
        pictogramCodes: JSON.stringify(chem.safety.pictogramCodes),
        unNumber: chem.safety.unNumber ?? "",
        hazardClass: chem.safety.hazardClass ?? "",
        packingGroup: chem.safety.packingGroup ?? "",
      },
      update: {
        signalWord: chem.safety.signalWord,
        hazardStatements: JSON.stringify(chem.safety.hazardStatements),
        precautionaryStatements: JSON.stringify(chem.safety.precautionaryStatements),
        pictogramCodes: JSON.stringify(chem.safety.pictogramCodes),
        unNumber: chem.safety.unNumber ?? "",
        hazardClass: chem.safety.hazardClass ?? "",
        packingGroup: chem.safety.packingGroup ?? "",
      },
    });

    const categories = HAZARD_CATEGORIES_BY_CAS[chem.casNumber] ?? [];
    await prisma.chemicalHazardCategory.upsert({
      where: { chemicalReferenceId: ref.id },
      create: {
        chemicalReferenceId: ref.id,
        categories: JSON.stringify(categories),
      },
      update: {
        categories: JSON.stringify(categories),
      },
    });

    for (const doc of chem.sdsDocuments ?? []) {
      await prisma.sdsDocument.upsert({
        where: { id: doc.id },
        create: {
          id: doc.id,
          chemicalReferenceId: ref.id,
          title: doc.title,
          supplier: doc.supplier,
          revisionDate: parseRevisionDate(doc.revisionDate),
          externalUrl: doc.externalUrl,
          isPrimary: doc.isPrimary,
          uploadedBy: "seed",
        },
        update: {
          title: doc.title,
          supplier: doc.supplier,
          revisionDate: parseRevisionDate(doc.revisionDate),
          externalUrl: doc.externalUrl,
          isPrimary: doc.isPrimary,
          uploadedBy: "seed",
        },
      });
    }
  }
  console.log(`  Chemical references: ${CHEMICAL_REFERENCE_SEED.length} rows`);
}
