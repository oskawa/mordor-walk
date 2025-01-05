"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { CustomPlane } from "./Plane";
import { CustomPointLight } from "./pointLight";
import { Controls } from "./controls";
import { PathMordor } from "./PathMordor";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./map.module.scss";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
const WORDPRESS_REST_ENDPOINT = process.env.WORDPRESS_REST_ENDPOINT;

export default function Scene({ setActiveMenu }) {
  const [progress, setProgress] = useState(100);
  const [percentage, setPercentage] = useState(0.3); // Progress state (0 to 1)
  const [friends, setFriends] = useState([]); // Progress state (0 to 1)
  const [currentDistance, setcurrentDistance] = useState(0); // Progress state (0 to 1)
  const [percentageDistance, setpercentageDistance] = useState(0); // Progress state (0 to 1)

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const perc = currentDistance * progress;
    setpercentageDistance(perc);
  }, [progress]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("token");
      const localUserId = localStorage.getItem("userId");
      console.log(localToken);
      console.log(localUserId);

      setToken(localToken);
      setUserId(localUserId);

      if (!localToken || !localUserId) {
        console.error("Missing token or userId in localStorage");
        return;
      }
      // Fetch user data on mount
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
          {
            headers: {
              Authorization: `Bearer ${localToken}`,
            },
            params: {
              userId: localUserId,
            },
          }
        )
        .then((response) => {
          if (response.data.activities?.stats?.total_distance_km) {
            const totalDistance = 1400;
            const currentDistance =
              response.data.activities.stats.total_distance_km;
            const percentage = Math.min(currentDistance / totalDistance, 1); // Ensure the value doesn't exceed 1
            setPercentage(percentage);
            setcurrentDistance(currentDistance);
          } else {
            console.warn("Unexpected response format", response.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []); // Dependencies

  useEffect(() => {
    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: userId,
          },
        }
      )
      .then((response) => {
        const totalDistance = 1400;

        // Map over the array to calculate and add the percentage for each friend
        const updatedFriends = response.data.map((friend) => {
          const percentage = Math.min(friend.totalDistance / totalDistance, 1); // Calculate percentage
          return {
            ...friend, // Keep all existing properties
            percentage, // Add the percentage property
          };
        });

        // Update state with the modified array
        setFriends(updatedFriends);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [token, userId]);

  // Handle slider change
  const handleSliderChange = (e) => {
    setProgress(parseFloat(e.target.value));
  };
  return (
    <>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={progress}
          onChange={handleSliderChange}
          style={{ width: 300 }}
        />
        {percentageDistance} /{currentDistance}km
      </div>
      <Canvas style={{ height: "100vh" }}>
        <CustomPlane />
        <gridHelper args={[10, 10]} />
        <CustomPointLight />
        <PathMordor
          progress={progress}
          percentage={percentage}
          friends={friends}
        />
      </Canvas>
      <button
        className={styles.switchScene}
        onClick={() => setActiveMenu("walked")}
      >
        Voir mon trajet
      </button>
    </>
  );
}
