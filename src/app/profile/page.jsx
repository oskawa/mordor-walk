"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FriendsComponent from "../components/profile/FriendsComponent";
import OverviewComponent from "../components/profile/OverviewComponent";
import StravaComponent from "../components/profile/StravaComponent";
import styles from "./profile.module.scss";
import Link from "next/link";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

const Profile = () => {
  // const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("overview");

  // if (loading) {
  //   return <div>Chargement</div>;
  // }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaCallback = urlParams.get("stravaCallback");
    if (stravaCallback) {
      setActiveMenu("stravaedit");
    }
  }, []);

  return (
    <>
      <div className={styles.profile}>
        <nav>
          <ul>
            <li onClick={() => setActiveMenu("overview")}>
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 16H5V11C5 10.7167 5.096 10.4793 5.288 10.288C5.48 10.0967 5.71733 10.0007 6 10H10C10.2833 10 10.521 10.096 10.713 10.288C10.905 10.48 11.0007 10.7173 11 11V16H14V7L8 2.5L2 7V16ZM0 16V7C0 6.68333 0.0709998 6.38333 0.213 6.1C0.355 5.81667 0.550667 5.58333 0.8 5.4L6.8 0.9C7.15 0.633333 7.55 0.5 8 0.5C8.45 0.5 8.85 0.633333 9.2 0.9L15.2 5.4C15.45 5.58333 15.646 5.81667 15.788 6.1C15.93 6.38333 16.0007 6.68333 16 7V16C16 16.55 15.804 17.021 15.412 17.413C15.02 17.805 14.5493 18.0007 14 18H10C9.71667 18 9.47933 17.904 9.288 17.712C9.09667 17.52 9.00067 17.2827 9 17V12H7V17C7 17.2833 6.904 17.521 6.712 17.713C6.52 17.905 6.28267 18.0007 6 18H2C1.45 18 0.979333 17.8043 0.588 17.413C0.196666 17.0217 0.000666667 16.5507 0 16Z"
                  fill="white"
                />
              </svg>
              Général
            </li>
            <li onClick={() => setActiveMenu("friends")}>
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1.8C7.05701 1.8 6.15264 2.17928 5.48584 2.85442C4.81905 3.52955 4.44444 4.44522 4.44444 5.4C4.44444 6.35478 4.81905 7.27045 5.48584 7.94558C6.15264 8.62072 7.05701 9 8 9C8.94299 9 9.84736 8.62072 10.5142 7.94558C11.181 7.27045 11.5556 6.35478 11.5556 5.4C11.5556 4.44522 11.181 3.52955 10.5142 2.85442C9.84736 2.17928 8.94299 1.8 8 1.8ZM2.66667 5.4C2.66667 3.96783 3.22857 2.59432 4.22876 1.58162C5.22896 0.568927 6.58551 0 8 0C9.41449 0 10.771 0.568927 11.7712 1.58162C12.7714 2.59432 13.3333 3.96783 13.3333 5.4C13.3333 6.83217 12.7714 8.20568 11.7712 9.21838C10.771 10.2311 9.41449 10.8 8 10.8C6.58551 10.8 5.22896 10.2311 4.22876 9.21838C3.22857 8.20568 2.66667 6.83217 2.66667 5.4ZM4.44444 14.4C3.7372 14.4 3.05892 14.6845 2.55883 15.1908C2.05873 15.6972 1.77778 16.3839 1.77778 17.1C1.77778 17.3387 1.68413 17.5676 1.51743 17.7364C1.35073 17.9052 1.12464 18 0.888889 18C0.653141 18 0.427048 17.9052 0.260349 17.7364C0.0936505 17.5676 0 17.3387 0 17.1C0 15.9065 0.468253 14.7619 1.30175 13.918C2.13524 13.0741 3.2657 12.6 4.44444 12.6H11.5556C12.7343 12.6 13.8648 13.0741 14.6983 13.918C15.5317 14.7619 16 15.9065 16 17.1C16 17.3387 15.9064 17.5676 15.7397 17.7364C15.573 17.9052 15.3469 18 15.1111 18C14.8754 18 14.6493 17.9052 14.4826 17.7364C14.3159 17.5676 14.2222 17.3387 14.2222 17.1C14.2222 16.3839 13.9413 15.6972 13.4412 15.1908C12.9411 14.6845 12.2628 14.4 11.5556 14.4H4.44444Z"
                  fill="white"
                />
              </svg>
              Contacts
            </li>
            <li
              onClick={() => setActiveMenu("stravaedit")}
              className={activeMenu === "stravaedit" ? `${styles.active}` : ""}
            >
              Connexion Strava
            </li>
          </ul>
        </nav>
        <div className={styles.profileContent}>
          {activeMenu === "overview" && <OverviewComponent />}
          {activeMenu === "friends" && <FriendsComponent />}
          {activeMenu === "stravaedit" && <StravaComponent />}
        </div>
      </div>
    </>
  );
};

export default Profile;
