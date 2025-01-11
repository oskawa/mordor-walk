'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./friends.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

export default function FriendsComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Function to fetch friends
  useEffect(() => {
    axios
      .get(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/retrieveUserFriends`,
        {
          params: { userId: userId },
          headers: {
            Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
          },
        }
      )
      .then((response) => {
        setFriends(response.data);
      })
      .catch((error) => {
        console.error("Error fetching friends:", error);
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
              Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
            },
          }
        )
        .then((response) => {
          setSearchResults(response.data);
        })
        .catch((error) => {
          console.error("Error searching users:", error);
        });
    } else {
      setSearchResults([]);
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
            Authorization: `Bearer ${token}`, // Add the Bearer Token in the Authorization header
          },
        }
      )
      .then((response) => {
        // Add the new friend to the friends list
        setFriends((prevFriends) => [...prevFriends, response.data]);

        // Remove the user from the search results
        setSearchResults((prevResults) =>
          prevResults.filter((user) => user.id !== userId)
        );
      })
      .catch((error) => {
        console.error("Error adding friend:", error);
      });
  };

  return (
    <div>
      <div className={styles.heading}>
        <h2>Vos contacts</h2>
      </div>
      <div className={styles.findUser}>
        <h3>Trouver des utilisateurs</h3>
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
          {searchResults.map((user) => (
            <li key={user.id}>
              <img src="" alt="" />
              {user.username}
              <button
                className={styles.button}
                onClick={() => addFriend(user.id)}
              >
                Add Friend
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.friendsListing}>
        <h3>Vos contacts</h3>
        <ul>
          {friends.map((friend) => (
            <li key={friend.id}>
              <img src={friend.picture} alt="" />
              <div>
                <p className={styles.username}>{friend.username}</p>
                <p className={styles.distance}>
                  {friend.totalDistance}km / 1400km
                </p>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{ width: `${(friend.totalDistance / 1400) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
