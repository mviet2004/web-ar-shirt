import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import { arTargetConfig } from '../config/arTargets';
import { arAssets } from './arAssets';

type ARStatus = 'starting' | 'scanning' | 'found' | 'lost' | 'error';

const LOADING_ANIMATION_SRC = '/animations/Demo.mp4';
const VIDEO_PRELOAD_TIMEOUT_MS = 8000;

type ARVideoRuntime = {
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  geometry: THREE.PlaneGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh;
};

async function assertAssetExists(src: string, label: string) {
  const response = await fetch(src, { method: 'HEAD' });

  if (!response.ok) {
    throw new Error(`${label} was not found at ${src}.`);
  }
}

function preloadVideoStart(video: HTMLVideoElement, src: string) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve();
    };

    const handleCanPlay = () => finish();
    const handleError = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error(`Animation file could not load from ${src}.`));
    };

    const timeoutId = window.setTimeout(finish, VIDEO_PRELOAD_TIMEOUT_MS);

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('error', handleError, { once: true });

    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      finish();
    }
  });
}

function mapFullVideoToTarget(texture: THREE.VideoTexture) {
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
}

export default function MindARViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ARStatus>('starting');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let isMounted = true;
    let mindarThree: MindARThree | null = null;
    let activeTargetIndex: number | null = null;
    const videos: HTMLVideoElement[] = [];
    const runtimes: ARVideoRuntime[] = [];

    const startAR = async () => {
      try {
        setIsLoading(true);
        setStatus('starting');

        await Promise.all([
          assertAssetExists(arTargetConfig.targetSrc, '.mind target file'),
          assertAssetExists(LOADING_ANIMATION_SRC, 'Loading animation'),
          ...arAssets.map((asset) => assertAssetExists(asset.videoSrc, 'Animation file')),
        ]);

        if (!isMounted || !containerRef.current) {
          return;
        }

        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: arTargetConfig.targetSrc,
          maxTrack: 1,
          uiLoading: 'no',
          uiScanning: '#custom-scanning-frame',
          uiError: 'no',
          filterMinCF: arTargetConfig.tracking.filterMinCF,
          filterBeta: arTargetConfig.tracking.filterBeta,
          warmupTolerance: arTargetConfig.tracking.warmupTolerance,
          missTolerance: arTargetConfig.tracking.missTolerance,
        });

        const { renderer, scene, camera } = mindarThree;

        await Promise.all(
          arAssets.map(async (asset) => {
            const anchor = mindarThree!.addAnchor(asset.targetIndex);
            const video = document.createElement('video');
            video.src = asset.videoSrc;
            video.crossOrigin = 'anonymous';
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            videos.push(video);

            await preloadVideoStart(video, asset.videoSrc);

            if (!isMounted) {
              return;
            }

            const texture = new THREE.VideoTexture(video);
            texture.encoding = THREE.sRGBEncoding;
            mapFullVideoToTarget(texture);

            // MindAR normalizes every target to width 1. Its height must follow
            // the dimensions embedded in targets.mind for a 1:1 overlay.
            const targetAspectRatio = asset.targetHeight / asset.targetWidth;
            const geometry = new THREE.PlaneGeometry(1, targetAspectRatio);
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              alphaTest: 0.01,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.setScalar(asset.overlayScale);
            mesh.position.z = 0.01;
            anchor.group.add(mesh);

            runtimes.push({ video, texture, geometry, material, mesh });

            anchor.onTargetFound = () => {
              activeTargetIndex = asset.targetIndex;
              setStatus('found');

              runtimes.forEach(({ video: otherVideo }) => {
                if (otherVideo !== video) {
                  otherVideo.pause();
                }
              });

              video.currentTime = 0;
              void video.play().catch(() => undefined);
            };

            anchor.onTargetLost = () => {
              video.pause();

              if (activeTargetIndex === asset.targetIndex) {
                activeTargetIndex = null;
                setStatus('lost');
              }
            };
          }),
        );

        await mindarThree.start();

        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setStatus((currentStatus) =>
          currentStatus === 'starting' ? 'scanning' : currentStatus,
        );
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setIsLoading(false);
      }
    };

    void startAR();

    return () => {
      isMounted = false;

      if (mindarThree) {
        mindarThree.renderer.setAnimationLoop(null);
        mindarThree.stop();
        mindarThree.renderer.dispose();
      }

      videos.forEach((video) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      });

      runtimes.forEach(({ texture, geometry, material, mesh }) => {
        mesh.removeFromParent();
        texture.dispose();
        material.dispose();
        geometry.dispose();
      });
    };
  }, []);

  const showBootSplash = isLoading;

  return (
    <div className="ar-shell">
      <div
        id="custom-scanning-overlay"
        className="scanner-overlay"
        aria-hidden="true"
      >
        <img
          className="scanner-border"
          src="/ui/scanner-border-1080x1920.png"
          alt=""
        />
        <div className="scanner-top">
          <img
            className="scanner-title"
            src="/ui/scanner-title.png"
            alt="AR Scanner"
          />
        </div>
        <img
          id="custom-scanning-frame"
          className="scanner-frame hidden"
          src="/ui/scanner-frame.png"
          alt=""
        />
        <img className="scanner-bottom" src="/ui/scanner-bottom.png" alt="" />
      </div>

      <div ref={containerRef} className="ar-container" />

      {showBootSplash && (
        <div className="boot-splash" aria-hidden="true">
          <div className="boot-splash__window">
            <div className="boot-splash__header">
              <span>AR SHIRT</span>
              <span className="boot-splash__close">X</span>
            </div>
            <div className="boot-splash__body">
              <video
                className="boot-splash__animation"
                src={LOADING_ANIMATION_SRC}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
              <p className="boot-splash__title">LOADING...</p>
              <div className="boot-splash__hearts" aria-hidden="true">
                <span className="boot-splash__heart">♥</span>
                <span className="boot-splash__heart">♥</span>
                <span className="boot-splash__heart">♥</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
