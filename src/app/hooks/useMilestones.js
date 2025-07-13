import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export function useMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [newMilestoneUnlocked, setNewMilestoneUnlocked] = useState(null);
  const [userDistance, setUserDistance] = useState(0);
  const { user, token } = useAuth();

  // Charger les milestones depuis l'API backend
  useEffect(() => {
    const loadMilestones = async () => {
      try {
        const response = await fetch(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/getMilestones`
        );
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des milestones');
        }
        
        const data = await response.json();
        
        if (data.success && data.milestones) {
          setMilestones(data.milestones);
          console.log('📍 Milestones chargées depuis l\'API:', data.milestones.length, 'éléments');
          if (data.cached) {
            console.log('⚡ Données en cache utilisées');
          }
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des milestones:', error);
        
        // Fallback : essayer de charger depuis le fichier local
        try {
          const fallbackResponse = await fetch('/walk.json');
          const fallbackData = await fallbackResponse.json();
          const milestonesArray = Object.values(fallbackData).sort((a, b) => a.km - b.km);
          setMilestones(milestonesArray);
          console.log('📍 Fallback: Milestones chargées depuis le fichier local');
        } catch (fallbackError) {
          console.error('Erreur fallback:', fallbackError);
        }
      }
    };

    loadMilestones();
  }, []);

  // Fonction pour mettre à jour la distance utilisateur
  const updateUserDistance = async (newDistance) => {
    const previousDistance = userDistance;
    setUserDistance(newDistance);

    // Vérifier s'il y a une nouvelle milestone via l'API (avec cooldown)
    if (token && user?.id) {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/checkNewMilestone`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { userId: user.id }
          }
        );

        // ✅ Gérer le cooldown
        if (response.data.cooldown) {
          console.log('⏰ Cooldown actif - vérification milestone ignorée');
          return;
        }

        if (response.data.has_new_milestone) {
          const newMilestone = response.data.new_milestone;
          setNewMilestoneUnlocked(newMilestone);
          setCurrentMilestone(newMilestone);
          
          console.log('🎉 Nouvelle milestone détectée:', newMilestone);
          console.log('🔍 Debug eligible kms:', response.data.debug_eligible_kms);
          
          // Déclencher une notification si possible
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nouvelle destination atteinte !', {
              body: `Vous avez atteint ${getLocationName(newMilestone.km)} !`,
              icon: '/logo.svg'
            });
          }

          // Auto-clear après 5 secondes
          setTimeout(() => {
            setNewMilestoneUnlocked(null);
          }, 5000);
        } else {
          console.log('ℹ️ Aucune nouvelle milestone trouvée');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des milestones:', error);
      }
    }
  };

  // Marquer une milestone comme vue
  const markMilestoneAsSeen = async (milestoneKm) => {
    if (!token || !user?.id) return;

    try {
      await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/updateLastMilestone`,
        { milestone_km: milestoneKm },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId: user.id }
        }
      );
      console.log('✅ Milestone marquée comme vue:', milestoneKm);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la milestone:', error);
    }
  };

  // Fermer une milestone et la marquer comme vue
  const closeMilestone = (milestone) => {
    if (milestone) {
      markMilestoneAsSeen(milestone.km);
    }
    setNewMilestoneUnlocked(null);
  };

  // Obtenir le nom du lieu basé sur la distance
  const getLocationName = (km) => {
    if (km <= 50) return "La Comté";
    if (km <= 120) return "Bree";
    if (km <= 300) return "Fondcombe";
    if (km <= 450) return "La Moria";
    if (km <= 600) return "Lothlórien";
    if (km <= 1000) return "Les Marais Morts";
    if (km <= 1400) return "Le Mordor";
    return "Terres Inconnues";
  };

  // Obtenir les milestones débloquées
  const getUnlockedMilestones = () => {
    return milestones.filter(milestone => milestone.km <= userDistance);
  };

  // Obtenir la prochaine milestone
  const getNextMilestone = () => {
    return milestones.find(milestone => milestone.km > userDistance);
  };

  // Calculer le pourcentage de progression vers la prochaine milestone
  const getProgressToNext = () => {
    const lastUnlocked = getUnlockedMilestones().slice(-1)[0];
    const nextMilestone = getNextMilestone();
    
    if (!lastUnlocked || !nextMilestone) return 0;
    
    const distanceFromLast = userDistance - lastUnlocked.km;
    const totalDistanceToNext = nextMilestone.km - lastUnlocked.km;
    
    return Math.min((distanceFromLast / totalDistanceToNext) * 100, 100);
  };

  return {
    milestones,
    currentMilestone,
    newMilestoneUnlocked,
    userDistance,
    updateUserDistance,
    getUnlockedMilestones,
    getNextMilestone,
    getLocationName,
    getProgressToNext,
    closeMilestone, // Nouvelle fonction
    markMilestoneAsSeen, // Nouvelle fonction
    setNewMilestoneUnlocked // Pour fermer manuellement les notifications
  };
}