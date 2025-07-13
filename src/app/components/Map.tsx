"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { CustomPlane } from "./Plane";
import { CustomPointLight } from "./pointLight";
import { InteractivePath } from "./PathMordor"; // Nouveau composant
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import * as useMilestones from "../hooks/useMilestones";
import MilestoneNotification from "./MilestoneNotification";
import { useLoading } from "../../context/LoadingContext";
import { NotificationManager } from "../../utils/NotificationManager";
import styles from "./map.module.scss";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function Scene() {
  const [percentage, setPercentage] = useState(0.3);
  const [friends, setFriends] = useState([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const { user, token } = useAuth();
  const { setLoading } = useLoading();

  // Utiliser notre système de milestones
  const {
    newMilestoneUnlocked,
    updateUserDistance,
    getUnlockedMilestones,
    setNewMilestoneUnlocked,
    milestones,
  } = useMilestones.useMilestones();

  // Récupérer les données utilisateur
  useEffect(() => {
    if (!token || !user?.id) return;

    setLoading(true);

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: user.id,
          },
        }
      )
      .then((response) => {
        if (response.data.activities?.stats?.current_year_total) {
          const totalDistance = 1400;
          const distance = response.data.activities.stats.current_year_total;
          const userPercentage = Math.min(distance / totalDistance, 1);
          setPercentage(userPercentage);
          setCurrentDistance(distance);

          // Mettre à jour le système de milestones
          updateUserDistance(distance);

          // Initialiser les notifications si première connexion
          NotificationManager.initialize();
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
  }, [token, user, updateUserDistance]);

  // Récupérer les amis
  useEffect(() => {
    if (!token || !user?.id) return;

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId: user.id,
          },
        }
      )
      .then((response) => {
        const totalDistance = 1400;

        // Traiter les données comme dans Maptwo
        const friendsArray = Array.isArray(response.data)
          ? response.data
          : Object.values(response.data);

        const updatedFriends = friendsArray.map((friend) => {
          const friendDistance =
            typeof friend.current_year_total === "string"
              ? parseFloat(friend.current_year_total)
              : friend.current_year_total || 0;

          const friendPercentage = Math.min(friendDistance / totalDistance, 1);

          return {
            ...friend,
            current_year_total: friendDistance,
            percentage: friendPercentage,
          };
        });

        setFriends(updatedFriends);
      })
      .catch((error) => {
        console.error("Error fetching friends:", error);
      });
  }, [token, user]);

  return (
    <>
      <div className={styles.mapInfo}>
        <div className={styles.progressInfo}>
          <span>{currentDistance} km / 1400 km</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${(currentDistance / 1400) * 100}%` }}
            />
          </div>
        </div>
        <div className={styles.instructions}>
          <p>
            🖱️ Clic gauche : Rotation | 🔍 Molette : Zoom | 📱 Clic droit :
            Panoramique
          </p>
          <p>📍 Cliquez sur les points d'intérêt pour découvrir l'histoire</p>
        </div>
      </div>

      <Canvas style={{ height: "100vh" }}>
        <CustomPlane />
        <CustomPointLight />

        {/* Navigation libre avec OrbitControls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={4}
          maxPolarAngle={Math.PI / 2.2}
          // SUPPRESSION du target fixe pour liberté complète
          // target={[0, 0, 0]}

          screenSpacePanning={true}
          panSpeed={1.2}
          rotateSpeed={0.8}
          zoomSpeed={1.0}
        />

        {/* Chemin interactif avec POI */}
        <InteractivePath
          percentage={percentage}
          friends={friends}
          milestones={milestones}
          unlockedMilestones={getUnlockedMilestones()}
        />

        {/* Caméra positionnée pour voir le terrain correctement */}
        <PerspectiveCamera
          makeDefault
          fov={60}
          near={0.001}
          far={10}
          position={[-0.5, 2, 1]} // Caméra au-dessus du terrain vertical
        />
      </Canvas>

      {/* Notification de milestone */}
      {newMilestoneUnlocked && (
        <MilestoneNotification
          milestone={newMilestoneUnlocked}
          onClose={() => setNewMilestoneUnlocked(null)}
        />
      )}
    </>
  );
}
