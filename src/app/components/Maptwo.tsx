"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./maptwo.module.scss";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
const WORDPRESS_REST_ENDPOINT = process.env.WORDPRESS_REST_ENDPOINT;

export default function Maptwo() {
  const [progress, setProgress] = useState(100);
  const [percentage, setPercentage] = useState(0.0); // Progress state (0 to 1)
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

  const setCanvasSize = (canvas) => {
    const container = canvas.parentElement; // Assuming the canvas has a parent container
    canvas.width = container.clientWidth; // Match the container's width
    canvas.height = container.clientHeight; // Match the container's height
  };

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
      let drawWidth, drawHeight, offsetX, offsetY;
      // Set up the canvas and animation
      const image = new Image();
      image.src = "./three/albedo.png"; // Background image URL

      image.onload = () => {
        // Clear canvas and draw background image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation matrix
        // Path starting position (400px from top and 250px from left)
        const startX = 517;
        const startY = 438;
        ctx.scale(1.5, 1.5);

        const pathWidth = 735;
        const pathHeight = 773;
        const canvasWidth = canvas.width; // Canvas width
        const canvasHeight = canvas.height; // Canvas width
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = image.width / image.height;

        if (imageAspect > canvasAspect) {
          // Image is wider than canvas
          drawWidth = canvas.width;
          drawHeight = canvas.width / imageAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller than canvas
          drawHeight = canvas.height;
          drawWidth = canvas.height * imageAspect;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        }
        ctx.drawImage(image, offset.x, offset.y, image.width, image.height);

        // Apply translation and scaling to the context
        ctx.save();
        ctx.translate(startX + offset.x, startY + offset.y); // Move the path's origin

        ctx.strokeStyle = `#00c8a0`; // Apply opacity based on progress
        ctx.lineWidth = 5;
        const length = percentage * totalLength;

        ctx.save();
        ctx.setLineDash([length, totalLength - length]); // Create a dash pattern based on the percentage
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = `#0A0A0A`; // Color for the remaining portion
        ctx.setLineDash([0, length, totalLength - length]); // Dash pattern to show remaining portion
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        if (friends.length > 1) {
          friends.forEach((friend) => {
            const totalDistance = 1400;
            let friendCurrentYear = friend.current_year_total ?? 0
            const friendPercentage = Math.min(
              friendCurrentYear / totalDistance,
              1
            ); // Ensure the value doesn't exceed 1
            const length = ((friendPercentage * 100) / 100) * totalLength; // Calculate length along the path
            // Get the coordinates of the point at the specified length
            const point = pathElement.getPointAtLength(length);
            const scaledX = point.x; // Scale and offset X
            const scaledY = point.y; // Scale and offset Y

            // Set up the image
            const imageSize = 50; // Image size (50x50)
            const img = new Image(); // Create a new image object

            // Use the friend's picture if available, or a default image if not
            const pictureSrc = friend.picture || "./profile.svg"; // Replace with your default image path
            const backgroundColor = "#d3d3d3";

            img.src = pictureSrc; // Set the image source

            img.onload = function () {
              ctx.save(); // Save the current canvas state

              // Draw a circle at the calculated position
              ctx.beginPath();
              ctx.arc(scaledX, scaledY, imageSize / 2, 0, 2 * Math.PI); // Circular path
              ctx.fillStyle = backgroundColor; // Set the background color
              ctx.fill();
              // ctx.arc(scaledX, scaledY, 5, 0, 2 * Math.PI);
              // ctx.fillStyle = "red"; // Example: Set circle color to red
              // ctx.fill();
              ctx.clip(); // Clip to the circular path
              ctx.drawImage(
                img,
                scaledX - imageSize / 2,
                scaledY - imageSize / 2,
                imageSize,
                imageSize
              );
              ctx.restore(); // Restore the canvas state
            };
            img.onerror = function () {
              console.error("Failed to load the image for friend:", friend); // Error handling if the image fails to load
            };
            // ctx.closePath();
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
          if (response.data.activities?.stats?.current_year_total) {
            const totalDistance = 1400;
            const currentDistance =
              response.data.activities.stats.current_year_total;
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
      <canvas
        ref={canvasRef}
        width={1500}
        height={1500}
        style={{ border: "1px solid black" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={styles.canvasMap}
      />
    </>
  );
}
