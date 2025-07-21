import styles from "./progress.module.scss";

export default function GroupDestinationsProgress({
  destinationsProgress,
  showTitle = true,
}) {
  if (!destinationsProgress || destinationsProgress.length === 0) {
    return (
      <div className={styles.destinationsProgress}>
        {showTitle && <h3>Parcours du groupe {new Date().getFullYear()}</h3>}
        <div className={styles.noProgress}>
          <p>Aucune activité enregistrée pour ce groupe.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      
      <div className={styles.destinationsProgress}>
        
        <div className={styles.destinationsList}>
          {destinationsProgress.map((destination, index) => (
            <div key={index} className={styles.destinationItem}>
              <div className={styles.destinationHeader}>
                <h4 style={{ color: "white" }}>
                  {destination.name}
                  {destination.completed > 0 && (
                    <span className={styles.completedBadge}>
                      ×{destination.completed}{" "}
                      {destination.completed === 1 ? "fois" : "fois"}
                    </span>
                  )}
                </h4>
              </div>
              <div className={styles.profileEdit__chart}>
                <span
                  style={{
                    width: `${destination.percentage}%`,
                    backgroundColor: destination.color,
                  }}
                ></span>
              </div>

              <div className={styles.destinationFooter}>
                <span className={styles.percentage}>
                  {destination.percentage.toFixed(1)}%
                </span>
                <div className={styles.kmInfo}>
                  {destination.remaining_km > 0 && (
                    <span className={styles.remaining}>
                      {destination.remaining_km.toFixed(1)} km restants
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
