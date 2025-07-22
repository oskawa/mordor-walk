import { useRef, useState } from "react";
import * as THREE from "three";
import { Html, Sphere, Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

interface InteractivePathProps {
  percentage: number;
  friends: any[];
  milestones: any[];
  unlockedMilestones: any[];
}

interface POIPopup {
  position: [number, number, number];
  milestone: any;
}

export function InteractivePath({ percentage, friends, milestones, unlockedMilestones }: InteractivePathProps) {
  const [selectedPOI, setSelectedPOI] = useState<POIPopup | null>(null);
  
  // Mêmes points que PathMordor mais sans le slider
  const svgPoints =
    "463,242.75,463.75,246,464.5,249,465.25,253,466,256.75,467,260,469,262.75,471,263.5,474.5,262.5,479,261,483.25,258.5,487.25,256,491.25,254.25,494,253,495.25,252,498.75,250,502,248.5,504.75,249.5,506,251,507,252.5,511.25,253.75,515,254.75,518.75,256,523.25,256.75,526,256.75,528.75,256.75,533,256.75,538,255.75,543,256.5,547,257.25,548.25,255.5,548.25,252.75,549,250,550,248,552,247,553.75,247,555.75,244.5,558,241.75,560.5,239,564.5,236.75,568.25,236,574,234.5,579,234.5,584.75,235.75,588,236.75,592.75,238.75,597.75,240.75,602,239.5,607,238.25,610,237.5,616,238.5,619.75,239.5,620,240,624.5,244,627.75,246.5,632,248.25,637.5,249.5,641.75,248.75,650,247,658,245,681,241,688.25,238.75,696,236.5,700,235.5,704,235.25,711.75,229.5,721.75,228,729.75,227.25,737,228.5,745.25,229.5,752,231,758.75,233.25,761.75,235,763.75,237.5,765,240.5,765.5,241.5,767.75,241.5,770.25,241.75,772,240.25,772.75,237.25,772.75,233.5,770.5,243.25,768.75,250.5,768.75,255,769.25,260.75,769.75,266.5,769.75,272.5,768,277.75,765.5,282.5,761,289,756,296.5,751,302.75,747.5,307.5,745.25,310.5,744.75,319.5,749.75,319.5,759.75,317,767.25,312.5,776.5,307.5,770.75,312,761,316,751.75,319.75,744.75,322,743,324.5,738.75,332.25,737,338,736.5,344.5,736.5,350.5,736.75,355.5,737.75,361,738.25,363.75,743.5,361,750,357.75,755,357,758,358.5,762,359,766.75,358.5,769,362.5,772.75,362,776.75,361.5,779.75,362.25,782.75,363.5,784.5,364.5,786.5,367.25,788.5,370,790,373.5,793.75,376.25,797.75,379.25,800.75,383,801.25,387,804.75,390.25,808.25,393.5,813.25,396.5,821,398.75,827.75,401,833.75,403.5,840.75,405.75,843.75,408,850.25,413.5,852,419.5,854,427,856,432.5,858.75,437.75,864.5,441.5,871.25,446.75,877,451.25,880.5,455.5,886.5,457.75,892.25,460,899,461.5,902.5,464.5,904.25,469.25,901.75,474,898.5,477.5,897.75,481.75,899.5,485,901.5,489.25,905.75,491.25,913.25,489.75,919.25,488,923.75,488.5,926.5,492,928,496,925,500.5,922,505.75,919,508.75,918,512.75,918.75,515.75,920.75,517,924,518,929.5,520.75,933.75,524,935,527.75,935,531.75,934.25,536,932.25,538.75,930.5,544.25,928.25,547,925,556.25,924.75,560.75,925,564.5,925,567.75,925,572.25,926.5,577.5,928.25,581.75,930,587.75,931,592.75,932,600.75,932,605.5,931.75,607.5,929.25,605,939.5,600.5,941.75,595.75,944.25,591.5,948.25,589.25,950.25,587.75,956,585.5,960,584.25,967.5,582.5,979,581.75,983.25,583,987.25,584.5,993,588.5,1000.5,593,1006.75,596.5,1014,599.75,1021.25,604,1027,606.75,1028.5,607.25,1023.25,611.5,1018.75,616,1017.25,619.5,1015.5,626,1014.25,631.5,1013.5,635.5,1013.5,640.75,1013,645,1013,651.5,1014,658,1013,662.5,1015.5,668.25,1018,675.5,1020,681.75,1021.75,689.5,1023.25,694.5,1024,700,1029.5,704,1031.75,705.5,1038,704.25,1041.25,703.25,1045.25,700.5,1051.5,700.25,1056.25,700.5,1061,703.5,1066.25,704.25,1069.75,704.25,1068,696.5,1066.75,687.25,1066,676.75,1066,666.75,1064.5,660.25,1059.25,657,1052.75,655,1057.5,653.5,1062.25,651.5,1066,649.5,1072.5,640,1081.5,637.25,1092,638.75,1096.75,638.25,1104.25,638.25,1104.5,639.25,1103,645.5,1103.5,651,1103.5,654.25,1104.5,661,1105.75,666.5,1106.5,670.5";

  const offsetX = -0.7;
  const offsetY = -0.85;
  const scaleFactor = 0.0018;
  
  const normalizedSVG = normalizeSVGPoints(svgPoints, offsetX, offsetY, scaleFactor);

  // Convertir en points 3D
  const pointsArray = normalizedSVG
    .split(",")
    .reduce((acc, val, index, arr) => {
      if (index % 2 === 0) {
        acc.push(
          new THREE.Vector3(
            parseFloat(arr[index]),
            parseFloat(arr[index + 1]),
            0
          )
        );
      }
      return acc;
    }, []);

  const scaledPoints = pointsArray.map((point) => {
    return new THREE.Vector3(point.x, point.y, point.z + 0.15); // Légèrement au-dessus du terrain
  });

  // Créer la courbe
  const curve = new THREE.CatmullRomCurve3(scaledPoints);
  const curvePoints = curve.getPoints(200);
  const flippedCurvePoints = curvePoints.map(
    (point) => new THREE.Vector3(point.x, -point.y, point.z)
  );

  // Diviser le chemin parcouru/non parcouru
  const splitIndex = Math.floor(flippedCurvePoints.length * percentage);
  const completedPath = flippedCurvePoints.slice(0, splitIndex);
  const remainingPath = flippedCurvePoints.slice(splitIndex);

  // Gérer le clic sur POI
  const handlePOIClick = (event: ThreeEvent<MouseEvent>, milestone: any, position: [number, number, number]) => {
    event.stopPropagation();
    setSelectedPOI({ position, milestone });
    console.log('POI 3D cliqué:', milestone);
  };

  return (
    <>
      {/* Chemin parcouru (vert) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                completedPath.flatMap((point) => [point.x, point.y, point.z])
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00c8a0" linewidth={3} />
      </line>

      {/* Chemin restant (gris) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                remainingPath.flatMap((point) => [point.x, point.y, point.z-0.12])
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#555555" linewidth={2} />
      </line>

      {/* Points d'intérêt (POI) */}
      {unlockedMilestones.map((milestone, index) => {
        const progress = milestone.km / 1400;
        const position = curve.getPointAt(progress);
        const pos3D: [number, number, number] = [position.x, -position.y + 0.05, position.z];

        return (
          <group key={index}>
            {/* Sphère cliquable dorée */}
            <Sphere
              position={[pos3D[0], pos3D[1], pos3D[2]-0.12]}
              args={[0.02, 16, 16]}
              onClick={(event) => handlePOIClick(event, milestone, pos3D)}
            >
              <meshStandardMaterial
                color="#00c8a0"
                emissive="#00c8a0"
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </Sphere>

            {/* Indicateur visuel au-dessus */}
            <Text
              position={[pos3D[0], pos3D[1], pos3D[2]-0.08]}
              fontSize={0.05}
              color="#00c8a0"
              anchorX="center"
              anchorY="middle"
                rotation={[Math.PI - 1, 0, 0]} // 90° en radians sur l'axe X
            >
              📍
            </Text>

            {/* Badge de distance */}
            <Html position={[pos3D[0], pos3D[1], pos3D[2]+ 0.005]} center>
              <div style={{
                background: '#00c8a0',
                color: '#1a0f08',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                pointerEvents: 'none'
              }}>
                {milestone.km}km
              </div>
            </Html>
          </group>
        );
      })}

      {/* Amis */}
      {friends.map((friend, index) => {
        if (friend.percentage <= 0) return null;
        
        const position = curve.getPointAt(friend.percentage);
        const pos3D: [number, number, number] = [position.x, -position.y + 0.08, position.z];

        return (
          <Html
            key={`friend-${index}`}
            position={pos3D}
            center
            distanceFactor={50} // BEAUCOUP plus grand pour des éléments vraiment petits
            style={{
              transform: 'scale(0.5)', // Force le scale CSS en plus
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              transform: 'scale(0.7)' // Double scale pour être sûr
            }}>
              <div style={{
                width: '12px', // Encore plus petit
                height: '12px',
                borderRadius: '50%',
                background: '#fff',
                border: '1px solid #00c8a0', // Border plus fine
                backgroundImage: `url(${friend.picture || '/profile.svg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }} />
              {friend.username && (
                <span style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '1px 2px',
                  borderRadius: '2px',
                  fontSize: '6px', // Très petit
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  fontWeight: '600',
                  lineHeight: '1'
                }}>
                  {friend.username}
                </span>
              )}
            </div>
          </Html>
        );
      })}

      {/* Popup POI */}
      {/* {selectedPOI && (
        <Html
          position={[
            selectedPOI.position[0] + 0.1,
            selectedPOI.position[1] + 0.15,
            selectedPOI.position[2]
          ]}
          center
        >
          <div style={{
            background: 'linear-gradient(135deg, #2a1810 0%, #1a0f08 100%)',
            border: '2px solid #d4af37',
            borderRadius: '12px',
            padding: '12px',
            maxWidth: '250px',
            color: '#f4e4c1',
            fontSize: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto'
          }}>
            <button
              onClick={() => setSelectedPOI(null)}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#d4af37',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                background: '#d4af37',
                color: '#1a0f08',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {selectedPOI.milestone.km} km
              </span>
            </div>
            
            {selectedPOI.milestone.content_citation && (
              <blockquote style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderLeft: '3px solid #d4af37',
                margin: '0 0 8px',
                padding: '6px 8px',
                fontStyle: 'italic',
                lineHeight: '1.3'
              }}>
                "{selectedPOI.milestone.content_citation}"
              </blockquote>
            )}
            
            {selectedPOI.milestone.chapter && (
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#d4af37' }}>
                <strong>{selectedPOI.milestone.chapter}</strong>
                {selectedPOI.milestone.book && <><br/><em>{selectedPOI.milestone.book}</em></>}
              </div>
            )}
          </div>
        </Html>
      )} */}
    </>
  );
}

// Fonction helper (même que PathMordor)
function normalizeSVGPoints(svgPoints: string, offsetX = 0, offsetY = 0, scale = 1) {
  const pointsArray = svgPoints.split(",").map(Number);

  let minX = Infinity;
  let minY = Infinity;

  for (let i = 0; i < pointsArray.length; i += 2) {
    minX = Math.min(minX, pointsArray[i]);
    minY = Math.min(minY, pointsArray[i + 1]);
  }

  return pointsArray
    .map((val, index) => {
      const scaledValue =
        index % 2 === 0
          ? (val - minX) * scale + offsetX
          : (val - minY) * scale + offsetY;
      return scaledValue;
    })
    .join(",");
}