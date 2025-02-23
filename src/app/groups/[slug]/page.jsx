"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import styles from "./single.module.scss";
import PopUp from "../../pwapopup";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../../context/LoadingContext";

export default function SingleGroup() {
  const [group, setGroup] = useState([]);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const { setLoading } = useLoading();
  const { slug } = useParams();
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    if (!slug || !token) return;
    if (token) {
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveGroup`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              groupSlug: slug,
            },
          }
        )
        .then((response) => {
          setGroup(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
        });
    }
  }, [slug, token]);
  return (
    
      <div className={styles.bannerInner}>
      
        <div className={styles.banner}  style={{ backgroundImage: `url(${group.banner})` }} >
          <img src={group.logo} alt={group.name} />
        </div>
        <div className={styles.description}>
          <h1>{group.title}</h1>
          {group.description && <p>{group.description}</p>}
        </div>
      </div>

  );
}
