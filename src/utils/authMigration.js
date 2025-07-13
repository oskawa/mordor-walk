// utils/authMigration.js - Utilitaire pour gérer les migrations

export class AuthMigration {
  static APP_VERSION = '1.1.0'; // Incrémenter à chaque changement d'auth
  
  /**
   * Vérifie si l'utilisateur doit être migré/déconnecté
   */
  static checkMigrationNeeded() {
    if (typeof window === 'undefined') return false;
    
    const currentVersion = localStorage.getItem('app_version');
    const hasToken = localStorage.getItem('token');
    
    // Première installation ou changement de version avec token existant
    if (hasToken && (!currentVersion || currentVersion !== this.APP_VERSION)) {
      console.log('🔄 Migration nécessaire - Version:', currentVersion, '→', this.APP_VERSION);
      return true;
    }
    
    return false;
  }
  
  /**
   * Force la déconnexion et nettoie tout
   */
  static forceMigration() {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 Migration forcée - Nettoyage complet du localStorage');
    
    // Sauvegarder les données importantes si nécessaire
    const preservedData = {
      // Garder les préférences utilisateur par exemple
      theme: localStorage.getItem('user_theme'),
      language: localStorage.getItem('user_language')
    };
    
    // Nettoyer tout
    localStorage.clear();
    
    // Restaurer les données préservées
    Object.entries(preservedData).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
    
    // Marquer la nouvelle version
    localStorage.setItem('app_version', this.APP_VERSION);
    
    // Rediriger vers la page de connexion
    window.location.href = '/';
  }
  
  /**
   * Vérifier la validité du token avec l'API
   */
  static async validateCurrentSession() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) return false;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/userconnection/v1/userdata?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.status === 401 || response.status === 403) {
        console.log('🚫 Session expirée - Déconnexion automatique');
        this.forceMigration();
        return false;
      }
      
      return response.ok;
    } catch (error) {
      console.error('Erreur validation session:', error);
      return false;
    }
  }
  
  /**
   * Initialiser la migration au démarrage de l'app
   */
  static async initialize() {
    // Vérifier si migration nécessaire
    if (this.checkMigrationNeeded()) {
      this.forceMigration();
      return false; // Session fermée
    }
    
    // Valider la session actuelle
    return await this.validateCurrentSession();
  }
}