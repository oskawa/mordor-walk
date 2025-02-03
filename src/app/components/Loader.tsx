import styles from "./loader.module.scss";
export default function Loader() {
  return (
    <div className={styles.loader}>
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
