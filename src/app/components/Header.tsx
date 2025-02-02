import Link from "next/link";
import styles from "./header.module.scss";
import PopUp from "../pwapopup";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/">
          <img src="./logo.svg" alt="" />
        </Link>
      </div>
      <div className={styles.headerRight}>
        <PopUp />
        <Link href="/profile">
          <div className={styles.headerRight__img}>
            <img src="./header/profile.svg" alt="" />
          </div>
        </Link>
      </div>
    </header>
  );
}
