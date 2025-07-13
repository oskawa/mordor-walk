"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./maptwo.module.scss";
import { useAuth } from "../../context/AuthContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

interface Friend {
  id: string;
  username: string;
  picture?: string;
  current_year_total: string | number;
  totalDistance: number;
  percentage: number;
  imageLoaded?: HTMLImageElement; // Ajout pour preload
}

interface Milestone {
  km: number;
  content_citation?: string;
  img?: string;
  book?: string;
  chapter?: string;
  message?: string;
  next_destination?: string;
}

interface POIPopup {
  x: number;
  y: number;
  milestone: Milestone;
}

export default function Maptwo() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [percentage, setPercentage] = useState(0.0);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false); // Nouveau state pour tracker le drag
  const [offset, setOffset] = useState({ x: -400, y: -250 }); // Décalage initial : 50px droite, 50px bas
  const [svgContent, setSvgContent] = useState("");
  const [popupInfo, setPopupInfo] = useState<POIPopup | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, token } = useAuth();

  // Charger le JSON des milestones
  useEffect(() => {
    const loadMilestones = async () => {
      try {
        const response = await fetch('/walk.json');
        const data = await response.json();
        
        const milestonesArray = Object.values(data) as Milestone[];
        const sortedMilestones = milestonesArray.sort((a, b) => a.km - b.km);
        setMilestones(sortedMilestones);
      } catch (error) {
        console.error('Erreur lors du chargement des milestones:', error);
      }
    };

    loadMilestones();
  }, []);

  // Charger le SVG
  const loadSVG = async () => {
    const response = await fetch("./three/path.svg");
    const svg = await response.text();
    setSvgContent(svg);
  };

  const extractPathData = (svgContent: string) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const pathElement = svgDoc.querySelector("path");
    return pathElement ? pathElement.getAttribute("d") : "";
  };

  useEffect(() => {
    loadSVG();
  }, []);

  // Récupérer les données utilisateur
  useEffect(() => {
    if (!token || !user?.id) return;

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId: user.id },
        }
      )
      .then((response) => {
        if (response.data.activities?.stats?.current_year_total) {
          const totalDistance = 1400;
          const distance = response.data.activities.stats.current_year_total;
          const userPercentage = Math.min(distance / totalDistance, 1);
          setPercentage(userPercentage);
          setCurrentDistance(distance);
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [token, user]);

  // Récupérer les amis et preload leurs images
  useEffect(() => {
    if (!token || !user?.id) return;

    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId: user.id },
        }
      )
      .then((response) => {
        
        const totalDistance = 1400;
        const friendsArray = Array.isArray(response.data) 
          ? response.data 
          : Object.values(response.data);
        
        const processedFriends = friendsArray.map((friend: any) => {
          const friendDistance = typeof friend.current_year_total === 'string' 
            ? parseFloat(friend.current_year_total) 
            : (friend.current_year_total || 0);
            
          const friendPercentage = Math.min(friendDistance / totalDistance, 1);
          
          
          return { 
            ...friend, 
            current_year_total: friendDistance,
            percentage: friendPercentage 
          };
        });

        // Preload des images des amis
        preloadFriendImages(processedFriends);
      })
      .catch((error) => {
        console.error("Error fetching friends:", error);
      });
  }, [token, user]);

  // Fonction pour preload les images des amis
  const preloadFriendImages = async (friendsList: Friend[]) => {
    const friendsWithImages = await Promise.all(
      friendsList.map(async (friend) => {
        return new Promise<Friend>((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ ...friend, imageLoaded: img });
          };
          img.onerror = () => {
            // Si l'image échoue, utiliser l'image par défaut
            const defaultImg = new Image();
            defaultImg.onload = () => {
              resolve({ ...friend, imageLoaded: defaultImg });
            };
            defaultImg.src = "./profile.svg";
          };
          img.src = friend.picture || "./profile.svg";
        });
      })
    );

    setFriends(friendsWithImages);
    setImagesLoaded(true);
  };

  // Obtenir les milestones débloquées
  const getUnlockedMilestones = () => {
    return milestones.filter(milestone => milestone.km <= currentDistance);
  };

  // Fonction pour dessiner sur le canvas
  useEffect(() => {
    if (svgContent && milestones.length > 0 && imagesLoaded) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
      const pathElement = svgDoc.querySelector("path");
      if (!pathElement) return;

      const totalLength = pathElement.getTotalLength();
      const pathData = extractPathData(svgContent);
      const path = new Path2D(pathData);

      const image = new Image();
      image.src = "./three/albedo.png";

      image.onload = () => {
        // Clear complet du canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(zoom, 0, 0, zoom, 0, 0);

        const startX = 517;
        const startY = 438;
        
        ctx.drawImage(image, offset.x, offset.y, image.width, image.height);

        ctx.save();
        ctx.translate(startX + offset.x, startY + offset.y);

        // Dessiner le tracé parcouru (vert)
        ctx.strokeStyle = `#00c8a0`;
        ctx.lineWidth = 5;
        const userLength = percentage * totalLength;

        ctx.save();
        ctx.setLineDash([userLength, totalLength - userLength]);
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        // Dessiner le tracé restant (gris)
        ctx.save();
        ctx.strokeStyle = `#0A0A0A`;
        ctx.setLineDash([0, userLength, totalLength - userLength]);
        ctx.beginPath();
        ctx.stroke(path);
        ctx.restore();

        // Dessiner les points d'intérêt (POI)
        const unlockedMilestones = getUnlockedMilestones();
        
        unlockedMilestones.forEach((milestone) => {
          const milestoneProgress = milestone.km / 1400;
          const milestoneLength = milestoneProgress * totalLength;
          const point = pathElement.getPointAtLength(milestoneLength);
          
          // Point cliquable - cercle doré
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = "#00c8a0";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Zone de clic debug (cercle rouge transparent)
          ctx.beginPath();
          ctx.arc(point.x, point.y, 15, 0, 2 * Math.PI);
          ctx.strokeStyle = "00c8a0";
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Icône du lieu
          ctx.font = "14px serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText("", point.x, point.y + 4);
        });

        // Dessiner les amis (maintenant avec images preloadées)
      
        friends.forEach((friend) => {
          if (friend.percentage > 0 && friend.imageLoaded) {
            const friendLength = friend.percentage * totalLength;
            const point = pathElement.getPointAtLength(friendLength);
            
            
            const imageSize = 40;
            const friendX = point.x;
            const friendY = point.y - 35;
            
            ctx.save();
            
            // Cercle de fond
            ctx.beginPath();
            ctx.arc(friendX, friendY, imageSize / 2, 0, 2 * Math.PI);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.strokeStyle = "#00c8a0";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Clip et dessiner l'image preloadée
            ctx.clip();
            ctx.drawImage(
              friend.imageLoaded,
              friendX - imageSize / 2,
              friendY - imageSize / 2,
              imageSize,
              imageSize
            );
            
            ctx.restore();
            
            // Nom de l'ami avec fond
            if (friend.username) {
              ctx.font = "bold 12px Arial";
              ctx.textAlign = "center";
              
              // Fond du texte
              const textWidth = ctx.measureText(friend.username).width;
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(friendX - textWidth/2 - 4, friendY + 25, textWidth + 8, 16);
              
              // Texte
              ctx.fillStyle = "#fff";
              ctx.fillText(friend.username, friendX, friendY + 36);
            }
          }
        });

        ctx.restore();
      };
    }
  }, [svgContent, offset, percentage, friends, zoom, milestones, currentDistance, imagesLoaded]);

  // Gestion des clics sur les POI
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Si on vient de draguer, ne pas traiter le clic
    if (hasDragged) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !svgContent) return;

    const rect = canvas.getBoundingClientRect();
    
    // Ratio entre la taille réelle du canvas et sa taille affichée (pour responsive)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Coordonnées du clic ajustées au ratio responsive
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    // Convertir en coordonnées monde (en tenant compte du zoom et offset)
    const worldX = canvasX / zoom;
    const worldY = canvasY / zoom;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const pathElement = svgDoc.querySelector("path");
    if (!pathElement) return;

    const totalLength = pathElement.getTotalLength();
    const startX = 517 + offset.x;
    const startY = 438 + offset.y;

    // Vérifier si on a cliqué sur un POI
    const unlockedMilestones = getUnlockedMilestones();
    for (const milestone of unlockedMilestones) {
      const milestoneProgress = milestone.km / 1400;
      const milestoneLength = milestoneProgress * totalLength;
      const point = pathElement.getPointAtLength(milestoneLength);
      
      // Position du POI dans les coordonnées monde
      const poiX = startX + point.x;
      const poiY = startY + point.y;
      
      const distance = Math.sqrt(
        Math.pow(worldX - poiX, 2) + Math.pow(worldY - poiY, 2)
      );
      
      // Zone de clic adaptative selon l'écran
      const clickRadius = window.innerWidth < 768 ? 25 : 15;
      
      if (distance <= clickRadius) {
        setPopupInfo({
          x: e.clientX,
          y: e.clientY,
          milestone
        });
        return;
      }
    }
    
    setPopupInfo(null);
  };

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setHasDragged(false); // Reset du flag drag
      setStartPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    // Calculer la distance du mouvement
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si on bouge de plus de 5px, c'est un drag
    if (moveDistance > 5) {
      setHasDragged(true);
    }
    
    const newOffset = {
      x: offset.x + deltaX / zoom,
      y: offset.y + deltaY / zoom,
    };
    setOffset(newOffset);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reset du flag après un petit délai pour éviter le clic immédiat
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  // Gestion du touch pour mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setHasDragged(false);
    setStartPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    e.preventDefault(); // Empêche le scroll de la page
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosition.x;
    const deltaY = touch.clientY - startPosition.y;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si on bouge de plus de 5px, c'est un drag
    if (moveDistance > 5) {
      setHasDragged(true);
    }
    
    const newOffset = {
      x: offset.x + deltaX / zoom,
      y: offset.y + deltaY / zoom,
    };
    setOffset(newOffset);
    setStartPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Reset du flag après un petit délai
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  // Gestion du zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * zoomFactor)));
  };

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.zoomControls}>
          <button onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}>+</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.max(0.5, prev * 0.8))}>-</button>
        </div>
        <div className={styles.info}>
          <span>{currentDistance} km / 1400 km</span>
        </div>
        
      </div>

      <canvas
        ref={canvasRef}
        width={1500}
        height={1500}
        className={styles.canvasMap}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Gérer le cas où la souris sort du canvas
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      {/* Popup POI */}
      {popupInfo && (
        <div 
          className={styles.poiPopup}
          style={{
            left: Math.min(popupInfo.x + 10, window.innerWidth - 320),
            top: Math.max(popupInfo.y - 200, 10),
          }}
        >
          <button 
            className={styles.closePopup}
            onClick={() => setPopupInfo(null)}
          >
            ×
          </button>
          
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <span className={styles.kmBadge}>{popupInfo.milestone.km} km</span>
              <h3>Point d'intérêt</h3>
            </div>
            
            {popupInfo.milestone.img && (
              <div 
                className={styles.popupImage}
                style={{ backgroundImage: `url(${popupInfo.milestone.img})` }}
              />
            )}
            
            <div className={styles.popupText}>
              {popupInfo.milestone.content_citation && (
                <blockquote>"{popupInfo.milestone.content_citation}"</blockquote>
              )}
              
              {(popupInfo.milestone.chapter || popupInfo.milestone.book) && (
                <div className={styles.source}>
                  {popupInfo.milestone.chapter && <strong>{popupInfo.milestone.chapter}</strong>}
                  {popupInfo.milestone.book && <em>{popupInfo.milestone.book}</em>}
                </div>
              )}
              
              {popupInfo.milestone.message && (
                <p className={styles.message}>{popupInfo.milestone.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}