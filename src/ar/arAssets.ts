export type ARAsset = {
  targetIndex: number;
  name: string;
  videoSrc: string;
  targetWidth: number;
  targetHeight: number;
  overlayScale: number;
};

export const arAssets: ARAsset[] = [
  {
    targetIndex: 0,
    name: 'Animation 01',
    videoSrc: '/animations/anim-01.webm',
    targetWidth: 2000,
    targetHeight: 3000,
    overlayScale: 1.25,
  },
  {
    targetIndex: 1,
    name: 'Animation 02',
    videoSrc: '/animations/anim-02.webm',
    targetWidth: 3500,
    targetHeight: 3500,
    overlayScale: 1.45,
  },
  {
    targetIndex: 2,
    name: 'Animation 03',
    videoSrc: '/animations/anim-03.webm',
    targetWidth: 3000,
    targetHeight: 2000,
    overlayScale: 1.25,
  },
];
