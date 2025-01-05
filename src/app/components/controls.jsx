import { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export function Controls() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const [panLimits, setPanLimits] = useState({
    minX: -0.2,
    maxX: 0.2,
    minY: -0.8,
    maxY: 0.8,
  });

  useEffect(() => {
    const updatePanLimits = () => {
      const width = window.innerWidth;

      // Adjust limits based on the width of the screen
      const newLimits = {
        minX: width < 600 ? -1 : -0.2, // Example values, adjust as needed
        maxX: width < 600 ? 1 : 0.2,
        minY: width < 600 ? -1 : -0.8,
        maxY: width < 600 ? 1 : 0.8,
      };

      setPanLimits(newLimits);
    };

    updatePanLimits(); // Set initial limits
    window.addEventListener("resize", updatePanLimits); // Add resize event listener

    return () => {
      window.removeEventListener("resize", updatePanLimits); // Clean up the event listener
    };
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;

    const handleControlChange = () => {
      if (controls) {
        const { x, y } = camera.position;

        // Clamp camera position within limits
        camera.position.x = Math.max(
          panLimits.minX,
          Math.min(panLimits.maxX, x)
        );
        camera.position.y = Math.max(
          panLimits.minY,
          Math.min(panLimits.maxY, y)
        );

        controls.target.set(camera.position.x, camera.position.y, 0);
      }
    };

    controls.addEventListener("change", handleControlChange);

    return () => {
      controls.removeEventListener("change", handleControlChange);
    };
  }, [camera, panLimits]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      minDistance={0.3}
      maxDistance={1.3}
      enableRotate={false}
      mouseButtons={{
        LEFT: 2,
        MIDDLE: 1,
        RIGHT: 3,
      }}
      target={[0, 0, 0]}
    />
  );
}
