"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./friends.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function FriendsComponent() {
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch user profile on component mount
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/me`,
          {
            headers: {
              Authorization: `Bearer ${localToken}`,
            },
          }
        );
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  // Function to fetch friends
  useEffect(() => {
    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        // Ensure friends is always an array
        setFriends(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error("Error fetching friends:", error);
        setFriends([]); // Set empty array on error
      });
  }, []);

  // Function to search users
  const searchUsers = (query) => {
    if (query.length > 4) {
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserList`,
          {
            params: { username: query, userId },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          // Ensure searchResults is always an array
          setSearchResults(Array.isArray(response.data) ? response.data : []);
        })
        .catch((error) => {
          console.error("Error searching users:", error);
          setSearchResults([]); // Set empty array on error
        });
    } else {
      setSearchResults([]);
    }
  };

  const handleRemoveFriend = async (friend_id) => {
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/removeFriend`,
        {
          userId: localUserId,
          friendId: friend_id,
        },
        {
          headers: {
            Authorization: `Bearer ${localToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response) {
        setFriends((prevFriends) =>
          prevFriends.filter((friend) => friend.id !== friend_id)
        );
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  // Function to add friend
  const addFriend = (friendId) => {
    axios
      .post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/addFriend`,
        {
          friendId,
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        // Add the new friend to the friends list
        setFriends((prevFriends) => [...prevFriends, response.data]);
        setSearchResults([]);
        setSearchQuery("");
        // Remove the user from the search results
        setSearchResults((prevResults) =>
          prevResults.filter((user) => user.id !== friendId) // Fixed: was userId, should be friendId
        );
      })
      .catch((error) => {
        console.error("Error adding friend:", error);
      });
  };

  if (!profile) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <div>
      <div className={styles.heading}>
        <h1>Mes contacts</h1>
      </div>
      <div className={styles.findUser}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          placeholder="Rechercher un utilisateur"
        />
        <ul>
          {Array.isArray(searchResults) && searchResults.map((user) => (
            <li key={user.id}>
              <img src="" alt="" />
              {user.username}
              <button
                className={styles.button}
                onClick={() => addFriend(user.id)}
              >
                Ajouter
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.friendsListing}>
        <ul>
          {Array.isArray(friends) &&
            friends.map((friend) => (
              <li key={friend.id}>
                <img src={friend.picture || "/profile.svg"} alt="" />
                <div>
                  <p className={styles.username}>{friend.username}</p>
                  <p className={styles.distance}>
                    {Math.floor(friend.totalDistance)}km / 1400km
                  </p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{
                        width: `${(friend.totalDistance / 1400) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  className={styles.remove}
                  onClick={() => handleRemoveFriend(friend.id)}
                >
                  <svg
                    width="21"
                    height="18"
                    viewBox="0 0 21 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6369 6.02992L14.6617 7.77742L11.4964 4.96492L13.4715 3.21742C13.8007 2.92492 14.3494 2.92492 14.6617 3.21742L16.6369 4.97242C16.966 5.24992 16.966 5.73742 16.6369 6.02992ZM2.53223 12.9374L11.0237 5.38492L14.189 8.19742L5.69754 15.7499H2.53223V12.9374ZM14.0286 3.77992L12.7287 4.93492L14.7039 6.68992L16.0038 5.53492L14.0286 3.77992ZM12.9651 8.24992L10.9731 6.47992L3.37631 13.2449V14.9999H5.35146L12.9651 8.24992Z"
                      fill="#00C8A0"
                    />
                  </svg>
                  Retirer
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}