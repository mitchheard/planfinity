import type { ContainerType } from "../types/planfinity";

export type ContainerFitSuggestion = {
  containerTypeId: string;
  label: string;
  widthUnits: number;
  depthUnits: number;
  widthMm: number;
  depthMm: number;
  slackWidthMm: number;
  slackDepthMm: number;
  usesRotatedFit: boolean;
};

export type ContainerFitSummary = {
  requiredWidthUnits: number;
  requiredDepthUnits: number;
  requiredWidthMm: number;
  requiredDepthMm: number;
  suggestions: ContainerFitSuggestion[];
};

type FitOrientation = {
  usesRotatedFit: boolean;
  slackWidthMm: number;
  slackDepthMm: number;
};

function assertFinitePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than 0.`);
  }
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be greater than or equal to 0.`);
  }
}

function pickFitOrientation(
  requiredWidthMm: number,
  requiredDepthMm: number,
  containerWidthMm: number,
  containerDepthMm: number,
): FitOrientation | null {
  const normalFit =
    containerWidthMm >= requiredWidthMm && containerDepthMm >= requiredDepthMm;
  const rotatedFit =
    containerWidthMm >= requiredDepthMm && containerDepthMm >= requiredWidthMm;

  if (!normalFit && !rotatedFit) {
    return null;
  }

  if (normalFit && !rotatedFit) {
    return {
      usesRotatedFit: false,
      slackWidthMm: containerWidthMm - requiredWidthMm,
      slackDepthMm: containerDepthMm - requiredDepthMm,
    };
  }

  if (!normalFit && rotatedFit) {
    return {
      usesRotatedFit: true,
      slackWidthMm: containerWidthMm - requiredDepthMm,
      slackDepthMm: containerDepthMm - requiredWidthMm,
    };
  }

  const normalSlackWidth = containerWidthMm - requiredWidthMm;
  const normalSlackDepth = containerDepthMm - requiredDepthMm;
  const rotatedSlackWidth = containerWidthMm - requiredDepthMm;
  const rotatedSlackDepth = containerDepthMm - requiredWidthMm;
  const normalMaxSlack = Math.max(normalSlackWidth, normalSlackDepth);
  const rotatedMaxSlack = Math.max(rotatedSlackWidth, rotatedSlackDepth);

  if (rotatedMaxSlack < normalMaxSlack) {
    return {
      usesRotatedFit: true,
      slackWidthMm: rotatedSlackWidth,
      slackDepthMm: rotatedSlackDepth,
    };
  }

  return {
    usesRotatedFit: false,
    slackWidthMm: normalSlackWidth,
    slackDepthMm: normalSlackDepth,
  };
}

export function suggestContainerFits(
  containerTypes: ContainerType[],
  gridPitchMm: number,
  objectWidthMm: number,
  objectDepthMm: number,
  clearanceMm = 2,
): ContainerFitSummary {
  assertFinitePositive(gridPitchMm, "gridPitchMm");
  assertFinitePositive(objectWidthMm, "objectWidthMm");
  assertFinitePositive(objectDepthMm, "objectDepthMm");
  assertFiniteNonNegative(clearanceMm, "clearanceMm");

  const requiredWidthMm = objectWidthMm + clearanceMm * 2;
  const requiredDepthMm = objectDepthMm + clearanceMm * 2;
  const requiredWidthUnits = Math.ceil(requiredWidthMm / gridPitchMm);
  const requiredDepthUnits = Math.ceil(requiredDepthMm / gridPitchMm);

  const suggestions = containerTypes
    .map((containerType) => {
      const containerWidthMm = containerType.widthUnits * gridPitchMm;
      const containerDepthMm = containerType.depthUnits * gridPitchMm;
      const orientation = pickFitOrientation(
        requiredWidthMm,
        requiredDepthMm,
        containerWidthMm,
        containerDepthMm,
      );

      if (!orientation) {
        return null;
      }

      return {
        containerTypeId: containerType.id,
        label: containerType.label,
        widthUnits: containerType.widthUnits,
        depthUnits: containerType.depthUnits,
        widthMm: containerWidthMm,
        depthMm: containerDepthMm,
        slackWidthMm: orientation.slackWidthMm,
        slackDepthMm: orientation.slackDepthMm,
        usesRotatedFit: orientation.usesRotatedFit,
      } satisfies ContainerFitSuggestion;
    })
    .filter((suggestion): suggestion is ContainerFitSuggestion => suggestion !== null)
    .sort((a, b) => {
      const areaA = a.widthUnits * a.depthUnits;
      const areaB = b.widthUnits * b.depthUnits;
      if (areaA !== areaB) {
        return areaA - areaB;
      }

      const maxSlackA = Math.max(a.slackWidthMm, a.slackDepthMm);
      const maxSlackB = Math.max(b.slackWidthMm, b.slackDepthMm);
      if (maxSlackA !== maxSlackB) {
        return maxSlackA - maxSlackB;
      }

      return a.label.localeCompare(b.label);
    });

  return {
    requiredWidthUnits,
    requiredDepthUnits,
    requiredWidthMm,
    requiredDepthMm,
    suggestions,
  };
}
