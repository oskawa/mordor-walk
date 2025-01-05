import { useState } from "react";
import axios from "axios";
import styles from "./login.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT = process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
const RegisterForm = ({ setActiveMenu }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/register`,
        {
          username,
          email,
          password,
        }
      );

      window.location.reload();
    } catch (err) {
      setError(
        err.response ? err.response.data.message : "Error during registration"
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
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">S'inscrire</button>
        {error && <div>{error}</div>}
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
