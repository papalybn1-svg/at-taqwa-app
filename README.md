# 📚 At-Taqwa App

Application mobile éducative islamique (Expo/React Native + Firebase/Firestore)
Gestion des utilisateurs, rôles, notifications, hadiths, zikrs, quiz, livres, et interface d'administration.

---

## 🚀 Fonctionnalités principales

- **Authentification sécurisée** (Firebase Auth)
- **Création automatique des profils utilisateurs** et attribution de rôles
- **Accueil dynamique** : hadith du jour, aperçu animé des livres, zikrs, notifications
- **Système de notifications** avec compteur, pagination, écran dédié
- **Quiz interactifs** et suivi des favoris
- **Interface admin** : gestion CRUD (utilisateurs, hadiths, zikrs, notifications), dashboard, suivi d'activité
- **Design moderne** : typographie unifiée, cartes harmonisées, animations, responsive
- **Optimisations** : chargement rapide, gestion offline, corrections de bugs et typage TypeScript

---

## 🛠️ Installation & Configuration

### **Prérequis**
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Git

### **Installation de base**
```bash
# Cloner le repository
git clone https://github.com/ibrahima98/at-taqwa.git
cd at-taqwa-app

# Installer les dépendances
npm install
```

### **Configuration Firebase**
✅ **Le fichier `GoogleService-Info.plist` est déjà inclus dans le repo !**
✅ **Aucune configuration Firebase supplémentaire nécessaire !**

L'application fonctionne en mode hors ligne avec des données de fallback si Firebase n'est pas configuré.

---

## 📱 **Options de test et déploiement**

### **Option 1 : Test rapide avec Expo Go (Limité)**
```bash
# Lancer en mode développement
npx expo start -c

# Scanner le QR code avec Expo Go sur ton téléphone
# ⚠️ Limitations : Pas d'accès complet à Firestore
```

### **Option 2 : Build natif Android avec EAS (Recommandé)**
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login

# Créer un build Android
eas build --platform android --profile preview

# Télécharger l'APK et l'installer sur ton téléphone
# ✅ Accès complet à toutes les fonctionnalités
```

### **Option 3 : Build natif iOS avec EAS (🍎)**

#### **Prérequis iOS**
- **Compte Apple Developer** (gratuit ou payant)
- **iPhone/iPad** pour les tests
- **AltStore** ou **Sideloadly** pour l'installation

#### **Configuration iOS**
1. **Compte Apple Developer** :
   - **Gratuit** : Builds valides 7 jours, pas TestFlight
   - **Payant (99$/an)** : Accès complet, TestFlight, App Store

2. **Activer le mode développeur sur iPhone** :
   - Réglages → Général → À propos → Appuyer 7 fois sur "Numéro de version"
   - Réglages → Confidentialité et sécurité → Mode développeur → Activer
   - Redémarrer l'iPhone

3. **Installation d'AltStore** :
   - **Avec Mac** : https://altstore.io/
   - **Sans Mac** : https://sideloadly.io/

#### **Build iOS**
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login
mdp application

ltao-qwfr-alqa-yyrj
ltao-qwfr-alqa-yyrj
ltao-qwfr-alqa-yyrj
ltao-qwfr-alqa-yyrj

# Build iOS
eas build --platform ios --profile preview

# Installer sur iPhone
# 1. Télécharger l'IPA depuis EAS Dashboard
# 2. Installer avec AltStore/Sideloadly
# 3. Tester l'application
```

### **Option 4 : Build de développement (Pour le développement actif)**
```bash
# Build de développement Android
eas build --platform android --profile development

# Build de développement iOS
eas build --platform ios --profile development

# Installer l'APK/IPA de développement
# Puis utiliser les mises à jour OTA pour le développement
./update-app.sh
```

### **Option 5 : Déploiement web (Alternative)**
```bash
# Installer les dépendances web
npx expo install @expo/webpack-config

# Lancer en mode web
npx expo start --web

# Ou déployer sur Vercel/Netlify
npm install -g vercel
vercel
```

---

## 🚀 **Mises à jour et développement**

### **Script automatique**
```bash
# Utiliser le script de mise à jour
./update-app.sh

# Options disponibles :
# 1) Mise à jour OTA (modifications de code)
# 2) Build complet Android (nouvelles dépendances)
# 3) Build complet iOS (nouvelles dépendances)
# 4) Build de développement Android
# 5) Build de développement iOS
# 6) Build complet Android + iOS
# 7) Voir les builds récents
# 8) Annuler un build en cours
```

### **Commandes manuelles**
```bash
# Mise à jour OTA (rapide)
eas update --branch preview --message "Description des modifications"

# Build complet Android
eas build --platform android --profile preview

# Build complet iOS
eas build --platform ios --profile preview

# Voir les builds récents
eas build:list
```

