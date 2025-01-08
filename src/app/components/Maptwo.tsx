"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { CustomPlane } from "./Plane";
import { CustomPointLight } from "./pointLight";
import { Controls } from "./controls";
import { PathMordor } from "./PathMordor";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./maptwo.module.scss";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
const WORDPRESS_REST_ENDPOINT = process.env.WORDPRESS_REST_ENDPOINT;

export default function Maptwo() {
  const [progress, setProgress] = useState(100);
  const [percentage, setPercentage] = useState(0.3); // Progress state (0 to 1)
  const [friends, setFriends] = useState([]); // Progress state (0 to 1)
  const [currentDistance, setcurrentDistance] = useState(0); // Progress state (0 to 1)
  const [percentageDistance, setpercentageDistance] = useState(0); // Progress state (0 to 1)
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // For scrolling
  const [svgContent, setSvgContent] = useState("");
  const totalLength = 500; // You may need to calculate the length or approximate it

  const loadSVG = async () => {
    const response = await fetch("./three/path.svg"); // Provide the correct path to your SVG file
    const svg = await response.text();
    setSvgContent(svg); // Store the SVG content
  };

  const extractPathData = (svgContent) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const pathElement = svgDoc.querySelector("path"); // Extract the first path element
    return pathElement ? pathElement.getAttribute("d") : ""; // Get the 'd' attribute of the path
  };

  // Function to calculate the bounding box of a path

  useEffect(() => {
    loadSVG();
  }, []);

  useEffect(() => {
    if (svgContent) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

      // Extract the first path element from the SVG
      const pathElement = svgDoc.querySelector("path");
      if (!pathElement) {
        console.error("No path element found in SVG content.");
        return;
      }
      const totalLength = pathElement.getTotalLength(); // Calculate the total length of the path

      const pathData = extractPathData(svgContent); // Get the path data from the SVG
      const path = new Path2D(pathData); // Create a Path2D from the extracted path data

      // Set up the canvas and animation
      const image = new Image();
      image.src = "./three/albedo.png"; // Background image URL

      image.onload = () => {
        // Clear canvas and draw background image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation matrix

        ctx.drawImage(image, offset.x, offset.y, image.width, image.height);
        // Path starting position (400px from top and 250px from left)
        const startX = 517;
        const startY = 438;

        const pathWidth = 735;
        const pathHeight = 773;
        const canvasWidth = canvas.width; // Canvas width
        const canvasHeight = canvas.height; // Canvas width
        const scaleX = canvasWidth / pathWidth; // Scale factor for the path
        const scaleY = canvasHeight / pathHeight; // Scale factor for the path

        // Apply translation and scaling to the context
        ctx.save();
        ctx.translate(startX + offset.x, startY + offset.y); // Move the path's origin
        ctx.scale(scaleX, scaleY); // Apply scaling to the canvas context

        ctx.strokeStyle = `rgba(0,0,0,1)`; // Apply opacity based on progress
        ctx.lineWidth = 5;
        const length = percentage * totalLength;

        ctx.save();
        ctx.setLineDash([length, totalLength - length]); // Create a dash pattern based on the percentage
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 0, 1)`; // Color for the remaining portion
        ctx.setLineDash([0, length, totalLength - length]); // Dash pattern to show remaining portion
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        if (friends.length > 1) {
          friends.forEach((friend) => {
            const totalDistance = 1400;
            const friendPercentage = Math.min(
              friend.totalDistance / totalDistance,
              1
            ); // Ensure the value doesn't exceed 1
            const length = ((friendPercentage * 100) / 100) * totalLength; // Calculate length along the path
            // Get the coordinates of the point at the specified length
            const point = pathElement.getPointAtLength(length);
            const scaledX = point.x * scaleX + startX + offset.x; // Scale and offset X
            const scaledY = point.y * scaleY + startY + offset.y; // Scale and offset Y

            // Draw a circle at the calculated position
            ctx.beginPath();
            ctx.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red"; // Example: Set circle color to red
            ctx.fill();
            ctx.closePath();
          });
        }
      };
    }
  }, [svgContent, offset, percentage, friends]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newOffset = {
      x: offset.x + e.clientX - startPosition.x,
      y: offset.y + e.clientY - startPosition.y,
    };
    setOffset(newOffset);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setStartPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset((prev) => ({
      x: prev.x + touch.clientX - startPosition.x,
      y: prev.y + touch.clientY - startPosition.y,
    }));
    setStartPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const perc = currentDistance * progress;
    setpercentageDistance(perc);
  }, [progress]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("token");
      const localUserId = localStorage.getItem("userId");

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
      <div style={{ position: "absolute", width: "100%", height: "100%" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: "1px solid black" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={styles.canvasMap}
        />
      </div>
    </>
  );
}
