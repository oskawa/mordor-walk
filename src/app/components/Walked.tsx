"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./walked.module.scss";
import MilestoneNotification from "./MilestoneNotification";
import { useAuth } from "../../context/AuthContext";
import * as useMilestones from "../hooks/useMilestones";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

interface DataItem {
  km: number;
  content_citation?: string;
  img?: string;
  book?: string;
  chapter?: string;
  message?: string;
  next_destination?: string;
}

export default function Walked() {
  const [filteredContent, setFilteredContent] = useState<DataItem[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const { user, token } = useAuth();

  // Utiliser notre hook de milestones
  const {
    newMilestoneUnlocked,
    updateUserDistance,
    getNextMilestone,
    getUnlockedMilestones,
    getProgressToNext,
    closeMilestone, // ✅ Ajouter closeMilestone
  } = useMilestones.useMilestones();

  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    // Fetch user data on mount
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
          const distance = response.data.activities.stats.current_year_total;
          setCurrentDistance(distance);

          // Mettre à jour la distance dans le système de milestones
          updateUserDistance(distance);
        } else {
          console.warn("Unexpected response format", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [token, user, updateUserDistance]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // Fetch the JSON file from the public folder
  //       const response = await fetch("/walk.json");
  //       const data: Record<string, DataItem> = await response.json();

  //       // Filter the JSON data
  //       const filtered = Object.values(data)
  //         .filter((item) => Number(item.km) <= currentDistance)
  //         .map((item) => ({
  //           content_citation: item.content_citation,
  //           km: item.km,
  //           img: item.img,
  //           book: item.book,
  //           chapter: item.chapter,
  //           message: item.message,
  //           next_destination: item.next_destination,
  //         }))
  //         .filter(Boolean)
  //         .sort((a, b) => b.km - a.km); // Trier par distance décroissante (plus récent en premier)

  //       setFilteredContent(filtered);
  //     } catch (error) {
  //       console.error("Error fetching JSON data:", error);
  //     }
  //   };

  //   fetchData();
  // }, [currentDistance]);

  // Prochaine milestone pour affichage

  const unlockedMilestones = getUnlockedMilestones();

  const nextMilestone = getNextMilestone();
  const progressToNext = getProgressToNext();

  return (
    <>
      <div className={styles.walkedInner}>
        <div className={styles.heading}>
          <h1>TIMELINE 2025</h1>
          <p>
            Votre progression actuelle : <strong>{currentDistance} km</strong> /
            1400 km
          </p>

          {/* Affichage de la prochaine milestone */}
          {nextMilestone && (
            <div className={styles.nextMilestone}>
              <h3>Prochaine destination : {nextMilestone.next_destination}</h3>
              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <p>
                {nextMilestone.km - currentDistance} km restants (
                {Math.round(progressToNext)}% de progression)
              </p>
            </div>
          )}

          <p>
            Dès que vous aurez fait une activité, vous verrez votre timeline
            s'afficher au fur et à mesure...
          </p>
        </div>

        <ul>
          {unlockedMilestones.map((item, index) => (
            <li key={index} className={styles.milestoneItem}>
              <div className={styles.walkedInner__img}>
                <img src={item.img} alt="" />
                <div className={styles.walkedInner__km}>{item.km}</div>
                <div className={styles.walkedInner__kmWhite}>{item.km} km</div>
              </div>
              <div className={styles.walkedInner__content}>
                <blockquote>{item.content_citation}</blockquote>
                <div className={styles.walkedInner__contentCitation}>
                  <p>
                    {item.chapter} - {item.book}
                  </p>
                </div>
                {item.message && (
                  <div className={styles.milestoneMessage}>
                    <p>{item.message}</p>
                  </div>
                )}
                {item.next_destination && (
                  <div className={styles.nextDestination}>
                    <span>Prochaine destination : {item.next_destination}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {filteredContent.length === 0 && (
          <div className={styles.emptyState}>
            <h3>Votre aventure commence ici...</h3>
            <p>
              Faites votre première activité pour débloquer votre premier
              milestone !
            </p>
          </div>
        )}
      </div>

      {/* Notification de nouvelle milestone */}
      {newMilestoneUnlocked && (
        <MilestoneNotification
          milestone={newMilestoneUnlocked}
          onClose={closeMilestone} // ✅ Utiliser closeMilestone au lieu de setNewMilestoneUnlocked
        />
      )}
    </>
  );
}
