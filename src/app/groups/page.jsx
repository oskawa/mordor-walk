"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./groups.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../context/LoadingContext";
import Link from "next/link";

export default function GroupsComponent() {
  const [groups, setGroups] = useState([]);
  const [token, setToken] = useState(null);
  const { setLoading } = useLoading();
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserGroups`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
            },
          }
        )
        .then((response) => {
          setGroups(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error("Error searching trophies:", error);
        });
    }
  }, [token]);

  return (
    <div className={styles.groups}>
      <div className={styles.heading}>
        <h1>Mes groupes</h1>
        <Link href="/groups/create">Créer un groupe</Link>
      </div>
      <div className={styles.groupsInner}>
        <ul className={styles.groupsList}>
          {groups.map((group, index) => (
            <Link href={`/groups/${group.slug}`}>
              <li key={index}>
                <div className={styles.banner} style={{ backgroundImage: `url(${group.banner})` }}>
                  <img src={group.logo} alt={group.name} />
                </div>
                <h4>{group.name}</h4>
           
                {group.status == "invited" && 
                <p className={styles.waiting}>Vous n'avez pas encore accepté cette invitation</p>
                }
                {/* <p>{group.km} km</p> */}
              </li>
            </Link>
          ))}
        </ul>

        <hr />
      </div>
    </div>
  );
}
