import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';
import type { ARTargetConfig } from '../config/arTargets';

type ARStatus = 'starting' | 'scanning' | 'found' | 'lost' | 'error';

type MindARViewerProps = {
  target: ARTargetConfig;
};

async function assertAssetExists(src: string, label: string) {
  const response = await fetch(src, { method: 'HEAD' });

  if (!response.ok) {
    throw new Error(`${label} was not found at ${src}.`);
  }
}

function getFriendlyError(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Camera permission was denied. Please allow camera access and try again.';
  }

  if (error instanceof Error) {
    if (error.name === 'NotAllowedError') {
      return 'Camera permission was denied. Please allow camera access and try again.';
    }

    return error.message;
  }

  return 'MindAR could not start. Please refresh and try again.';
}

function mapFullVideoToTarget(texture: THREE.VideoTexture) {
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
}

export default function MindARViewer({ target }: MindARViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ARStatus>('starting');
  const [message, setMessage] = useState('Starting camera...');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let isMounted = true;
    let mindarThree: MindARThree | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D | null = null;
    let overlayGroup: THREE.Group | null = null;
    let video: HTMLVideoElement | null = null;
    let videoTexture: THREE.VideoTexture | null = null;
    const clock = new THREE.Clock();
    const targetPosition = new THREE.Vector3();
    const targetQuaternion = new THREE.Quaternion();
    const targetScale = new THREE.Vector3();
    const smoothPosition = new THREE.Vector3();
    const smoothQuaternion = new THREE.Quaternion();
    const smoothScale = new THREE.Vector3(1, 1, 1);
    const smoothingAmount = 0.22;
    let hasSmoothedFrame = false;

    const startAR = async () => {
      try {
        setStatus('starting');
        setMessage('Checking AR assets...');

        await assertAssetExists(target.targetSrc, '.mind target file');
        await assertAssetExists(target.animationSrc, 'Animation file');

        if (!isMounted || !containerRef.current) {
          return;
        }

        setMessage('Opening camera...');

        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: target.targetSrc,
          maxTrack: 1,
          uiScanning: 'no',
          filterMinCF: target.tracking.filterMinCF,
          filterBeta: target.tracking.filterBeta,
          warmupTolerance: target.tracking.warmupTolerance,
          missTolerance: target.tracking.missTolerance,
        });

        const { renderer, scene, camera } = mindarThree;
        const anchor = mindarThree.addAnchor(target.targetIndex);
        overlayGroup = new THREE.Group();
        overlayGroup.visible = false;
        scene.add(overlayGroup);

        const light = new THREE.HemisphereLight(0xffffff, 0x6f675d, 2);
        scene.add(light);

        if (target.animationType === 'model') {
          const loader = new GLTFLoader();
          const gltf = await loader.loadAsync(target.animationSrc);

          if (!isMounted) {
            return;
          }

          model = gltf.scene;
          model.visible = false;
          model.scale.setScalar(target.modelScale);
          overlayGroup.add(model);

          // GLB files can contain timeline animations. The mixer controls play,
          // pause, and frame updates for those clips while the target is visible.
          if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = mixer!.clipAction(clip);
              action.play();
            });
            mixer.timeScale = 0;
          }
        } else {
          video = document.createElement('video');
          video.src = target.animationSrc;
          video.crossOrigin = 'anonymous';
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.preload = 'auto';
          video.load();

          await new Promise<void>((resolve, reject) => {
            if (!video) {
              reject(new Error('Animation video could not be created.'));
              return;
            }

            video.addEventListener('loadedmetadata', () => resolve(), { once: true });
            video.addEventListener(
              'error',
              () => reject(new Error(`Animation file could not load from ${target.animationSrc}.`)),
              { once: true },
            );
          });

          if (!isMounted || !video) {
            return;
          }

          videoTexture = new THREE.VideoTexture(video);
          videoTexture.encoding = THREE.sRGBEncoding;
          // Map the whole animation onto the full printed graphic area.
          // This preserves text such as "World Game 2026" instead of cropping.
          mapFullVideoToTarget(videoTexture);

          const geometry = new THREE.PlaneGeometry(target.overlayWidth, target.overlayHeight);
          const material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          });

          model = new THREE.Mesh(geometry, material);
          model.visible = false;
          model.position.z = 0.01;
          overlayGroup.add(model);
        }

        anchor.onTargetFound = () => {
          setStatus('found');
          setMessage('Graphic found');
          hasSmoothedFrame = false;

          if (overlayGroup) {
            overlayGroup.visible = true;
          }

          if (model) {
            model.visible = true;
          }

          if (mixer) {
            mixer.timeScale = 1;
          }

          void video?.play().catch(() => {
            setMessage('Tap the screen to allow animation playback');
          });
        };

        anchor.onTargetLost = () => {
          setStatus('lost');
          setMessage('Move closer to the shirt graphic');

          if (overlayGroup) {
            overlayGroup.visible = false;
          }

          if (model) {
            model.visible = false;
          }

          if (mixer) {
            mixer.timeScale = 0;
          }

          video?.pause();
        };

        await mindarThree.start();

        if (!isMounted) {
          return;
        }

        setStatus('scanning');
        setMessage('Scanning for shirt graphic...');
        renderer.setAnimationLoop(() => {
          const delta = clock.getDelta();

          if (overlayGroup?.visible && anchor.group.visible) {
            anchor.group.matrix.decompose(targetPosition, targetQuaternion, targetScale);

            if (!hasSmoothedFrame) {
              smoothPosition.copy(targetPosition);
              smoothQuaternion.copy(targetQuaternion);
              smoothScale.copy(targetScale);
              hasSmoothedFrame = true;
            } else {
              smoothPosition.lerp(targetPosition, smoothingAmount);
              smoothQuaternion.slerp(targetQuaternion, smoothingAmount);
              smoothScale.lerp(targetScale, smoothingAmount);
            }

            overlayGroup.position.copy(smoothPosition);
            overlayGroup.quaternion.copy(smoothQuaternion);
            overlayGroup.scale.copy(smoothScale);
          }

          mixer?.update(delta);
          renderer.render(scene, camera);
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setMessage(getFriendlyError(error));
      }
    };

    startAR();

    return () => {
      isMounted = false;

      if (mindarThree) {
        mindarThree.renderer.setAnimationLoop(null);
        mindarThree.stop();
        mindarThree.renderer.dispose();
      }

      mixer?.stopAllAction();
      video?.pause();
      video?.removeAttribute('src');
      video?.load();
      videoTexture?.dispose();
      overlayGroup?.removeFromParent();
      model?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();

          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [target]);

  const showScanningOverlay = status === 'starting' || status === 'scanning' || status === 'lost';

  return (
    <div className="ar-shell">
      <div ref={containerRef} className="ar-container" />

      {showScanningOverlay && (
        <div className="scan-overlay" aria-hidden="true">
          <div className="scan-frame">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div className={`status-pill status-pill--${status}`} role="status">
        {message}
      </div>
    </div>
  );
}
