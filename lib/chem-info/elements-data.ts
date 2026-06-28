export type ElementSeedRow = {
  symbol: string;
  name: string;
  nameVi?: string;
  atomicNumber: number;
  atomicMass: number;
  group: number | null;
  period: number;
  block: string;
  classification: string;
  electronConfig: string;
  electronegativity: number | null;
  meltingPointC: number | null;
  boilingPointC: number | null;
  applications?: string[];
};

export const ELEMENT_SEED: ElementSeedRow[] = [
  { symbol: "H", name: "Hydrogen", nameVi: "Hiđro", atomicNumber: 1, atomicMass: 1.008, group: 1, period: 1, block: "s", classification: "nonmetal", electronConfig: "1s1", electronegativity: 2.2, meltingPointC: -259.16, boilingPointC: -252.87 },
  { symbol: "He", name: "Helium", nameVi: "Heli", atomicNumber: 2, atomicMass: 4.003, group: 18, period: 1, block: "s", classification: "noble gas", electronConfig: "1s2", electronegativity: null, meltingPointC: -272.2, boilingPointC: -268.93 },
  { symbol: "Li", name: "Lithium", nameVi: "Liti", atomicNumber: 3, atomicMass: 6.94, group: 1, period: 2, block: "s", classification: "alkali metal", electronConfig: "[He] 2s1", electronegativity: 0.98, meltingPointC: 180.5, boilingPointC: 1342 },
  { symbol: "Be", name: "Beryllium", atomicNumber: 4, atomicMass: 9.012, group: 2, period: 2, block: "s", classification: "alkaline earth metal", electronConfig: "[He] 2s2", electronegativity: 1.57, meltingPointC: 1287, boilingPointC: 2470 },
  { symbol: "B", name: "Boron", nameVi: "Bo", atomicNumber: 5, atomicMass: 10.81, group: 13, period: 2, block: "p", classification: "metalloid", electronConfig: "[He] 2s2 2p1", electronegativity: 2.04, meltingPointC: 2075, boilingPointC: 4000 },
  { symbol: "C", name: "Carbon", nameVi: "Cacbon", atomicNumber: 6, atomicMass: 12.011, group: 14, period: 2, block: "p", classification: "nonmetal", electronConfig: "[He] 2s2 2p2", electronegativity: 2.55, meltingPointC: 3550, boilingPointC: 4827 },
  { symbol: "N", name: "Nitrogen", nameVi: "Nitơ", atomicNumber: 7, atomicMass: 14.007, group: 15, period: 2, block: "p", classification: "nonmetal", electronConfig: "[He] 2s2 2p3", electronegativity: 3.04, meltingPointC: -210.1, boilingPointC: -195.79 },
  { symbol: "O", name: "Oxygen", nameVi: "Oxy", atomicNumber: 8, atomicMass: 15.999, group: 16, period: 2, block: "p", classification: "nonmetal", electronConfig: "[He] 2s2 2p4", electronegativity: 3.44, meltingPointC: -218.79, boilingPointC: -182.95 },
  { symbol: "F", name: "Fluorine", nameVi: "Flo", atomicNumber: 9, atomicMass: 18.998, group: 17, period: 2, block: "p", classification: "halogen", electronConfig: "[He] 2s2 2p5", electronegativity: 3.98, meltingPointC: -219.67, boilingPointC: -188.12 },
  { symbol: "Ne", name: "Neon", nameVi: "Neon", atomicNumber: 10, atomicMass: 20.18, group: 18, period: 2, block: "p", classification: "noble gas", electronConfig: "[He] 2s2 2p6", electronegativity: null, meltingPointC: -248.59, boilingPointC: -246.08 },
  { symbol: "Na", name: "Sodium", nameVi: "Natri", atomicNumber: 11, atomicMass: 22.99, group: 1, period: 3, block: "s", classification: "alkali metal", electronConfig: "[Ne] 3s1", electronegativity: 0.93, meltingPointC: 97.72, boilingPointC: 883 },
  { symbol: "Mg", name: "Magnesium", nameVi: "Magiê", atomicNumber: 12, atomicMass: 24.305, group: 2, period: 3, block: "s", classification: "alkaline earth metal", electronConfig: "[Ne] 3s2", electronegativity: 1.31, meltingPointC: 650, boilingPointC: 1090 },
  { symbol: "Al", name: "Aluminium", nameVi: "Nhôm", atomicNumber: 13, atomicMass: 26.982, group: 13, period: 3, block: "p", classification: "post-transition metal", electronConfig: "[Ne] 3s2 3p1", electronegativity: 1.61, meltingPointC: 660.3, boilingPointC: 2519 },
  { symbol: "Si", name: "Silicon", nameVi: "Silic", atomicNumber: 14, atomicMass: 28.085, group: 14, period: 3, block: "p", classification: "metalloid", electronConfig: "[Ne] 3s2 3p2", electronegativity: 1.9, meltingPointC: 1414, boilingPointC: 3265 },
  { symbol: "P", name: "Phosphorus", nameVi: "Photpho", atomicNumber: 15, atomicMass: 30.974, group: 15, period: 3, block: "p", classification: "nonmetal", electronConfig: "[Ne] 3s2 3p3", electronegativity: 2.19, meltingPointC: 44.15, boilingPointC: 280.5 },
  { symbol: "S", name: "Sulfur", nameVi: "Lưu huỳnh", atomicNumber: 16, atomicMass: 32.06, group: 16, period: 3, block: "p", classification: "nonmetal", electronConfig: "[Ne] 3s2 3p4", electronegativity: 2.58, meltingPointC: 115.21, boilingPointC: 444.6 },
  { symbol: "Cl", name: "Chlorine", nameVi: "Clo", atomicNumber: 17, atomicMass: 35.45, group: 17, period: 3, block: "p", classification: "halogen", electronConfig: "[Ne] 3s2 3p5", electronegativity: 3.16, meltingPointC: -101.5, boilingPointC: -34.04 },
  { symbol: "Ar", name: "Argon", nameVi: "Argon", atomicNumber: 18, atomicMass: 39.948, group: 18, period: 3, block: "p", classification: "noble gas", electronConfig: "[Ne] 3s2 3p6", electronegativity: null, meltingPointC: -189.34, boilingPointC: -185.85 },
  { symbol: "K", name: "Potassium", nameVi: "Kali", atomicNumber: 19, atomicMass: 39.098, group: 1, period: 4, block: "s", classification: "alkali metal", electronConfig: "[Ar] 4s1", electronegativity: 0.82, meltingPointC: 63.5, boilingPointC: 759 },
  { symbol: "Ca", name: "Calcium", nameVi: "Canxi", atomicNumber: 20, atomicMass: 40.078, group: 2, period: 4, block: "s", classification: "alkaline earth metal", electronConfig: "[Ar] 4s2", electronegativity: 1, meltingPointC: 842, boilingPointC: 1484 },
  { symbol: "Sc", name: "Scandium", atomicNumber: 21, atomicMass: 44.956, group: 3, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d1 4s2", electronegativity: 1.36, meltingPointC: 1541, boilingPointC: 2830 },
  { symbol: "Ti", name: "Titanium", nameVi: "Titani", atomicNumber: 22, atomicMass: 47.867, group: 4, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d2 4s2", electronegativity: 1.54, meltingPointC: 1668, boilingPointC: 3287 },
  { symbol: "V", name: "Vanadium", nameVi: "Vanadi", atomicNumber: 23, atomicMass: 50.942, group: 5, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d3 4s2", electronegativity: 1.63, meltingPointC: 1910, boilingPointC: 3407 },
  { symbol: "Cr", name: "Chromium", nameVi: "Crom", atomicNumber: 24, atomicMass: 51.996, group: 6, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d5 4s1", electronegativity: 1.66, meltingPointC: 1907, boilingPointC: 2671 },
  { symbol: "Mn", name: "Manganese", nameVi: "Mangan", atomicNumber: 25, atomicMass: 54.938, group: 7, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d5 4s2", electronegativity: 1.55, meltingPointC: 1246, boilingPointC: 2061 },
  { symbol: "Fe", name: "Iron", nameVi: "Sắt", atomicNumber: 26, atomicMass: 55.845, group: 8, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d6 4s2", electronegativity: 1.83, meltingPointC: 1538, boilingPointC: 2862 },
  { symbol: "Co", name: "Cobalt", nameVi: "Coban", atomicNumber: 27, atomicMass: 58.933, group: 9, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d7 4s2", electronegativity: 1.88, meltingPointC: 1495, boilingPointC: 2927 },
  { symbol: "Ni", name: "Nickel", nameVi: "Niken", atomicNumber: 28, atomicMass: 58.693, group: 10, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d8 4s2", electronegativity: 1.91, meltingPointC: 1455, boilingPointC: 2913 },
  { symbol: "Cu", name: "Copper", nameVi: "Đồng", atomicNumber: 29, atomicMass: 63.546, group: 11, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d10 4s1", electronegativity: 1.9, meltingPointC: 1084.6, boilingPointC: 2562 },
  { symbol: "Zn", name: "Zinc", nameVi: "Kẽm", atomicNumber: 30, atomicMass: 65.38, group: 12, period: 4, block: "d", classification: "transition metal", electronConfig: "[Ar] 3d10 4s2", electronegativity: 1.65, meltingPointC: 419.5, boilingPointC: 907 },
  { symbol: "Ga", name: "Gallium", nameVi: "Gali", atomicNumber: 31, atomicMass: 69.723, group: 13, period: 4, block: "p", classification: "post-transition metal", electronConfig: "[Ar] 3d10 4s2 4p1", electronegativity: 1.81, meltingPointC: 29.76, boilingPointC: 2400 },
  { symbol: "Ge", name: "Germanium", nameVi: "Gecmani", atomicNumber: 32, atomicMass: 72.63, group: 14, period: 4, block: "p", classification: "metalloid", electronConfig: "[Ar] 3d10 4s2 4p2", electronegativity: 2.01, meltingPointC: 938.3, boilingPointC: 2833 },
  { symbol: "As", name: "Arsenic", nameVi: "Asen", atomicNumber: 33, atomicMass: 74.922, group: 15, period: 4, block: "p", classification: "metalloid", electronConfig: "[Ar] 3d10 4s2 4p3", electronegativity: 2.18, meltingPointC: 817, boilingPointC: 614 },
  { symbol: "Se", name: "Selenium", nameVi: "Seleni", atomicNumber: 34, atomicMass: 78.971, group: 16, period: 4, block: "p", classification: "nonmetal", electronConfig: "[Ar] 3d10 4s2 4p4", electronegativity: 2.55, meltingPointC: 221, boilingPointC: 685 },
  { symbol: "Br", name: "Bromine", nameVi: "Brom", atomicNumber: 35, atomicMass: 79.904, group: 17, period: 4, block: "p", classification: "halogen", electronConfig: "[Ar] 3d10 4s2 4p5", electronegativity: 2.96, meltingPointC: -7.2, boilingPointC: 58.8 },
  { symbol: "Kr", name: "Krypton", nameVi: "Krypton", atomicNumber: 36, atomicMass: 83.798, group: 18, period: 4, block: "p", classification: "noble gas", electronConfig: "[Ar] 3d10 4s2 4p6", electronegativity: 3, meltingPointC: -157.36, boilingPointC: -153.22 },
  { symbol: "Rb", name: "Rubidium", nameVi: "Rubidi", atomicNumber: 37, atomicMass: 85.468, group: 1, period: 5, block: "s", classification: "alkali metal", electronConfig: "[Kr] 5s1", electronegativity: 0.82, meltingPointC: 39.31, boilingPointC: 688 },
  { symbol: "Sr", name: "Strontium", nameVi: "Stronti", atomicNumber: 38, atomicMass: 87.62, group: 2, period: 5, block: "s", classification: "alkaline earth metal", electronConfig: "[Kr] 5s2", electronegativity: 0.95, meltingPointC: 777, boilingPointC: 1382 },
  { symbol: "Y", name: "Yttrium", nameVi: "Itri", atomicNumber: 39, atomicMass: 88.906, group: 3, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d1 5s2", electronegativity: 1.22, meltingPointC: 1526, boilingPointC: 3345 },
  { symbol: "Zr", name: "Zirconium", nameVi: "Zirconi", atomicNumber: 40, atomicMass: 91.224, group: 4, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d2 5s2", electronegativity: 1.33, meltingPointC: 1855, boilingPointC: 4409 },
  { symbol: "Nb", name: "Niobium", nameVi: "Niob", atomicNumber: 41, atomicMass: 92.906, group: 5, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d4 5s1", electronegativity: 1.6, meltingPointC: 2477, boilingPointC: 4744 },
  { symbol: "Mo", name: "Molybdenum", nameVi: "Molipden", atomicNumber: 42, atomicMass: 95.95, group: 6, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d5 5s1", electronegativity: 2.16, meltingPointC: 2623, boilingPointC: 4639 },
  { symbol: "Tc", name: "Technetium", atomicNumber: 43, atomicMass: 98, group: 7, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d5 5s2", electronegativity: 1.9, meltingPointC: 2157, boilingPointC: 4265 },
  { symbol: "Ru", name: "Ruthenium", nameVi: "Ruteni", atomicNumber: 44, atomicMass: 101.07, group: 8, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d7 5s1", electronegativity: 2.2, meltingPointC: 2334, boilingPointC: 4150 },
  { symbol: "Rh", name: "Rhodium", nameVi: "Rod", atomicNumber: 45, atomicMass: 102.91, group: 9, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d8 5s1", electronegativity: 2.28, meltingPointC: 1964, boilingPointC: 3695 },
  { symbol: "Pd", name: "Palladium", nameVi: "Paladi", atomicNumber: 46, atomicMass: 106.42, group: 10, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d10", electronegativity: 2.2, meltingPointC: 1554.9, boilingPointC: 2963 },
  { symbol: "Ag", name: "Silver", nameVi: "Bạc", atomicNumber: 47, atomicMass: 107.87, group: 11, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d10 5s1", electronegativity: 1.93, meltingPointC: 961.8, boilingPointC: 2162 },
  { symbol: "Cd", name: "Cadmium", nameVi: "Cadimi", atomicNumber: 48, atomicMass: 112.41, group: 12, period: 5, block: "d", classification: "transition metal", electronConfig: "[Kr] 4d10 5s2", electronegativity: 1.69, meltingPointC: 321.07, boilingPointC: 767 },
  { symbol: "In", name: "Indium", nameVi: "Indi", atomicNumber: 49, atomicMass: 114.82, group: 13, period: 5, block: "p", classification: "post-transition metal", electronConfig: "[Kr] 4d10 5s2 5p1", electronegativity: 1.78, meltingPointC: 156.6, boilingPointC: 2072 },
  { symbol: "Sn", name: "Tin", nameVi: "Thiếc", atomicNumber: 50, atomicMass: 118.71, group: 14, period: 5, block: "p", classification: "post-transition metal", electronConfig: "[Kr] 4d10 5s2 5p2", electronegativity: 1.96, meltingPointC: 231.9, boilingPointC: 2602 },
  { symbol: "Sb", name: "Antimony", nameVi: "Antimon", atomicNumber: 51, atomicMass: 121.76, group: 15, period: 5, block: "p", classification: "metalloid", electronConfig: "[Kr] 4d10 5s2 5p3", electronegativity: 2.05, meltingPointC: 630.6, boilingPointC: 1587 },
  { symbol: "Te", name: "Tellurium", nameVi: "Telu", atomicNumber: 52, atomicMass: 127.6, group: 16, period: 5, block: "p", classification: "metalloid", electronConfig: "[Kr] 4d10 5s2 5p4", electronegativity: 2.1, meltingPointC: 449.5, boilingPointC: 988 },
  { symbol: "I", name: "Iodine", nameVi: "Iot", atomicNumber: 53, atomicMass: 126.9, group: 17, period: 5, block: "p", classification: "halogen", electronConfig: "[Kr] 4d10 5s2 5p5", electronegativity: 2.66, meltingPointC: 113.7, boilingPointC: 184.3 },
  { symbol: "Xe", name: "Xenon", nameVi: "Xenon", atomicNumber: 54, atomicMass: 131.29, group: 18, period: 5, block: "p", classification: "noble gas", electronConfig: "[Kr] 4d10 5s2 5p6", electronegativity: 2.6, meltingPointC: -111.8, boilingPointC: -108.1 },
  { symbol: "Cs", name: "Caesium", nameVi: "Xesi", atomicNumber: 55, atomicMass: 132.91, group: 1, period: 6, block: "s", classification: "alkali metal", electronConfig: "[Xe] 6s1", electronegativity: 0.79, meltingPointC: 28.44, boilingPointC: 671 },
  { symbol: "Ba", name: "Barium", nameVi: "Bari", atomicNumber: 56, atomicMass: 137.33, group: 2, period: 6, block: "s", classification: "alkaline earth metal", electronConfig: "[Xe] 6s2", electronegativity: 0.89, meltingPointC: 727, boilingPointC: 1897 },
  { symbol: "La", name: "Lanthanum", nameVi: "Lantan", atomicNumber: 57, atomicMass: 138.91, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 5d1 6s2", electronegativity: 1.1, meltingPointC: 920, boilingPointC: 3464 },
  { symbol: "Ce", name: "Cerium", nameVi: "Cer", atomicNumber: 58, atomicMass: 140.12, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f1 5d1 6s2", electronegativity: 1.12, meltingPointC: 795, boilingPointC: 3443 },
  { symbol: "Pr", name: "Praseodymium", atomicNumber: 59, atomicMass: 140.91, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f3 6s2", electronegativity: 1.13, meltingPointC: 931, boilingPointC: 3520 },
  { symbol: "Nd", name: "Neodymium", nameVi: "Neodim", atomicNumber: 60, atomicMass: 144.24, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f4 6s2", electronegativity: 1.14, meltingPointC: 1021, boilingPointC: 3074 },
  { symbol: "Pm", name: "Promethium", atomicNumber: 61, atomicMass: 145, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f5 6s2", electronegativity: 1.13, meltingPointC: 1042, boilingPointC: 3000 },
  { symbol: "Sm", name: "Samarium", nameVi: "Samari", atomicNumber: 62, atomicMass: 150.36, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f6 6s2", electronegativity: 1.17, meltingPointC: 1072, boilingPointC: 1794 },
  { symbol: "Eu", name: "Europium", nameVi: "Europi", atomicNumber: 63, atomicMass: 151.96, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f7 6s2", electronegativity: 1.2, meltingPointC: 822, boilingPointC: 1527 },
  { symbol: "Gd", name: "Gadolinium", nameVi: "Gadolini", atomicNumber: 64, atomicMass: 157.25, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f7 5d1 6s2", electronegativity: 1.2, meltingPointC: 1313, boilingPointC: 3273 },
  { symbol: "Tb", name: "Terbium", nameVi: "Terbi", atomicNumber: 65, atomicMass: 158.93, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f9 6s2", electronegativity: 1.2, meltingPointC: 1356, boilingPointC: 3230 },
  { symbol: "Dy", name: "Dysprosium", nameVi: "Disprozi", atomicNumber: 66, atomicMass: 162.5, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f10 6s2", electronegativity: 1.22, meltingPointC: 1412, boilingPointC: 2567 },
  { symbol: "Ho", name: "Holmium", nameVi: "Holmi", atomicNumber: 67, atomicMass: 164.93, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f11 6s2", electronegativity: 1.23, meltingPointC: 1474, boilingPointC: 2700 },
  { symbol: "Er", name: "Erbium", nameVi: "Erb", atomicNumber: 68, atomicMass: 167.26, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f12 6s2", electronegativity: 1.24, meltingPointC: 1529, boilingPointC: 2868 },
  { symbol: "Tm", name: "Thulium", nameVi: "Tuli", atomicNumber: 69, atomicMass: 168.93, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f13 6s2", electronegativity: 1.25, meltingPointC: 1545, boilingPointC: 1950 },
  { symbol: "Yb", name: "Ytterbium", nameVi: "Iterbi", atomicNumber: 70, atomicMass: 173.05, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f14 6s2", electronegativity: 1.1, meltingPointC: 819, boilingPointC: 1196 },
  { symbol: "Lu", name: "Lutetium", nameVi: "Luteti", atomicNumber: 71, atomicMass: 174.97, group: null, period: 6, block: "f", classification: "lanthanide", electronConfig: "[Xe] 4f14 5d1 6s2", electronegativity: 1.27, meltingPointC: 1663, boilingPointC: 3402 },
  { symbol: "Hf", name: "Hafnium", nameVi: "Hafni", atomicNumber: 72, atomicMass: 178.49, group: 4, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d2 6s2", electronegativity: 1.3, meltingPointC: 2233, boilingPointC: 4603 },
  { symbol: "Ta", name: "Tantalum", nameVi: "Tantan", atomicNumber: 73, atomicMass: 180.95, group: 5, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d3 6s2", electronegativity: 1.5, meltingPointC: 3017, boilingPointC: 5458 },
  { symbol: "W", name: "Tungsten", nameVi: "Vonfram", atomicNumber: 74, atomicMass: 183.84, group: 6, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d4 6s2", electronegativity: 2.36, meltingPointC: 3422, boilingPointC: 5555 },
  { symbol: "Re", name: "Rhenium", nameVi: "Reni", atomicNumber: 75, atomicMass: 186.21, group: 7, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d5 6s2", electronegativity: 1.9, meltingPointC: 3186, boilingPointC: 5596 },
  { symbol: "Os", name: "Osmium", nameVi: "Osmi", atomicNumber: 76, atomicMass: 190.23, group: 8, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d6 6s2", electronegativity: 2.2, meltingPointC: 3033, boilingPointC: 5012 },
  { symbol: "Ir", name: "Iridium", nameVi: "Irid", atomicNumber: 77, atomicMass: 192.22, group: 9, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d7 6s2", electronegativity: 2.2, meltingPointC: 2466, boilingPointC: 4428 },
  { symbol: "Pt", name: "Platinum", nameVi: "Platin", atomicNumber: 78, atomicMass: 195.08, group: 10, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d9 6s1", electronegativity: 2.28, meltingPointC: 1768.3, boilingPointC: 3825 },
  { symbol: "Au", name: "Gold", nameVi: "Vàng", atomicNumber: 79, atomicMass: 196.97, group: 11, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d10 6s1", electronegativity: 2.54, meltingPointC: 1064.2, boilingPointC: 2856 },
  { symbol: "Hg", name: "Mercury", nameVi: "Thủy ngân", atomicNumber: 80, atomicMass: 200.59, group: 12, period: 6, block: "d", classification: "transition metal", electronConfig: "[Xe] 4f14 5d10 6s2", electronegativity: 2, meltingPointC: -38.83, boilingPointC: 356.73 },
  { symbol: "Tl", name: "Thallium", nameVi: "Tali", atomicNumber: 81, atomicMass: 204.38, group: 13, period: 6, block: "p", classification: "post-transition metal", electronConfig: "[Xe] 4f14 5d10 6s2 6p1", electronegativity: 1.62, meltingPointC: 304, boilingPointC: 1473 },
  { symbol: "Pb", name: "Lead", nameVi: "Chì", atomicNumber: 82, atomicMass: 207.2, group: 14, period: 6, block: "p", classification: "post-transition metal", electronConfig: "[Xe] 4f14 5d10 6s2 6p2", electronegativity: 1.87, meltingPointC: 327.5, boilingPointC: 1749 },
  { symbol: "Bi", name: "Bismuth", nameVi: "Bitmut", atomicNumber: 83, atomicMass: 208.98, group: 15, period: 6, block: "p", classification: "post-transition metal", electronConfig: "[Xe] 4f14 5d10 6s2 6p3", electronegativity: 2.02, meltingPointC: 271.4, boilingPointC: 1564 },
  { symbol: "Po", name: "Polonium", nameVi: "Poloni", atomicNumber: 84, atomicMass: 209, group: 16, period: 6, block: "p", classification: "metalloid", electronConfig: "[Xe] 4f14 5d10 6s2 6p4", electronegativity: 2, meltingPointC: 254, boilingPointC: 962 },
  { symbol: "At", name: "Astatine", nameVi: "Astatin", atomicNumber: 85, atomicMass: 210, group: 17, period: 6, block: "p", classification: "halogen", electronConfig: "[Xe] 4f14 5d10 6s2 6p5", electronegativity: 2.2, meltingPointC: 302, boilingPointC: 337 },
  { symbol: "Rn", name: "Radon", nameVi: "Radon", atomicNumber: 86, atomicMass: 222, group: 18, period: 6, block: "p", classification: "noble gas", electronConfig: "[Xe] 4f14 5d10 6s2 6p6", electronegativity: 2.2, meltingPointC: -71, boilingPointC: -61.7 },
  { symbol: "Fr", name: "Francium", nameVi: "Franxi", atomicNumber: 87, atomicMass: 223, group: 1, period: 7, block: "s", classification: "alkali metal", electronConfig: "[Rn] 7s1", electronegativity: 0.7, meltingPointC: 27, boilingPointC: 677 },
  { symbol: "Ra", name: "Radium", nameVi: "Radi", atomicNumber: 88, atomicMass: 226, group: 2, period: 7, block: "s", classification: "alkaline earth metal", electronConfig: "[Rn] 7s2", electronegativity: 0.9, meltingPointC: 700, boilingPointC: 1737 },
  { symbol: "Ac", name: "Actinium", nameVi: "Actini", atomicNumber: 89, atomicMass: 227, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 6d1 7s2", electronegativity: 1.1, meltingPointC: 1050, boilingPointC: 3200 },
  { symbol: "Th", name: "Thorium", nameVi: "Thori", atomicNumber: 90, atomicMass: 232.04, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 6d2 7s2", electronegativity: 1.3, meltingPointC: 1750, boilingPointC: 4788 },
  { symbol: "Pa", name: "Protactinium", atomicNumber: 91, atomicMass: 231.04, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f2 6d1 7s2", electronegativity: 1.5, meltingPointC: 1572, boilingPointC: 4000 },
  { symbol: "U", name: "Uranium", nameVi: "Urani", atomicNumber: 92, atomicMass: 238.03, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f3 6d1 7s2", electronegativity: 1.38, meltingPointC: 1135, boilingPointC: 4131 },
  { symbol: "Np", name: "Neptunium", nameVi: "Neptuni", atomicNumber: 93, atomicMass: 237, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f4 6d1 7s2", electronegativity: 1.36, meltingPointC: 644, boilingPointC: 3902 },
  { symbol: "Pu", name: "Plutonium", nameVi: "Plutoni", atomicNumber: 94, atomicMass: 244, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f6 7s2", electronegativity: 1.28, meltingPointC: 640, boilingPointC: 3228 },
  { symbol: "Am", name: "Americium", nameVi: "Americi", atomicNumber: 95, atomicMass: 243, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f7 7s2", electronegativity: 1.3, meltingPointC: 1176, boilingPointC: 2607 },
  { symbol: "Cm", name: "Curium", nameVi: "Curi", atomicNumber: 96, atomicMass: 247, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f7 6d1 7s2", electronegativity: 1.3, meltingPointC: 1345, boilingPointC: 3110 },
  { symbol: "Bk", name: "Berkelium", nameVi: "Berkeli", atomicNumber: 97, atomicMass: 247, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f9 7s2", electronegativity: 1.3, meltingPointC: 986, boilingPointC: null },
  { symbol: "Cf", name: "Californium", nameVi: "Californi", atomicNumber: 98, atomicMass: 251, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f10 7s2", electronegativity: 1.3, meltingPointC: 900, boilingPointC: 1470 },
  { symbol: "Es", name: "Einsteinium", nameVi: "Einsteini", atomicNumber: 99, atomicMass: 252, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f11 7s2", electronegativity: 1.3, meltingPointC: 860, boilingPointC: null },
  { symbol: "Fm", name: "Fermium", nameVi: "Fermi", atomicNumber: 100, atomicMass: 257, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f12 7s2", electronegativity: 1.3, meltingPointC: 1527, boilingPointC: null },
  { symbol: "Md", name: "Mendelevium", nameVi: "Mendelevi", atomicNumber: 101, atomicMass: 258, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f13 7s2", electronegativity: 1.3, meltingPointC: 827, boilingPointC: null },
  { symbol: "No", name: "Nobelium", nameVi: "Nobeli", atomicNumber: 102, atomicMass: 259, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f14 7s2", electronegativity: 1.3, meltingPointC: 827, boilingPointC: null },
  { symbol: "Lr", name: "Lawrencium", nameVi: "Lawrenci", atomicNumber: 103, atomicMass: 266, group: null, period: 7, block: "f", classification: "actinide", electronConfig: "[Rn] 5f14 7s2 7p1", electronegativity: 1.3, meltingPointC: 1627, boilingPointC: null },
  { symbol: "Rf", name: "Rutherfordium", atomicNumber: 104, atomicMass: 267, group: 4, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d2 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Db", name: "Dubnium", atomicNumber: 105, atomicMass: 268, group: 5, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d3 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Sg", name: "Seaborgium", atomicNumber: 106, atomicMass: 269, group: 6, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d4 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Bh", name: "Bohrium", atomicNumber: 107, atomicMass: 270, group: 7, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d5 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Hs", name: "Hassium", atomicNumber: 108, atomicMass: 269, group: 8, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d6 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Mt", name: "Meitnerium", atomicNumber: 109, atomicMass: 278, group: 9, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d7 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Ds", name: "Darmstadtium", atomicNumber: 110, atomicMass: 281, group: 10, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d8 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Rg", name: "Roentgenium", atomicNumber: 111, atomicMass: 282, group: 11, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d9 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Cn", name: "Copernicium", atomicNumber: 112, atomicMass: 285, group: 12, period: 7, block: "d", classification: "transition metal", electronConfig: "[Rn] 5f14 6d10 7s2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Nh", name: "Nihonium", atomicNumber: 113, atomicMass: 286, group: 13, period: 7, block: "p", classification: "post-transition metal", electronConfig: "[Rn] 5f14 6d10 7s2 7p1", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Fl", name: "Flerovium", atomicNumber: 114, atomicMass: 289, group: 14, period: 7, block: "p", classification: "post-transition metal", electronConfig: "[Rn] 5f14 6d10 7s2 7p2", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Mc", name: "Moscovium", atomicNumber: 115, atomicMass: 290, group: 15, period: 7, block: "p", classification: "post-transition metal", electronConfig: "[Rn] 5f14 6d10 7s2 7p3", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Lv", name: "Livermorium", atomicNumber: 116, atomicMass: 293, group: 16, period: 7, block: "p", classification: "post-transition metal", electronConfig: "[Rn] 5f14 6d10 7s2 7p4", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Ts", name: "Tennessine", atomicNumber: 117, atomicMass: 294, group: 17, period: 7, block: "p", classification: "halogen", electronConfig: "[Rn] 5f14 6d10 7s2 7p5", electronegativity: null, meltingPointC: null, boilingPointC: null },
  { symbol: "Og", name: "Oganesson", atomicNumber: 118, atomicMass: 294, group: 18, period: 7, block: "p", classification: "noble gas", electronConfig: "[Rn] 5f14 6d10 7s2 7p6", electronegativity: null, meltingPointC: null, boilingPointC: null },
];

export const ELEMENT_APPLICATIONS: Partial<Record<string, string[]>> = {
  H: ["Fuel cell", "Hydrogenation", "Reducing agent"],
  He: ["Cryogenic coolant", "Inert atmosphere", "Leak detection"],
  Li: ["Battery electrolyte", "Ceramic glaze", "Alloy hardening"],
  Be: ["X-ray windows", "Aerospace alloy", "Neutron moderator"],
  B: [
    "Borosilicate glass",
    "Borate detergents",
    "Semiconductor doping",
    "Neutron absorber",
    "Flame retardants",
  ],
  C: ["Graphite electrode", "Activated carbon", "Polymer/organic chemistry"],
  N: ["Liquid nitrogen cryogen", "Inert atmosphere", "Fertilizer synthesis"],
  O: ["Medical oxygen", "Combustion support", "Water treatment"],
  F: ["Teflon precursor", "Dental fluoride", "Uranium enrichment"],
  Ne: ["Neon signage", "Gas laser medium", "Cryogenic refrigerant"],
  Na: ["Sodium lamps", "Heat transfer fluid", "Chemical synthesis"],
  Mg: ["Grignard reagent", "Alloy lightweighting", "Flash photography"],
  Al: ["Labware", "Catalyst support", "Reducing agent (aluminothermic)"],
  Si: ["Semiconductor", "Glass/ceramic", "Silicone materials"],
  P: ["Buffer phosphate", "Flame retardant", "Fertilizer"],
  S: ["Sulfuric acid production", "Rubber vulcanization", "Fungicide"],
  Cl: ["Water disinfection", "PVC production", "Bleaching agent"],
  Ar: ["Inert welding shield", "Incandescent lamp fill", "Cryogenic research"],
  K: ["Buffer potassium", "Fertilizer", "Glass production"],
  Ca: ["Lime (CaO)", "Desiccant", "Water hardness control"],
  Sc: [
    "Aluminum-scandium alloys",
    "Metal halide lamps",
    "Aerospace materials",
    "Solid-state materials research",
  ],
  Ti: ["Aerospace alloy", "Biomedical implant", "White pigment (TiO2 precursor)"],
  V: ["Steel alloy (HSLA)", "Vanadium redox battery", "Catalyst"],
  Cr: ["Chrome plating", "Pigment", "Corrosion-resistant alloy"],
  Mn: ["Oxidizing agent (KMnO4)", "Steel alloy", "Battery cathode"],
  Fe: ["Catalyst (FeCl3)", "Steel construction", "Magnetic materials"],
  Co: ["Catalyst", "Pigment", "Battery cathode"],
  Ni: ["Catalyst (Raney Ni)", "Electroplating", "Stainless steel"],
  Cu: ["Electrical wiring", "Catalyst", "Antimicrobial surface"],
  Zn: ["Galvanizing", "Battery anode", "Zinc reagent"],
  Ga: ["Semiconductor (GaAs)", "LED", "Low-melt alloy"],
  Ge: ["Fiber optics", "Infrared optics", "Semiconductor doping"],
  As: ["Semiconductor (GaAs)", "Wood preservative (legacy)", "Doping agent"],
  Se: ["Photocopier drum", "Glass decolorizer", "Nutritional supplement"],
  Br: ["Organic synthesis", "Flame retardant", "Photography"],
  Kr: ["High-efficiency lighting", "Laser medium", "Insulation gas"],
  Rb: ["Atomic clock research", "Specialty glass", "Photoelectric cells"],
  Sr: ["Fireworks (red color)", "Ferrite magnets", "Medical tracer (Sr-89)"],
  Y: ["YAG laser crystal", "Superconductor research", "LED phosphor"],
  Zr: ["Nuclear reactor cladding", "Ceramic pigment", "Surgical implant"],
  Nb: ["Superconducting magnets", "High-strength steel", "Jet engine alloy"],
  Mo: ["Alloy steel", "Catalyst", "Lubricant additive (MoS2)"],
  Ag: ["Mirror coating", "Antimicrobial", "Electrical contact"],
  Sn: ["Solder", "Tin plating", "Bronze alloy"],
  Sb: ["Flame retardant (Sb2O3)", "Lead-acid battery alloy", "Semiconductor"],
  Te: ["Thermoelectric devices", "Alloy additive", "Solar cell research"],
  I: ["Disinfectant (tincture)", "Contrast agent", "Organic synthesis"],
  Xe: ["Medical imaging", "Ion propulsion", "High-intensity lighting"],
  Cs: ["Atomic clock", "Drilling fluid", "Photoelectric research"],
  Ba: ["Contrast agent (BaSO4)", "Fireworks (green color)", "Glass production"],
  W: ["Filament wire", "Radiation shielding", "High-temperature alloy"],
  Pt: ["Catalyst (hydrogenation)", "Electrode", "Thermocouple"],
  Au: ["Electronics contact", "Catalyst", "Nanoparticle research"],
  Hg: ["Thermometer (legacy)", "Electrode reference", "Amalgam"],
  Pb: ["Radiation shielding", "Battery (legacy)", "Solder (legacy)"],
  U: ["Nuclear fuel", "Radiometric dating", "Radiation shielding"],
};

export function getElementApplications(symbol: string, inline?: string[]): string[] {
  if (inline && inline.length > 0) return inline;
  return ELEMENT_APPLICATIONS[symbol] ?? [];
}

const MAIN_TABLE_POSITIONS: ReadonlyMap<number, { row: number; col: number }> = new Map([
  [1, { row: 1, col: 1 }],
  [2, { row: 1, col: 18 }],
  [3, { row: 2, col: 1 }],
  [4, { row: 2, col: 2 }],
  [5, { row: 2, col: 13 }],
  [6, { row: 2, col: 14 }],
  [7, { row: 2, col: 15 }],
  [8, { row: 2, col: 16 }],
  [9, { row: 2, col: 17 }],
  [10, { row: 2, col: 18 }],
  [11, { row: 3, col: 1 }],
  [12, { row: 3, col: 2 }],
  [13, { row: 3, col: 13 }],
  [14, { row: 3, col: 14 }],
  [15, { row: 3, col: 15 }],
  [16, { row: 3, col: 16 }],
  [17, { row: 3, col: 17 }],
  [18, { row: 3, col: 18 }],
  [19, { row: 4, col: 1 }],
  [20, { row: 4, col: 2 }],
  [31, { row: 4, col: 13 }],
  [32, { row: 4, col: 14 }],
  [33, { row: 4, col: 15 }],
  [34, { row: 4, col: 16 }],
  [35, { row: 4, col: 17 }],
  [36, { row: 4, col: 18 }],
  [37, { row: 5, col: 1 }],
  [38, { row: 5, col: 2 }],
  [49, { row: 5, col: 13 }],
  [50, { row: 5, col: 14 }],
  [51, { row: 5, col: 15 }],
  [52, { row: 5, col: 16 }],
  [53, { row: 5, col: 17 }],
  [54, { row: 5, col: 18 }],
  [55, { row: 6, col: 1 }],
  [56, { row: 6, col: 2 }],
  [57, { row: 6, col: 3 }],
  [72, { row: 6, col: 4 }],
  [87, { row: 7, col: 1 }],
  [88, { row: 7, col: 2 }],
  [89, { row: 7, col: 3 }],
  [104, { row: 7, col: 4 }],
]);

/** Standard 18-column periodic table layout (rows 1–7 main, f-blocks at 9–10). */
export function getElementGridPosition(atomicNumber: number): { row: number; col: number } {
  if (atomicNumber >= 57 && atomicNumber <= 71) {
    return { row: 9, col: 4 + (atomicNumber - 57) };
  }
  if (atomicNumber >= 89 && atomicNumber <= 103) {
    return { row: 10, col: 4 + (atomicNumber - 89) };
  }

  const fixed = MAIN_TABLE_POSITIONS.get(atomicNumber);
  if (fixed) {
    return fixed;
  }

  if (atomicNumber >= 21 && atomicNumber <= 30) {
    return { row: 4, col: 3 + (atomicNumber - 21) };
  }
  if (atomicNumber >= 39 && atomicNumber <= 48) {
    return { row: 5, col: 3 + (atomicNumber - 39) };
  }
  if (atomicNumber >= 73 && atomicNumber <= 86) {
    return { row: 6, col: 5 + (atomicNumber - 73) };
  }
  if (atomicNumber >= 105 && atomicNumber <= 118) {
    return { row: 7, col: 5 + (atomicNumber - 105) };
  }

  throw new Error(`Unknown atomic number: ${atomicNumber}`);
}
