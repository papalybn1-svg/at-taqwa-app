# 🔐 Système de Persistance d'Authentification - At-Taqwa

## 📱 **Comportement par environnement**

### **🟢 Production (Build natif)**
- **Persistance automatique** : Firebase Auth gère automatiquement la persistance
- **Sécurité maximale** : Utilise les APIs natives de Firebase
- **Comportement** : L'utilisateur reste connecté jusqu'à déconnexion manuelle ou expiration du token
- **Durée** : Jusqu'à 1 an (selon la configuration Firebase)

### **🟡 Développement (Expo Go)**
- **Limitation** : Expo Go ne supporte pas la persistance native Firebase
- **Solution** : Cache local AsyncStorage comme fallback
- **Sécurité** : Cache expiré après 7 jours
- **Comportement** : Connexion automatique si cache valide

## 🔧 **Architecture technique**

### **1. Hook useAuth**
```typescript
// Vérification du cache local (Expo Go uniquement)
const checkLocalAuth = async (): Promise<AuthUser | null>

// Sauvegarde des données utilisateur
const saveUserDataLocally = async (userData: AuthUser)

// Récupération depuis Firestore
const fetchUserRoleFromFirestore = async (user: User): Promise<UserRole>
```

### **2. Flux d'authentification**

#### **Production :**
1. Firebase Auth vérifie automatiquement la session
2. Si session valide → Connexion automatique
3. Si session expirée → Redirection vers LoginScreen

#### **Expo Go :**
1. Vérification du cache local AsyncStorage
2. Si cache valide (< 7 jours) → Connexion automatique
3. Si cache expiré ou inexistant → Redirection vers LoginScreen

## 🛡️ **Sécurité**

### **Mesures de sécurité :**
- **Expiration du cache** : 7 jours maximum en développement
- **Nettoyage automatique** : Cache supprimé à la déconnexion
- **Validation des données** : Vérification de l'intégrité du cache
- **Fallback sécurisé** : En cas d'erreur, redirection vers LoginScreen

### **En production :**
- Firebase Auth gère la sécurité automatiquement
- Tokens JWT sécurisés
- Expiration automatique des sessions
- Protection contre les attaques CSRF

## 🧪 **Tests recommandés**

### **Test en développement (Expo Go) :**
1. Se connecter à l'application
2. Fermer complètement l'application
3. Rouvrir l'application
4. Vérifier la connexion automatique

### **Test en production :**
1. Faire un build natif : `eas build --platform android --profile preview`
2. Installer l'APK sur un appareil
3. Se connecter
4. Fermer/rouvrir l'application
5. Vérifier la persistance Firebase native

## 🚨 **Points d'attention**

### **Pour les développeurs :**
- Le cache local n'est utilisé qu'en développement
- En production, Firebase Auth est la source de vérité
- Ne jamais modifier manuellement le cache AsyncStorage
- Toujours utiliser la fonction `logout()` pour se déconnecter

### **Pour la production :**
- La persistance Firebase est automatique
- Aucune configuration supplémentaire nécessaire
- Les tokens sont gérés automatiquement par Firebase
- La sécurité est assurée par Firebase Auth

## 📊 **Logs de débogage**

### **Logs en développement :**
```
✅ Utilisateur trouvé en cache local (Expo Go)
🔄 Utilisateur trouvé en cache local (Expo Go), connexion automatique...
```

### **Logs en production :**
```
🔥 Firebase config initialisée avec persistance Auth automatique
💾 Persistance Auth native Firebase activée
```

---

## ✅ **Validation**

Le système de persistance est maintenant **robuste et sécurisé** pour :
- ✅ **Production** : Persistance Firebase native
- ✅ **Développement** : Cache local avec expiration
- ✅ **Sécurité** : Mesures de protection appropriées
- ✅ **Performance** : Pas d'impact sur les performances 