### **Workflow de développement recommandé**
```bash
# 1. Faire tes modifications
# 2. Tester avec npx expo start -c
# 3. Commit et push
# 4. Mise à jour OTA : ./update-app.sh → Option 1
# 5. Tester sur l'app installée
```

---

## 👤 **Accès administrateur**


### **Comptes de test**
- **Admin** : papalybn@gmail.com mdp: brahim (rôle admin) 
- **Utilisateur** : ndiaye@gmail.com mdp brahim (rôle user)

---

## 🐛 **Dépannage**

### **Problèmes courants**

#### **Erreur de connexion Firestore**
```bash
# Tester la connexion
node test-firestore.js
```

#### **Build EAS échoue**
```bash
# Vérifier les logs
eas build:view [BUILD_ID]

# Vérifier la configuration
eas project:info
```

#### **Build iOS échoue**
```bash
# Vérifier les certificats Apple Developer
eas credentials --platform ios

# Réinitialiser les certificats
eas credentials --platform ios --clear
```

#### **App ne s'installe pas sur iPhone**
- ✅ Vérifier que le mode développeur est activé
- ✅ Utiliser AltStore ou Sideloadly
- ✅ Vérifier que l'iPhone est connecté à internet
- ✅ Redémarrer l'iPhone après activation du mode développeur

#### **Mise à jour OTA ne fonctionne pas**
- Vérifier la connexion internet
- Redémarrer l'application
- Vérifier que le build supporte les mises à jour OTA

### **Logs de débogage**
L'application affiche des logs détaillés :
```
🚀 Test de connexion Firestore au démarrage...
✅ Connexion Firestore réussie - X notifications trouvées
🔄 Mode hors ligne - utilisation des données de fallback
```

---

## 📊 **Comparaison des options de test**

| Option | Facilité | Fonctionnalités | Recommandé pour |
|--------|----------|-----------------|-----------------|
| **Expo Go** | ⭐⭐⭐⭐⭐ | ⭐⭐ | Tests rapides |
| **EAS Android** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production Android |
| **EAS iOS** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production iOS |
| **Build Dev** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Développement |
| **Web** | ⭐⭐⭐⭐ | ⭐⭐⭐ | Tests PC |

---

## 📂 **Structure du projet**

```
at-taqwa-app/
├── src/
│   ├── screens/          # Tous les écrans
│   ├── components/       # Composants réutilisables
│   ├── navigation/       # Navigation principale et admin
│   ├── theme/           # Couleurs, typographie
│   └── hooks/           # Hooks personnalisés
├── data/                # Données statiques
├── assets/              # Images et ressources
├── eas.json            # Configuration EAS Build
├── update-app.sh       # Script de mise à jour
├── test-firestore.js   # Tests de connexion
├── IOS_SETUP_GUIDE.md  # Guide iOS complet
└── TROUBLESHOOTING.md  # Guide de dépannage
```

---

## 🤝 **Contribuer**

1. Fork le repo
2. Crée une branche (`git checkout -b feature/ma-feature`)
3. Commit tes changements (`git commit -am 'feat: ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvre une Pull Request

---

## 📝 **Nouveautés & Changements récents**

- ✨ **Support iOS complet** avec EAS Build
- 🍎 **Configuration Firebase iOS** automatique
- 🔧 **Script de mise à jour amélioré** avec options iOS
- 📱 **Builds cross-platform** Android + iOS
- 🛡️ **Gestion d'erreur robuste** avec mode hors ligne
- 📚 **Guide iOS complet** avec dépannage
- 🚀 **Amélioration de l'expérience utilisateur**
- 🔄 **Reconnexion automatique** Firestore
- ⚡ **Timeout et gestion des états** de connexion

---

## 📄 **Licence**

MIT

## 👨‍🏫 **Auteur du Livre**
- **Aly Sow**

## 💻 **Équipe de développement**
- **Ibrahima LY** - Développeur
- **Sokhna Allassane Kebe** - Développeur

## 📚 **Préparation du Livre**
- **Imam Mame Seynou Kebe**
- **Mouhamed Abdallah Fall**

## 🎨 **Design**
- **Fatoumata Koita**

## 📧 **Contact**
Pour toute question ou suggestion : papalybn@gmail.com

---

## 📚 **Guides supplémentaires**

- **[Guide iOS complet](IOS_SETUP_GUIDE.md)** - Configuration détaillée iOS
- **[Guide de dépannage](TROUBLESHOOTING.md)** - Solutions aux problèmes courants
- **[Guide de déploiement](DEPLOYMENT_GUIDE.md)** - Stratégies de déploiement

---
**Projet réalisé avec Expo, React Native, et ❤️** 
