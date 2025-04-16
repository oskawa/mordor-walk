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
  const [popupType, setPopupType] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  const router = useRouter();
  const { setLoading } = useLoading();
  const { slug } = useParams();
  const date = new Date();
  const year = date.getFullYear();
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

  const handleInvitation = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/inviteUserToGroup`,
        {
          email, // Body param
          group_id: group.id, // <-- You'll need to send this too
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Invitation sent:", response.data);
    } catch (error) {
      console.error(
        "Error inviting user:",
        error.response?.data || error.message
      );
      setError(error.response?.data.message || error.message);
    }
  };
  const handleAcceptation = async (action) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/respondToInvitation`,
        {
          group_id: group.id, // <-- You'll need to send this too
          action: action,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Validation :", response.data);
      if (action === "refuse") {
        // Redirect to group list
        router.push("/groups"); // adjust to your real group list route
      } else if (action === "accept") {
        // Reload current group page
        router.refresh();
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
    }
  };

  return (
    <div className={styles.bannerInner}>
      <div
        className={styles.banner}
        style={{ backgroundImage: `url(${group.banner})` }}
      >
        <img src={group.logo} alt={group.name} />
      </div>
      <div className={styles.description}>
        <div className={styles.descriptionTitle}>
          <h1>{group.title}</h1>
          {/* <button>Quitter le groupe</button> */}
          {group.current_status != "invited" && (
            <button onClick={() => setPopupType("invite")}>
              <svg
                width="15"
                height="21"
                viewBox="0 0 18 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 17H17M14 14V20M1 19V17C1 15.9391 1.42143 14.9217 2.17157 14.1716C2.92172 13.4214 3.93913 13 5 13H9M3 5C3 6.06087 3.42143 7.07828 4.17157 7.82843C4.92172 8.57857 5.93913 9 7 9C8.06087 9 9.07828 8.57857 9.82843 7.82843C10.5786 7.07828 11 6.06087 11 5C11 3.93913 10.5786 2.92172 9.82843 2.17157C9.07828 1.42143 8.06087 1 7 1C5.93913 1 4.92172 1.42143 4.17157 2.17157C3.42143 2.92172 3 3.93913 3 5Z"
                  stroke="#00C8A0"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
        {group.description && <p>{group.description}</p>}
        {group.current_status != "invited" && (
          <p className={styles.totalgroup}>
            Parcours du groupe {year} :
            {group.group_total_km && (
              <span> {group.group_total_km} / 1400 km</span>
            )}
            <div className={styles.group__chart}>
              {group.group_total_km && (
                <span
                  style={{
                    width: `${(group.group_total_km / 1400) * 100}%`,
                  }}
                ></span>
              )}
            </div>
          </p>
        )}
      </div>
      {group.current_status != "invited" && (
        <div className={styles.members}>
          <hr />
          <h2>Membres :</h2>
          {group?.members?.map((member, i) => (
            <div key={i} className={styles.singleMember}>
              <div className={styles.feedHeading}>
                <div className={styles.feedHeadingName}>
                  <img src={member.profilePicture || "/profile.svg"} alt="" />
                  <p className={styles.name}>{member.username}</p>
                </div>
                <hr />
                <p className={styles.date}>{member.readable_date}</p>
              </div>
              <div className={styles.feedActivity}>
                <div className={styles.feedActivityDistance}>
                  <p>
                    Distance totale en {year} :
                    <strong className={styles.feedActivityBold}>
                      {member.total_km} km
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {group.current_status === "invited" && (
        <div className={styles.btnInvitations}>
          <button
            className={styles.btnFill}
            onClick={() => handleAcceptation("accept")}
          >
            Accepter l'invitation
          </button>
          <button
            className={styles.btnStroke}
            onClick={() => handleAcceptation("refuse")}
          >
            Refuser l'invitation
          </button>
        </div>
      )}
      {popupType && (
        <div className={styles.popup}>
          <div className={styles.popupInner}>
            {popupType == "invite" && <h3>Inviter à rejoindre</h3>}
            {popupType == "quit" && <h3>Quitter le groupe</h3>}
            <button className={styles.close} onClick={() => setPopupType(null)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 8L15 15M8 8L1 1M8 8L1 15M8 8L15 1"
                  stroke="#F7EBFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {popupType == "invite" && (
              <>
                <p>Renseignez une adresse mail</p>
                <div className={styles.invitationInput}>
                  <input
                    type="email"
                    name="emailInvitation"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button onClick={handleInvitation}>
                    Envoyer l'invitation
                  </button>
                </div>
                {error && <div className={styles.error}>{error}</div>}
              </>
            )}
            {popupType == "quit" && <ul></ul>}
          </div>
        </div>
      )}
    </div>
  );
}
