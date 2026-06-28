export type GhsStatementSeed = { code: string; text: string };

export type SdsDocumentSeed = {
  id: string;
  title: string;
  supplier: string;
  revisionDate: string;
  externalUrl: string;
  isPrimary: boolean;
};

export type ChemicalSafetySeed = {
  signalWord: string;
  hazardStatements: GhsStatementSeed[];
  precautionaryStatements: GhsStatementSeed[];
  pictogramCodes: string[];
  unNumber?: string;
  hazardClass?: string;
  packingGroup?: string;
};

export type ChemicalReferenceSeed = {
  casNumber: string;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  synonyms: string[];
  pubchemCid?: number;
  smiles?: string;
  inchi?: string;
  inchiKey?: string;
  notes?: string;
  safety: ChemicalSafetySeed;
  sdsDocuments?: SdsDocumentSeed[];
};

function sds(
  cas: string,
  name: string,
  entries: Array<{ supplier: string; productCode: string; isPrimary?: boolean }>,
): SdsDocumentSeed[] {
  return entries.map((e, i) => ({
    id: `sds-${cas.replace(/-/g, "")}-${e.supplier.toLowerCase().replace(/\s+/g, "-")}`,
    title: `SDS — ${name}`,
    supplier: e.supplier,
    revisionDate: "2025-11-01",
    externalUrl:
      e.supplier === "Merck"
        ? `https://www.sigmaaldrich.com/VN/en/sds/sial/${e.productCode}?userType=anonymous`
        : e.supplier === "Sigma-Aldrich"
          ? `https://www.sigmaaldrich.com/VN/en/sds/sigma/${e.productCode}?userType=anonymous`
          : `https://www.fishersci.com/store/msds?partNumber=${e.productCode}&productDescription=${encodeURIComponent(name)}`,
    isPrimary: e.isPrimary ?? i === 0,
  }));
}

