import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
export function CustomPlane() {
  // Load textures using the useLoader hook
 // Load textures using the useLoader hook
 const albedo = useLoader(TextureLoader, "/three/albedo.png");  // Color texture
//  const normal = useLoader(TextureLoader, "/three/normal.png");  // Normal map
//  const roughness = useLoader(TextureLoader, "/three/roughness.png");  // Roughness map
//  const displacement = useLoader(TextureLoader, "/three/curve_smooth.png");  // Displacement or height map

  return (
    <mesh>
      <planeGeometry args={[3,3, 64, 64]} />
      <meshStandardMaterial
        color="white"
        map={albedo}  // Albedo map (color texture)
        // normalMap={normal}  // Normal map
        // roughnessMap={roughness}  // Roughness map
        // displacementMap={displacement}  // Displacement map
        displacementScale={0.3}  // Adjust displacement intensity
        transparent={true}
      />
    </mesh>
  );
}
