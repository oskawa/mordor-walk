"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  name: string;
  firstname: string;
  picture?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User, expiration: number) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkTokenExpiration: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Vérifier si le token est expiré
  const checkTokenExpiration = (): boolean => {
    if (typeof window === "undefined") return false;
    
    const expiration = localStorage.getItem("expired");
    if (!expiration) return false;

    const expirationTime = Number(expiration);
    const currentTime = Date.now();
    
    return currentTime < expirationTime;
  };

  // Fonction de connexion
  const login = (newToken: string, userData: User, expiration: number) => {
    const expirationInMs = expiration * 1000;
    
    // Sauvegarder dans localStorage
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", userData.id);
    localStorage.setItem("expired", expirationInMs.toString());
    localStorage.setItem("userData", JSON.stringify(userData));

    // Mettre à jour l'état
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Fonction de déconnexion
  const logout = () => {
    // Nettoyer localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("expired");
    localStorage.removeItem("userData");

    // Reset de l'état
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Redirection vers la page d'accueil
    router.push("/");
  };

  // Mettre à jour les données utilisateur
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    }
  };

  // Initialisation et vérification de l'authentification au démarrage
  useEffect(() => {
    const initAuth = () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem("token");
      const storedUserId = localStorage.getItem("userId");
      const storedUserData = localStorage.getItem("userData");

      if (storedToken && storedUserId && checkTokenExpiration()) {
        // Token valide
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Récupérer les données utilisateur si elles existent
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setUser(userData);
          } catch (error) {
            console.error("Erreur parsing userData:", error);
          }
        }
      } else if (storedToken) {
        // Token expiré, nettoyer
        logout();
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Vérification périodique de l'expiration du token
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!checkTokenExpiration()) {
        console.log("Token expiré, déconnexion automatique");
        logout();
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Écouter les changements de localStorage (onglets multiples)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        // Token supprimé dans un autre onglet
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkTokenExpiration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}