import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { gsap } from "gsap";

export function PathMordor({ progress, percentage, friends }) {
  const pathRef = useRef(); // Reference to the red part of the path
  const fullPathRef = useRef(); // Reference to the full path (blue line)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const svgPoints =
    "463,242.75,463.75,246,464.5,249,465.25,253,466,256.75,467,260,469,262.75,471,263.5,474.5,262.5,479,261,483.25,258.5,487.25,256,491.25,254.25,494,253,495.25,252,498.75,250,502,248.5,504.75,249.5,506,251,507,252.5,511.25,253.75,515,254.75,518.75,256,523.25,256.75,526,256.75,528.75,256.75,533,256.75,538,255.75,543,256.5,547,257.25,548.25,255.5,548.25,252.75,549,250,550,248,552,247,553.75,247,555.75,244.5,558,241.75,560.5,239,564.5,236.75,568.25,236,574,234.5,579,234.5,584.75,235.75,588,236.75,592.75,238.75,597.75,240.75,602,239.5,607,238.25,610,237.5,616,238.5,619.75,239.5,620,240,624.5,244,627.75,246.5,632,248.25,637.5,249.5,641.75,248.75,650,247,658,245,681,241,688.25,238.75,696,236.5,700,235.5,704,235.25,711.75,229.5,721.75,228,729.75,227.25,737,228.5,745.25,229.5,752,231,758.75,233.25,761.75,235,763.75,237.5,765,240.5,765.5,241.5,767.75,241.5,770.25,241.75,772,240.25,772.75,237.25,772.75,233.5,770.5,243.25,768.75,250.5,768.75,255,769.25,260.75,769.75,266.5,769.75,272.5,768,277.75,765.5,282.5,761,289,756,296.5,751,302.75,747.5,307.5,745.25,310.5,744.75,319.5,749.75,319.5,759.75,317,767.25,312.5,776.5,307.5,770.75,312,761,316,751.75,319.75,744.75,322,743,324.5,738.75,332.25,737,338,736.5,344.5,736.5,350.5,736.75,355.5,737.75,361,738.25,363.75,743.5,361,750,357.75,755,357,758,358.5,762,359,766.75,358.5,769,362.5,772.75,362,776.75,361.5,779.75,362.25,782.75,363.5,784.5,364.5,786.5,367.25,788.5,370,790,373.5,793.75,376.25,797.75,379.25,800.75,383,801.25,387,804.75,390.25,808.25,393.5,813.25,396.5,821,398.75,827.75,401,833.75,403.5,840.75,405.75,843.75,408,850.25,413.5,852,419.5,854,427,856,432.5,858.75,437.75,864.5,441.5,871.25,446.75,877,451.25,880.5,455.5,886.5,457.75,892.25,460,899,461.5,902.5,464.5,904.25,469.25,901.75,474,898.5,477.5,897.75,481.75,899.5,485,901.5,489.25,905.75,491.25,913.25,489.75,919.25,488,923.75,488.5,926.5,492,928,496,925,500.5,922,505.75,919,508.75,918,512.75,918.75,515.75,920.75,517,924,518,929.5,520.75,933.75,524,935,527.75,935,531.75,934.25,536,932.25,538.75,930.5,544.25,928.25,547,925,556.25,924.75,560.75,925,564.5,925,567.75,925,572.25,926.5,577.5,928.25,581.75,930,587.75,931,592.75,932,600.75,932,605.5,931.75,607.5,929.25,605,939.5,600.5,941.75,595.75,944.25,591.5,948.25,589.25,950.25,587.75,956,585.5,960,584.25,967.5,582.5,979,581.75,983.25,583,987.25,584.5,993,588.5,1000.5,593,1006.75,596.5,1014,599.75,1021.25,604,1027,606.75,1028.5,607.25,1023.25,611.5,1018.75,616,1017.25,619.5,1015.5,626,1014.25,631.5,1013.5,635.5,1013.5,640.75,1013,645,1013,651.5,1014,658,1013,662.5,1015.5,668.25,1018,675.5,1020,681.75,1021.75,689.5,1023.25,694.5,1024,700,1029.5,704,1031.75,705.5,1038,704.25,1041.25,703.25,1045.25,700.5,1051.5,700.25,1056.25,700.5,1061,703.5,1066.25,704.25,1069.75,704.25,1068,696.5,1066.75,687.25,1066,676.75,1066,666.75,1064.5,660.25,1059.25,657,1052.75,655,1057.5,653.5,1062.25,651.5,1066,649.5,1072.5,640,1081.5,637.25,1092,638.75,1096.75,638.25,1104.25,638.25,1104.5,639.25,1103,645.5,1103.5,651,1103.5,654.25,1104.5,661,1105.75,666.5,1106.5,670.5";

  const offsetX = -0.7; // Offset for X-axis
  const offsetY = -0.85; // Offset for Y-axis
  const scaleFactor = 0.0018;
  const normalizedSVG = normalizeSVGPoints(
    svgPoints,
    offsetX,
    offsetY,
    scaleFactor
  );

  // Convert points into THREE.Vector3 objects
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

  // Scale points
  const scaledPoints = pointsArray.map((point) => {
    return new THREE.Vector3(point.x, point.y, point.z + 0.1);
  });

  // Create curve and flip Y-axis
  const curve = new THREE.CatmullRomCurve3(scaledPoints);
  const curvePoints = curve.getPoints(100);
  const flippedCurvePoints = curvePoints.map(
    (point) => new THREE.Vector3(point.x, -point.y, point.z)
  );

  const splitIndex = Math.floor(flippedCurvePoints.length * percentage);
  const redPathPoints = flippedCurvePoints.slice(0, splitIndex);
  const bluePathPoints = flippedCurvePoints.slice(
    splitIndex,
    flippedCurvePoints.length
  );

  useEffect(() => {
    if (!pathRef.current || !cameraRef.current) return;

    const cameraOffset = new THREE.Vector3(0, -1, 0.5);
    const animation = gsap.timeline();

    // Animate camera to move along the red path for 5 seconds
    animation.to(
      { progress: 0 },
      {
        progress: 1,
        duration: 5,
        onUpdate: () => {
          const progress = animation.progress();
          const currentIndex = Math.floor(
            progress * (redPathPoints.length - 1)
          );
          const currentPoint = redPathPoints[currentIndex];

          if (!currentPoint) return;
          if (cameraRef.current) {
            cameraRef.current.position.set(
              currentPoint.x + cameraOffset.x,
              currentPoint.y + cameraOffset.y,
              currentPoint.z + cameraOffset.z
            );
            cameraRef.current.lookAt(currentPoint);
          }
        },
      }
    );
  }, [redPathPoints]);

  useFrame(() => {
    if (!cameraRef.current || !redPathPoints.length) return;

    // Interpolate camera position based on slider progress
    const currentIndex = Math.floor(progress * (redPathPoints.length - 1));
    const currentPoint = redPathPoints[currentIndex];

    if (!currentPoint) return;

    const cameraOffset = new THREE.Vector3(0, -1, 0.5);

    if (cameraRef.current) {
      cameraRef.current.position.set(
        currentPoint.x + cameraOffset.x,
        currentPoint.y + cameraOffset.y,
        currentPoint.z + cameraOffset.z
      );
      cameraRef.current.lookAt(currentPoint);
    }
  });

  return (
    <>
      {/* Red path (30% of the path) */}
      <line ref={pathRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                redPathPoints.flatMap((point) => [point.x, point.y, point.z])
              ),
              3, // Size per vertex (x, y, z)
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color={0xff0000} />
      </line>

      {/* Blue path (entire path) */}
      <line ref={fullPathRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                bluePathPoints.flatMap((point) => [point.x, point.y, point.z])
              ),
              3, // Size per vertex (x, y, z)
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color={0x0000ff} />
      </line>

      {friends.map((friend, index) => {
        const boxPosition = curve.getPointAt(friend.percentage);

        return (
          <Html
            key={index}
            position={[boxPosition.x, -boxPosition.y, boxPosition.z]}
            center
            distanceFactor={1} // Adjust size relative to the scene
          >
            <div
              style={{
                background: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
                pointerEvents: "auto", // Enable hover and click interactions
                color: "black",
              }}
            >
              {/* <img src={friend.picture} alt="" /> */}
              {friend.username}
            </div>
          </Html>
        );
      })}

      {/* Camera */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={75}
        near={0.001}
        far={10}
        position={[0, -0.1, 1]}
      />
    </>
  );
}

function normalizeSVGPoints(svgPoints, offsetX = 0, offsetY = 0, scale = 1) {
  const pointsArray = svgPoints.split(",").map(Number);

  let minX = Infinity;
  let minY = Infinity;

  // Find minimum values for normalization
  for (let i = 0; i < pointsArray.length; i += 2) {
    minX = Math.min(minX, pointsArray[i]);
    minY = Math.min(minY, pointsArray[i + 1]);
  }

  // Normalize points and apply offsets and scaling
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
