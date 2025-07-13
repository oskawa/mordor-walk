import { useState } from "react";
import axios from "axios";
import styles from "./login.module.scss";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT = 
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

const RegisterForm = ({ setActiveMenu }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/register`,
        {
          username,
          email,
          password,
        }
      );

      // Si l'inscription retourne directement un token, connecter l'utilisateur
      if (response.data.token) {
        const { token, user, expiration } = response.data;
        
        login(token, {
          id: user.id,
          username: user.username || username,
          name: user.name || "",
          firstname: user.firstname || "",
          email: email,
        }, expiration);
      } else {
        // Sinon, rediriger vers la connexion
        setActiveMenu("login");
        // Optionnel : afficher un message de succès
      }

      setLoading(false);
      
    } catch (err) {
      setLoading(false);
      setError(
        err.response ? err.response.data.message : "Erreur lors de l'inscription"
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Pseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">S'inscrire</button>
        {error && <div className={styles.error}>{error}</div>}
      </form>
      <div className={styles.separator}>
        <hr />
        <span>Ou</span>
        <hr />
      </div>
      <div className={styles.registerButton}>
        <button onClick={() => setActiveMenu("login")}>
          <strong>Se connecter</strong>
        </button>
      </div>
    </>
  );
};

export default RegisterForm;