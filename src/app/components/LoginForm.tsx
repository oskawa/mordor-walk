import { useState } from "react";
import axios from "axios";
import styles from "./login.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT = process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

const LoginForm = ({ setActiveMenu }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      window.location.reload();

      // Store token or user session here
    } catch (err) {
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
        <span>Vous n'avez pas de compte ?</span>
        <button className={styles.margin} onClick={() => setActiveMenu("register")}>
          <strong>Créez-en un</strong>
        </button>
      </div>
    </>
  );
};

export default LoginForm;
