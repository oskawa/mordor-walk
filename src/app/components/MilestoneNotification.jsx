import { useEffect, useState } from 'react';
import styles from './milestone-notification.module.scss';

export default function MilestoneNotification({ milestone, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (milestone) {
      setIsVisible(true);
      
      // Auto-fermeture après 6 secondes (plus long pour laisser le temps de lire)
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [milestone]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose(milestone); // ✅ Passer la milestone pour la marquer comme vue
    }, 300);
  };

  if (!milestone || !isVisible) return null;

  return (
    <div 
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`${styles.notification} ${isClosing ? styles.slideOut : styles.slideIn}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={handleClose}>
          ✕
        </button>
        
        <div className={styles.header}>
          <div className={styles.icon}>🏆</div>
          <h2>Nouvelle destination atteinte !</h2>
        </div>

        <div 
          className={styles.imageContainer}
          style={{ backgroundImage: `url(${milestone.img})` }}
        >
          <div className={styles.kmBadge}>
            {milestone.km} km
          </div>
        </div>

        <div className={styles.content}>
          <blockquote className={styles.quote}>
            "{milestone.content_citation}"
          </blockquote>
          
          <div className={styles.source}>
            <strong>{milestone.chapter}</strong>
            <br />
            <em>{milestone.book}</em>
          </div>

          {milestone.message && (
            <div className={styles.message}>
              <p>{milestone.message}</p>
            </div>
          )}

          {milestone.next_destination && (
            <div className={styles.nextDestination}>
              <span>Prochaine destination :</span>
              <strong>{milestone.next_destination}</strong>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.shareBtn}>
            📱 Partager
          </button>
          <button className={styles.continueBtn} onClick={handleClose}>
            Continuer l'aventure
          </button>
        </div>
      </div>
    </div>
  );
}