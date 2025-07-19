import styles from "./progress.module.scss";

export default function DestinationsProgress({
  userProgress,
  showTitle = true,
}) {
  if (!userProgress || userProgress.length === 0) {
    return null;
  }
  console.log(userProgress);

  return (
    <div className={styles.destinationsProgress}>
      {showTitle && <h3>Parcours {new Date().getFullYear()}</h3>}

      <div className={styles.destinationsList}>
        {userProgress.map((destination, index) => (
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
              {destination.description && <p>{destination.description}</p>}
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
              {!destination.completed && (
                <span className={styles.remaining}>
                  {destination.remaining_km.toFixed(1)} km restants
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