export const CHEMICAL_REFERENCE_SEED: ChemicalReferenceSeed[] = [
  {
    casNumber: "67-56-1",
    name: "Methanol",
    molecularFormula: "CH4O",
    molecularWeight: 32.04,
    synonyms: ["Methyl alcohol", "Wood alcohol", "MeOH"],
    pubchemCid: 887,
    smiles: "CO",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H301", text: "Toxic if swallowed" },
        { code: "H311", text: "Toxic in contact with skin" },
        { code: "H331", text: "Toxic if inhaled" },
        { code: "H370", text: "Causes damage to organs" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS02", "GHS06", "GHS08"],
      unNumber: "UN1230",
      hazardClass: "3",
      packingGroup: "II",
    },
    sdsDocuments: sds("67-56-1", "Methanol", [
      { supplier: "Merck", productCode: "106009", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "322415" },
      { supplier: "Honeywell", productCode: "40267" },
    ]),
  },
  {
    casNumber: "75-05-8",
    name: "Acetonitrile",
    molecularFormula: "C2H3N",
    molecularWeight: 41.05,
    synonyms: ["Methyl cyanide", "Ethanenitrile", "MeCN"],
    pubchemCid: 6342,
    smiles: "CC#N",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H312", text: "Harmful in contact with skin" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H332", text: "Harmful if inhaled" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing dust/fume/gas/mist/vapours/spray." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1648",
      hazardClass: "3",
      packingGroup: "II",
    },
    sdsDocuments: sds("75-05-8", "Acetonitrile", [
      { supplier: "Sigma-Aldrich", productCode: "271004", isPrimary: true },
      { supplier: "Merck", productCode: "100030" },
      { supplier: "Honeywell", productCode: "34851" },
    ]),
  },
  {
    casNumber: "7647-01-0",
    name: "Hydrochloric acid",
    molecularFormula: "HCl",
    molecularWeight: 36.46,
    synonyms: ["Hydrogen chloride solution", "Muriatic acid", "HCl"],
    pubchemCid: 313,
    smiles: "Cl",
    notes: "Typically supplied as ~37% aqueous solution in lab inventory.",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H290", text: "May be corrosive to metals" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H335", text: "May cause respiratory irritation" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe mist/vapours/spray." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water." },
      ],
      pictogramCodes: ["GHS05", "GHS07"],
      unNumber: "UN1789",
      hazardClass: "8",
      packingGroup: "II",
    },
    sdsDocuments: sds("7647-01-0", "Hydrochloric acid", [
      { supplier: "Honeywell", productCode: "258148", isPrimary: true },
      { supplier: "Merck", productCode: "100317" },
      { supplier: "Sigma-Aldrich", productCode: "320331" },
    ]),
  },
  {
    casNumber: "1310-73-2",
    name: "Sodium hydroxide",
    molecularFormula: "NaOH",
    molecularWeight: 40.0,
    synonyms: ["Caustic soda", "Lye", "Soda lye"],
    pubchemCid: 14798,
    smiles: "[Na+].[OH-]",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H290", text: "May be corrosive to metals" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe dust." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
      ],
      pictogramCodes: ["GHS05"],
      hazardClass: "8",
      packingGroup: "II",
    },
    sdsDocuments: sds("1310-73-2", "Sodium hydroxide", [
      { supplier: "Merck", productCode: "1310", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "S8045" },
      { supplier: "Honeywell", productCode: "S318" },
    ]),
  },
  {
    casNumber: "7664-93-9",
    name: "Sulfuric acid",
    molecularFormula: "H2SO4",
    molecularWeight: 98.08,
    synonyms: ["Oil of vitriol", "Sulphuric acid", "Battery acid"],
    pubchemCid: 1118,
    smiles: "OS(=O)(=O)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H290", text: "May be corrosive to metals" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe mist/vapours/spray." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P310", text: "Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS05"],
      unNumber: "UN1830",
      hazardClass: "8",
      packingGroup: "II",
    },
    sdsDocuments: sds("7664-93-9", "Sulfuric acid", [
      { supplier: "Sigma-Aldrich", productCode: "84728", isPrimary: true },
      { supplier: "Merck", productCode: "100731" },
      { supplier: "Honeywell", productCode: "258105" },
    ]),
  },
  {
    casNumber: "108-88-3",
    name: "Toluene",
    molecularFormula: "C7H8",
    molecularWeight: 92.14,
    synonyms: ["Methylbenzene", "Phenylmethane", "Toluol"],
    pubchemCid: 1140,
    smiles: "Cc1ccccc1",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H304", text: "May be fatal if swallowed and enters airways" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
        { code: "H361d", text: "Suspected of damaging the unborn child" },
        { code: "H373", text: "May cause damage to organs through prolonged or repeated exposure" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS02", "GHS07", "GHS08"],
      unNumber: "UN1294",
      hazardClass: "3",
      packingGroup: "II",
    },
    sdsDocuments: sds("108-88-3", "Toluene", [
      { supplier: "Merck", productCode: "108325", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "244511" },
    ]),
  },
  {
    casNumber: "7732-18-5",
    name: "Water",
    molecularFormula: "H2O",
    molecularWeight: 18.02,
    synonyms: ["Distilled water", "Deionized water", "HPLC water"],
    pubchemCid: 962,
    smiles: "O",
    notes: "Reference entry for HPLC-grade and lab water used in inventory.",
    safety: {
      signalWord: "",
      hazardStatements: [],
      precautionaryStatements: [{ code: "P102", text: "Keep out of reach of children." }],
      pictogramCodes: [],
    },
  },
  {
    casNumber: "64-18-6",
    name: "Formic acid",
    molecularFormula: "CH2O2",
    molecularWeight: 46.03,
    synonyms: ["Methanoic acid", "Hydrogen carboxylic acid", "HCOOH"],
    pubchemCid: 284,
    smiles: "C(=O)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H226", text: "Flammable liquid and vapour" },
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H331", text: "Toxic if inhaled" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS02", "GHS05", "GHS07"],
      unNumber: "UN1779",
      hazardClass: "8",
      packingGroup: "II",
    },
    sdsDocuments: sds("64-18-6", "Formic acid", [
      { supplier: "Sigma-Aldrich", productCode: "56302", isPrimary: true },
      { supplier: "Merck", productCode: "111700" },
      { supplier: "Honeywell", productCode: "180054" },
    ]),
  },
  {
    casNumber: "67-63-0",
    name: "Isopropanol",
    molecularFormula: "C3H8O",
    molecularWeight: 60.1,
    synonyms: ["Isopropyl alcohol", "2-Propanol", "IPA"],
    pubchemCid: 3776,
    smiles: "CC(C)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1219",
      hazardClass: "3",
      packingGroup: "II",
    },
    sdsDocuments: sds("67-63-0", "Isopropanol", [
      { supplier: "Merck", productCode: "109634", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "278513" },
    ]),
  },
  {
    casNumber: "58-08-2",
    name: "Caffeine",
    molecularFormula: "C8H10N4O2",
    molecularWeight: 194.19,
    synonyms: ["1,3,7-Trimethylxanthine", "Guaranine", "Theine"],
    pubchemCid: 2519,
    smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H319", text: "Causes serious eye irritation" },
      ],
      precautionaryStatements: [
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P270", text: "Do not eat, drink or smoke when using this product." },
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
      ],
      pictogramCodes: ["GHS07"],
    },
    sdsDocuments: sds("58-08-2", "Caffeine", [
      { supplier: "Sigma-Aldrich", productCode: "C0750", isPrimary: true },
      { supplier: "Merck", productCode: "C0750" },
    ]),
  },
  {
    casNumber: "103-90-2",
    name: "Paracetamol",
    molecularFormula: "C8H9NO2",
    molecularWeight: 151.16,
    synonyms: ["Acetaminophen", "APAP", "4-Acetamidophenol"],
    pubchemCid: 1983,
    smiles: "CC(=O)NC1=CC=C(C=C1)O",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H335", text: "May cause respiratory irritation" },
      ],
      precautionaryStatements: [
        { code: "P261", text: "Avoid breathing dust." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
      ],
      pictogramCodes: ["GHS07"],
    },
    sdsDocuments: sds("103-90-2", "Paracetamol", [
      { supplier: "Sigma-Aldrich", productCode: "A7085", isPrimary: true },
      { supplier: "Merck", productCode: "A7085" },
    ]),
  },
  {
    casNumber: "64-17-5",
    name: "Ethanol",
    molecularFormula: "C2H6O",
    molecularWeight: 46.07,
    synonyms: ["Ethyl alcohol", "Absolute ethanol", "EtOH"],
    pubchemCid: 702,
    smiles: "CCO",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H319", text: "Causes serious eye irritation" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P233", text: "Keep container tightly closed." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1170",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "64-19-7",
    name: "Acetic acid",
    molecularFormula: "C2H4O2",
    molecularWeight: 60.05,
    synonyms: ["Ethanoic acid", "Glacial acetic acid", "HAc"],
    pubchemCid: 176,
    smiles: "CC(=O)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H226", text: "Flammable liquid and vapour" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS05"],
      unNumber: "UN2789",
      hazardClass: "8",
      packingGroup: "II",
    },
  },
  {
    casNumber: "75-09-2",
    name: "Dichloromethane",
    molecularFormula: "CH2Cl2",
    molecularWeight: 84.93,
    synonyms: ["Methylene chloride", "DCM", "Methylene dichloride"],
    pubchemCid: 6344,
    smiles: "C(Cl)Cl",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H315", text: "Causes skin irritation" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H335", text: "May cause respiratory irritation" },
        { code: "H351", text: "Suspected of causing cancer" },
      ],
      precautionaryStatements: [
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P308+P313", text: "IF exposed or concerned: Get medical advice/attention." },
      ],
      pictogramCodes: ["GHS07", "GHS08"],
      unNumber: "UN1593",
      hazardClass: "6.1",
      packingGroup: "III",
    },
  },
  {
    casNumber: "110-54-3",
    name: "Hexane",
    molecularFormula: "C6H14",
    molecularWeight: 86.18,
    synonyms: ["n-Hexane", "Normal hexane"],
    pubchemCid: 8058,
    smiles: "CCCCCC",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H304", text: "May be fatal if swallowed and enters airways" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
        { code: "H373", text: "May cause damage to organs through prolonged or repeated exposure" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS02", "GHS07", "GHS08"],
      unNumber: "UN1208",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "141-78-6",
    name: "Ethyl acetate",
    molecularFormula: "C4H8O2",
    molecularWeight: 88.11,
    synonyms: ["Acetic acid ethyl ester", "EtOAc", "Ethyl ethanoate"],
    pubchemCid: 8857,
    smiles: "CCOC(=O)C",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1173",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "7722-84-1",
    name: "Hydrogen peroxide",
    molecularFormula: "H2O2",
    molecularWeight: 34.01,
    synonyms: ["Dihydrogen dioxide", "Peroxide", "H2O2 30%"],
    pubchemCid: 784,
    smiles: "OO",
    notes: "Inventory seed uses 30% solution.",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H335", text: "May cause respiratory irritation" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
      ],
      pictogramCodes: ["GHS03", "GHS05", "GHS07"],
      unNumber: "UN2014",
      hazardClass: "5.1",
      packingGroup: "II",
    },
    sdsDocuments: sds("7722-84-1", "Hydrogen peroxide", [
      { supplier: "Merck", productCode: "107209", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "216763" },
    ]),
  },
  {
    casNumber: "7664-38-2",
    name: "Phosphoric acid",
    molecularFormula: "H3PO4",
    molecularWeight: 98.0,
    synonyms: ["Orthophosphoric acid", "Phosphoric (V) acid"],
    pubchemCid: 1004,
    smiles: "OP(=O)(O)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H290", text: "May be corrosive to metals" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe mist/vapours/spray." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS05"],
      hazardClass: "8",
      packingGroup: "III",
    },
  },
  {
    casNumber: "121-44-8",
    name: "Triethylamine",
    molecularFormula: "C6H15N",
    molecularWeight: 101.19,
    synonyms: ["TEA", "N,N-Diethylethanamine"],
    pubchemCid: 9471,
    smiles: "CCN(CC)CC",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H312", text: "Harmful in contact with skin" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H332", text: "Harmful if inhaled" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
      ],
      pictogramCodes: ["GHS02", "GHS05", "GHS07"],
      unNumber: "UN1296",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "76-05-1",
    name: "Trifluoroacetic acid",
    molecularFormula: "C2HF3O2",
    molecularWeight: 114.02,
    synonyms: ["TFA", "Trifluoroethanoic acid"],
    pubchemCid: 6422,
    smiles: "C(=O)(C(F)(F)F)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H332", text: "Harmful if inhaled" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe vapours." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P303+P361+P353", text: "IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water." },
      ],
      pictogramCodes: ["GHS05", "GHS07"],
      hazardClass: "8",
      packingGroup: "II",
    },
  },
  {
    casNumber: "7647-14-5",
    name: "Sodium chloride",
    molecularFormula: "NaCl",
    molecularWeight: 58.44,
    synonyms: ["Table salt", "Halite", "Common salt"],
    pubchemCid: 5234,
    smiles: "[Na+].[Cl-]",
    safety: {
      signalWord: "",
      hazardStatements: [],
      precautionaryStatements: [{ code: "P102", text: "Keep out of reach of children." }],
      pictogramCodes: [],
    },
  },
  {
    casNumber: "110-82-7",
    name: "Cyclohexane",
    molecularFormula: "C6H12",
    molecularWeight: 84.16,
    synonyms: ["Hexahydrobenzene", "Hexamethylene"],
    pubchemCid: 8078,
    smiles: "C1CCCCC1",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H304", text: "May be fatal if swallowed and enters airways" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1145",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "65-85-0",
    name: "Benzoic acid",
    molecularFormula: "C7H6O2",
    molecularWeight: 122.12,
    synonyms: ["Benzenecarboxylic acid", "Phenylformic acid"],
    pubchemCid: 243,
    smiles: "C1=CC=C(C=C1)C(=O)O",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H319", text: "Causes serious eye irritation" },
      ],
      precautionaryStatements: [
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P280", text: "Wear eye protection." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS07"],
    },
  },
  {
    casNumber: "26628-22-8",
    name: "Sodium azide",
    molecularFormula: "NaN3",
    molecularWeight: 65.01,
    synonyms: ["Sodium trinitride", "Smite", "NaN3"],
    pubchemCid: 33557,
    smiles: "[N-]=[N+]=[N-].[Na+]",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H300", text: "Fatal if swallowed" },
        { code: "H310", text: "Fatal in contact with skin" },
        { code: "H330", text: "Fatal if inhaled" },
        { code: "H373", text: "May cause damage to organs through prolonged or repeated exposure" },
        { code: "H410", text: "Very toxic to aquatic life with long lasting effects" },
      ],
      precautionaryStatements: [
        { code: "P260", text: "Do not breathe dust." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P301+P310", text: "IF SWALLOWED: Immediately call a POISON CENTER/doctor." },
      ],
      pictogramCodes: ["GHS06", "GHS09"],
      hazardClass: "6.1",
      packingGroup: "II",
    },
  },
  {
    casNumber: "631-61-8",
    name: "Ammonium acetate",
    molecularFormula: "C2H7NO2",
    molecularWeight: 77.08,
    synonyms: ["Acetic acid ammonium salt", "Spirit of Mindererus"],
    pubchemCid: 517165,
    smiles: "CC(=O)[O-].[NH4+]",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H319", text: "Causes serious eye irritation" },
      ],
      precautionaryStatements: [
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P280", text: "Wear eye protection." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS07"],
    },
  },
  {
    casNumber: "7757-79-1",
    name: "Potassium nitrate",
    molecularFormula: "KNO3",
    molecularWeight: 101.1,
    synonyms: ["Saltpeter", "Nitrate of potash", "KNO3"],
    pubchemCid: 24434,
    smiles: "[K+].[O-][N+](=O)[O-]",
    safety: {
      signalWord: "Warning",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H315", text: "Causes skin irritation" },
        { code: "H319", text: "Causes serious eye irritation" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P264", text: "Wash hands thoroughly after handling." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS03", "GHS07"],
      hazardClass: "5.1",
      packingGroup: "III",
    },
  },
  {
    casNumber: "67-64-1",
    name: "Acetone",
    molecularFormula: "C3H6O",
    molecularWeight: 58.08,
    synonyms: ["Propanone", "Dimethyl ketone", "2-Propanone"],
    pubchemCid: 180,
    smiles: "CC(=O)C",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H225", text: "Highly flammable liquid and vapour" },
        { code: "H319", text: "Causes serious eye irritation" },
        { code: "H336", text: "May cause drowsiness or dizziness" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P261", text: "Avoid breathing vapours." },
        { code: "P305+P351+P338", text: "IF IN EYES: Rinse cautiously with water for several minutes." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      unNumber: "UN1090",
      hazardClass: "3",
      packingGroup: "II",
    },
  },
  {
    casNumber: "7697-37-2",
    name: "Nitric acid",
    molecularFormula: "HNO3",
    molecularWeight: 63.01,
    synonyms: ["Aqua fortis", "Spirit of niter", "HNO3"],
    pubchemCid: 944,
    smiles: "[N+](=O)([O-])O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H290", text: "May be corrosive to metals" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H335", text: "May cause respiratory irritation" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P330+P331", text: "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting." },
      ],
      pictogramCodes: ["GHS03", "GHS05", "GHS07"],
      unNumber: "UN2031",
      hazardClass: "8",
      packingGroup: "II",
    },
    sdsDocuments: sds("7697-37-2", "Nitric acid", [
      { supplier: "Merck", productCode: "100441", isPrimary: true },
      { supplier: "Sigma-Aldrich", productCode: "438073" },
    ]),
  },
  {
    casNumber: "7722-64-7",
    name: "Potassium permanganate",
    molecularFormula: "KMnO4",
    molecularWeight: 158.03,
    synonyms: ["Permanganic acid potassium salt", "Condy's crystals"],
    pubchemCid: 516875,
    smiles: "[K+].[O-][Mn](=O)(=O)=O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H302", text: "Harmful if swallowed" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H410", text: "Very toxic to aquatic life with long lasting effects" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
        { code: "P301+P312", text: "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell." },
      ],
      pictogramCodes: ["GHS03", "GHS05", "GHS07", "GHS09"],
      hazardClass: "5.1",
      packingGroup: "II",
    },
  },
  {
    casNumber: "7439-95-4",
    name: "Magnesium",
    molecularFormula: "Mg",
    molecularWeight: 24.31,
    synonyms: ["Magnesium metal", "Mg turnings", "Magnesium ribbon"],
    pubchemCid: 5462224,
    smiles: "[Mg]",
    notes: "Reference for reactive metal / ICP standard material.",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H228", text: "Flammable solid" },
        { code: "H261", text: "In contact with water releases flammable gas" },
        { code: "H315", text: "Causes skin irritation" },
      ],
      precautionaryStatements: [
        { code: "P210", text: "Keep away from heat/sparks/open flames/hot surfaces. No smoking." },
        { code: "P223", text: "Do not allow contact with water." },
        { code: "P231+P232", text: "Handle under inert gas. Protect from moisture." },
      ],
      pictogramCodes: ["GHS02", "GHS07"],
      hazardClass: "4.3",
      packingGroup: "III",
    },
  },
  {
    casNumber: "7440-23-5",
    name: "Sodium",
    molecularFormula: "Na",
    molecularWeight: 22.99,
    synonyms: ["Sodium metal", "Na metal"],
    pubchemCid: 5360545,
    smiles: "[Na]",
    notes: "Reactive alkali metal — store under mineral oil.",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H261", text: "In contact with water releases flammable gas" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P223", text: "Do not allow contact with water." },
        { code: "P231+P232", text: "Handle under inert gas. Protect from moisture." },
      ],
      pictogramCodes: ["GHS02", "GHS05"],
      hazardClass: "4.3",
      packingGroup: "I",
    },
  },
  {
    casNumber: "7601-90-3",
    name: "Perchloric acid",
    molecularFormula: "HClO4",
    molecularWeight: 100.46,
    synonyms: ["Hyperchloric acid"],
    pubchemCid: 24257,
    smiles: "O[Cl+3]([O-])(=O)=O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      pictogramCodes: ["GHS03", "GHS05"],
      hazardClass: "5.1",
      packingGroup: "II",
    },
  },
  {
    casNumber: "7732-88-5",
    name: "Chromic acid",
    molecularFormula: "H2CrO4",
    molecularWeight: 118.01,
    synonyms: ["Chromium(VI) acid"],
    pubchemCid: 24425,
    smiles: "O[Cr](=O)(=O)O",
    safety: {
      signalWord: "Danger",
      hazardStatements: [
        { code: "H272", text: "May intensify fire; oxidizer" },
        { code: "H314", text: "Causes severe skin burns and eye damage" },
        { code: "H350", text: "May cause cancer" },
      ],
      precautionaryStatements: [
        { code: "P220", text: "Keep away from clothing and other combustible materials." },
        { code: "P280", text: "Wear protective gloves/protective clothing/eye protection/face protection." },
      ],
      pictogramCodes: ["GHS03", "GHS05", "GHS08"],
      hazardClass: "5.1",
      packingGroup: "II",
    },
  },
];
