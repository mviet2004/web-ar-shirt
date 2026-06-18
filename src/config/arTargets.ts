export type ARTargetConfig = {
  id: string;
  name: string;
  targetSrc: string;
  animationSrc: string;
  animationType: 'model' | 'video';
  targetIndex: number;
  overlayWidth: number;
  overlayHeight: number;
  modelScale: number;
  tracking: {
    filterMinCF: number;
    filterBeta: number;
    warmupTolerance: number;
    missTolerance: number;
  };
};

export const arTargets: ARTargetConfig[] = [
  {
    id: 'shirt-01',
    name: 'Shirt 01',
    targetSrc: '/targets/shirt-01.mind',
    animationSrc: '/animations/shirt-01v3.webm',
    animationType: 'video',
    targetIndex: 0,
    // MindAR uses width 1 for the detected image.
    // The shirt graphic is a vertical poster, around 1 : 1.25.
    overlayWidth: 1,
    overlayHeight: 1.25,
    modelScale: 0.45,
    tracking: {
      // Higher smoothing makes the overlay less shaky, with a little more lag.
      filterMinCF: 0.001,
      filterBeta: 0.01,
      warmupTolerance: 5,
      missTolerance: 8,
    },
  },
];

export const defaultARTarget = arTargets[0];
