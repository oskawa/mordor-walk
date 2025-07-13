import { useState } from "react";
import axios from "axios";
import styles from "./login.module.scss";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

  
const LoginForm = ({ setActiveMenu }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { setLoading } = useLoading();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/login`,
        {
          username,
          password,
        }
      );

      const { token, user, expiration } = response.data;

      // Utiliser la fonction login du context
      login(
        token,
        {
          id: user.id,
          username: user.username || username,
          name: user.name || "",
          firstname: user.firstname || "",
          email: user.email || username,
        },
        expiration
      );

      setLoading(false);
      // La redirection se fait automatiquement via le context
    } catch (err) {
      setLoading(false);
      setError(
        err.response ? err.response.data.message : "Erreur lors de la connexion"
      );
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
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
        {error && <div className={styles.error}>{error}</div>}
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
