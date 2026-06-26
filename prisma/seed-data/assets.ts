/** Static seed asset paths (committed under public/seed-assets/). */
export const SEED_ASSETS = {
  chemicals: {
    coaMethanol: "/seed-assets/chemicals/coa-methanol.jpg",
    bottleAcetonitrile: "/seed-assets/chemicals/bottle-acetonitrile.jpg",
    shelfAcids: "/seed-assets/chemicals/shelf-acids.jpg",
    labelBuffer: "/seed-assets/chemicals/label-buffer.jpg",
  },
  standards: {
    crmVial: "/seed-assets/standards/crm-vial-1.jpg",
    crmCert: "/seed-assets/standards/crm-cert.jpg",
    rmNacl: "/seed-assets/standards/rm-nacl.jpg",
    workingGas: "/seed-assets/standards/working-gas.jpg",
  },
  strains: {
    petriEcoli: "/seed-assets/strains/petri-ecoli.jpg",
    glycerolStock: "/seed-assets/strains/glycerol-stock.jpg",
    incubator: "/seed-assets/strains/incubator.jpg",
    strainLabel: "/seed-assets/strains/strain-label.jpg",
  },
  equipment: {
    hplc: "/seed-assets/equipment/hplc-agilent.jpg",
    uvVis: "/seed-assets/equipment/uv-vis.jpg",
    balance: "/seed-assets/equipment/balance.jpg",
    maintenance: "/seed-assets/equipment/maintenance.jpg",
  },
  coaPdf: "/uploads/coa/1781963586843-c73223e19007fc4f.pdf",
} as const;

export const CHEMICAL_COA_PATHS = [
  SEED_ASSETS.chemicals.coaMethanol,
  SEED_ASSETS.chemicals.bottleAcetonitrile,
  SEED_ASSETS.chemicals.shelfAcids,
  SEED_ASSETS.chemicals.labelBuffer,
];

export const STANDARD_COA_PATHS = [
  SEED_ASSETS.standards.crmVial,
  SEED_ASSETS.standards.crmCert,
  SEED_ASSETS.standards.rmNacl,
  SEED_ASSETS.standards.workingGas,
  SEED_ASSETS.coaPdf,
];

export const STRAIN_COA_PATHS = [
  SEED_ASSETS.strains.petriEcoli,
  SEED_ASSETS.strains.glycerolStock,
  SEED_ASSETS.strains.incubator,
  SEED_ASSETS.strains.strainLabel,
];
