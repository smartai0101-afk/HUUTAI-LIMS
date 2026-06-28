export type GhsPictogramSeed = {
  code: string;
  label: string;
  imagePath: string;
  description: string;
};

export const GHS_PICTOGRAM_SEED: GhsPictogramSeed[] = [
  {
    code: "GHS01",
    label: "Explosive",
    imagePath: "/ghs/GHS01.svg",
    description: "Explosives; self-reactive substances and mixtures; organic peroxides",
  },
  {
    code: "GHS02",
    label: "Flammable",
    imagePath: "/ghs/GHS02.svg",
    description: "Flammable gases, aerosols, liquids and solids; pyrophoric liquids and solids",
  },
  {
    code: "GHS03",
    label: "Oxidizing",
    imagePath: "/ghs/GHS03.svg",
    description: "Oxidizing gases, liquids and solids",
  },
  {
    code: "GHS04",
    label: "Compressed gas",
    imagePath: "/ghs/GHS04.svg",
    description: "Gases under pressure; refrigerated liquefied gases",
  },
  {
    code: "GHS05",
    label: "Corrosive",
    imagePath: "/ghs/GHS05.svg",
    description: "Corrosive to metals; skin corrosion or serious eye damage",
  },
  {
    code: "GHS06",
    label: "Acute toxicity",
    imagePath: "/ghs/GHS06.svg",
    description: "Acute toxicity (fatal or toxic if swallowed, in contact with skin or inhaled)",
  },
  {
    code: "GHS07",
    label: "Harmful / irritant",
    imagePath: "/ghs/GHS07.svg",
    description: "Harmful, irritant, skin or eye irritation, sensitization, narcotic effects",
  },
  {
    code: "GHS08",
    label: "Health hazard",
    imagePath: "/ghs/GHS08.svg",
    description: "Carcinogenicity, mutagenicity, reproductive toxicity, STOT, aspiration hazard",
  },
  {
    code: "GHS09",
    label: "Environmental hazard",
    imagePath: "/ghs/GHS09.svg",
    description: "Hazardous to the aquatic environment (acute or chronic)",
  },
];
