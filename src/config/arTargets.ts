export type ARTargetConfig = {
  targetSrc: string;
  tracking: {
    filterMinCF: number;
    filterBeta: number;
    warmupTolerance: number;
    missTolerance: number;
  };
};

export const arTargetConfig: ARTargetConfig = {
  targetSrc: '/targets/targets.mind',
  tracking: {
    // Higher smoothing makes the overlay less shaky, with a little more lag.
    filterMinCF: 0.001,
    filterBeta: 0.01,
    warmupTolerance: 5,
    missTolerance: 8,
  },
};
