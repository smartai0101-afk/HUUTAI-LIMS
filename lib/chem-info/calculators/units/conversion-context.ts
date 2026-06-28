export type ContextField = "molecularWeight" | "density" | "rotorRadius";

export type ConversionContext = {
  molecularWeight?: number;
  density?: number;
  rotorRadiusCm?: number;
};
