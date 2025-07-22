import { useState, useCallback } from "react";
import axios from "axios";
import styles from "./login.module.scss";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";

const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;

// Utilitaires de validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
  // Accepte tous les caractères spéciaux courants
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  // 3-20 caractères, lettres, chiffres, tirets et underscores uniquement
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

const RegisterForm = ({ setActiveMenu }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const { setLoading } = useLoading();
  const { login } = useAuth();

  // Validation en temps réel
  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = "Le pseudo est requis";
        } else if (!validateUsername(value)) {
          newErrors.username = "Le pseudo doit contenir 3-20 caractères (lettres, chiffres, - et _ uniquement)";
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          newErrors.email = "L'email est requis";
        } else if (!validateEmail(value)) {
          newErrors.email = "Veuillez saisir un email valide";
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = "Le mot de passe est requis";
        } else if (!validatePassword(value)) {
          newErrors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre";
        } else {
          delete newErrors.password;
        }
        
        // Revalider la confirmation si elle existe
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        } else if (formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  }, [errors, formData.password, formData.confirmPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validation en temps réel après un délai
    setTimeout(() => validateField(name, value), 500);
    
    // Effacer le message de succès si l'utilisateur modifie le formulaire
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Le pseudo est requis";
    } else if (!validateUsername(formData.username)) {
      newErrors.username = "Le pseudo doit contenir 3-20 caractères (lettres, chiffres, - et _ uniquement)";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Veuillez saisir un email valide";
    }
    
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/register`,
        {
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        },
        {
          timeout: 10000, // Timeout de 10 secondes
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Si l'inscription retourne directement un token, connecter l'utilisateur
      if (response.data?.token) {
        const { token, user, expiration } = response.data;
        
        login(token, {
          id: user.id,
          username: user.username || formData.username,
          name: user.name || "",
          firstname: user.firstname || "",
          email: formData.email.toLowerCase(),
        }, expiration);
        
        setSuccessMessage("Inscription réussie ! Vous êtes maintenant connecté.");
      } else {
        // Sinon, rediriger vers la connexion
        setSuccessMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setTimeout(() => {
          setActiveMenu("login");
        }, 2000);
      }
      
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      
      let errorMessage = "Erreur lors de l'inscription. Veuillez réessayer.";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "La requête a expiré. Veuillez vérifier votre connexion.";
      } else if (err.response) {
        const { status, data } = err.response;
        
        switch (status) {
          case 400:
            errorMessage = data.message || "Données invalides";
            break;
          case 409:
            errorMessage = "Ce pseudo ou cet email est déjà utilisé";
            break;
          case 422:
            errorMessage = "Veuillez vérifier vos informations";
            break;
          case 500:
            errorMessage = "Erreur du serveur. Veuillez réessayer plus tard.";
            break;
          default:
            errorMessage = data.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && 
    formData.username.trim() && 
    formData.email.trim() && 
    formData.password && 
    formData.confirmPassword;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* Message d'erreur général */}
        {errors.general && (
          <div className={styles.error} role="alert">
            {errors.general}
          </div>
        )}
        
        {/* Message de succès */}
        {successMessage && (
          <div className={styles.success} role="alert">
            {successMessage}
          </div>
        )}

        {/* Champ Pseudo */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            name="username"
            placeholder="Pseudo"
            value={formData.username}
            onChange={handleInputChange}
            className={errors.username ? styles.inputError : ''}
            disabled={isSubmitting}
            autoComplete="username"
            aria-describedby={errors.username ? "username-error" : undefined}
            required
          />
          {errors.username && (
            <div id="username-error" className={styles.fieldError} role="alert">
              {errors.username}
            </div>
          )}
        </div>

        {/* Champ Email */}
        <div className={styles.inputGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? styles.inputError : ''}
            disabled={isSubmitting}
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            required
          />
          {errors.email && (
            <div id="email-error" className={styles.fieldError} role="alert">
              {errors.email}
            </div>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div className={styles.inputGroup}>
          <div className={styles.passwordInput}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? styles.inputError : ''}
              disabled={isSubmitting}
              autoComplete="new-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              required
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="#272727" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#272727"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <div id="password-error" className={styles.fieldError} role="alert">
              {errors.password}
            </div>
          )}
        </div>

        {/* Champ Confirmation mot de passe */}
        <div className={styles.inputGroup}>
          <div className={styles.passwordInput}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? styles.inputError : ''}
              disabled={isSubmitting}
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              required
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
              disabled={isSubmitting}
            >
              {showConfirmPassword ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="#272727" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9ZM12 17C10.6739 17 9.40215 16.4732 8.46447 15.5355C7.52678 14.5979 7 13.3261 7 12C7 10.6739 7.52678 9.40215 8.46447 8.46447C9.40215 7.52678 10.6739 7 12 7C13.3261 7 14.5979 7.52678 15.5355 8.46447C16.4732 9.40215 17 10.6739 17 12C17 13.3261 16.4732 14.5979 15.5355 15.5355C14.5979 16.4732 13.3261 17 12 17ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="#272727"/>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div id="confirm-password-error" className={styles.fieldError} role="alert">
              {errors.confirmPassword}
            </div>
          )}
        </div>

        {/* Bouton de soumission */}
        <button 
          type="submit" 

          disabled={!isFormValid || isSubmitting}
          className={styles.isSubmitting ? styles.loading : styles.disabled}
          aria-describedby="submit-help"
        >
          {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
        </button>
        
        <div id="submit-help" className={styles.submitHelp}>
          {!isFormValid && "Veuillez remplir tous les champs correctement"}
        </div>
      </form>

      <div className={styles.separator}>
        <hr />
        <span>Ou</span>
        <hr />
      </div>

      <div className={styles.registerButton}>
        <button 
          onClick={() => setActiveMenu("login")}
          disabled={isSubmitting}
        >
          <strong>Se connecter</strong>
        </button>
      </div>
    </>
  );
};

export default RegisterForm;