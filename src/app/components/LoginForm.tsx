import { useState } from "react";
import axios from "axios";
import styles from "./login.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../context/LoadingContext";

const LoginForm = ({ setActiveMenu }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { setLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/login`,
        {
          username,
          password,
        }
      );
      localStorage.setItem("token", response.data.token); // Save the JWT token
      localStorage.setItem("userId", response.data.user.id); // Save the user ID
      const expirationInSeconds = response.data.expiration; // Assuming this is in seconds
      const expirationInMilliseconds = expirationInSeconds * 1000; // Convert to ms
      localStorage.setItem("expired", expirationInMilliseconds.toString()); // Save as string
      window.location.reload();

      // Store token or user session here
    } catch (err) {
      setLoading(false);
      setError(err.response ? err.response.data.message : "Error during login");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Adresse mail"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Se connecter</button>
        {error && <div>{error}</div>}
      </form>
      <div className={styles.separator}>
        <hr />
        <span>Ou</span>
        <hr />
      </div>
      <div className={styles.registerButton}>
        <button
          className={styles.margin}
          onClick={() => setActiveMenu("register")}
        >
          S'inscrire
        </button>
      </div>
    </>
  );
};

export default LoginForm;
