import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { useEffect } from "react";

export function CustomPlane() {
  // Textures principales uniquement pour éviter les problèmes
  const albedo = useLoader(TextureLoader, "/three/albedo.png");
  const normal = useLoader(TextureLoader, "/three/normal.png");
  const roughness = useLoader(TextureLoader, "/three/roughness.png");
  const displacement = useLoader(TextureLoader, "/three/curve_smooth.png");

  // Optimiser les textures
  useEffect(() => {
    // Améliorer la qualité du displacement
    displacement.wrapS = displacement.wrapT = THREE.ClampToEdgeWrapping;
    displacement.generateMipmaps = false;
    displacement.minFilter = THREE.LinearFilter;
    displacement.magFilter = THREE.LinearFilter;

    // Ajuster les autres textures
    [albedo, normal, roughness].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.generateMipmaps = true;
    });
  }, [albedo, normal, roughness, displacement]);

  return (
    <mesh position={[0, -0.1, 0]}>
      {" "}
      {/* SUPPRESSION de la rotation */}
      {/* Résolution plus fine pour un terrain plus smooth */}
      <planeGeometry args={[3, 3, 128, 128]} />
      <meshStandardMaterial
        color="white"
        map={albedo}
        normalMap={normal}
        roughnessMap={roughness}
        displacementMap={displacement}
        displacementScale={0.08}
        transparent={false}
        metalness={0.1}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}
