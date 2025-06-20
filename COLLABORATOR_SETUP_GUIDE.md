# 👥 Guide Collaborateur - Configuration iOS At-Taqwa App

## 🎯 **Vue d'ensemble**

Ce guide permet à tous les collaborateurs de configurer facilement l'environnement de développement iOS pour At-Taqwa App, sans configuration Firebase supplémentaire.

---

## 📋 **Prérequis pour iOS**

### **1. Compte Apple Developer**
- **Option A : Compte Apple Developer payant (99$/an)**
  - ✅ Accès complet à toutes les fonctionnalités
  - ✅ TestFlight illimité
  - ✅ Distribution App Store

- **Option B : Compte Apple Developer gratuit**
  - ⚠️ Limitations : Builds valides 7 jours seulement

### **2. iPhone/iPad pour les tests**
- iOS 13.0 ou supérieur
- Connexion internet pour les builds EAS

### **3. Outils d'installation (sans Mac)**
- **AltStore** (recommandé) : https://altstore.io/
- **Sideloadly** : https://sideloadly.io/

---

## 🚀 **Installation rapide (5 minutes)**

### **Étape 1 : Cloner le projet**
```bash
git clone https://github.com/ibrahima98/at-taqwa.git
cd at-taqwa-app
npm install
```

### **Étape 2 : Configuration automatique**
✅ **Le fichier `GoogleService-Info.plist` est déjà inclus dans le repo !**
✅ **Aucune configuration Firebase supplémentaire nécessaire !**

### **Étape 3 : Build iOS**
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter avec tes identifiants Expo
eas login

# Build iOS
eas build --platform ios --profile preview
```

### **Étape 4 : Installer sur iPhone**
1. Télécharger l'IPA depuis EAS Dashboard
2. Installer avec AltStore/Sideloadly
3. Tester l'application

---

## 🔧 **Configuration détaillée**

### **1. Compte Apple Developer**

#### **Créer un compte Apple Developer**
1. Aller sur https://developer.apple.com/
2. Cliquer sur "Account" → "Sign In"
3. Créer un compte Apple ID si nécessaire
4. Accepter les conditions d'utilisation

#### **Activer le mode développeur sur iPhone**
1. Aller dans **Réglages** → **Général** → **À propos**
2. Appuyer 7 fois sur **Numéro de version** (devient "Mode développeur")
3. Aller dans **Réglages** → **Confidentialité et sécurité** → **Mode développeur**
4. Activer le **Mode développeur**
5. Redémarrer l'iPhone

### **2. Installation d'AltStore (Recommandé)**

#### **Avec Mac**
1. Télécharger AltStore : https://altstore.io/
2. Installer sur Mac
3. Connecter l'iPhone via USB
4. AltStore s'installe automatiquement sur l'iPhone

#### **Sans Mac (Windows/Linux)**
1. Télécharger AltStore depuis le site officiel
2. Suivre les instructions pour l'installation manuelle
3. Ou utiliser Sideloadly comme alternative

### **3. Configuration EAS**

#### **Première connexion**
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter
eas login
# Utiliser tes identifiants Expo (même que pour Expo Go)
```

#### **Vérifier la configuration**
```bash
# Voir les informations du projet
eas project:info

# Voir les builds disponibles
eas build:list
```

---

## 📱 **Workflow de développement**

### **Développement quotidien**
```bash
# 1. Faire tes modifications
# 2. Tester avec Expo Go (limité)
npx expo start -c

# 3. Build iOS pour tests complets
eas build --platform ios --profile preview

# 4. Installer et tester sur iPhone
```

### **Mise à jour de l'app**
```bash
# Utiliser le script automatique
./update-app.sh

# Ou commandes manuelles
eas update --branch preview --message "Nouvelles fonctionnalités"
eas build --platform ios --profile preview
```

---

## 🐛 **Dépannage**

### **Problèmes courants**

#### **Build iOS échoue**
```bash
# Vérifier les certificats
eas credentials --platform ios

# Réinitialiser les certificats
eas credentials --platform ios --clear

# Voir les logs détaillés
eas build:view [BUILD_ID] --logs
```

#### **App ne s'installe pas sur iPhone**
- ✅ Vérifier que le mode développeur est activé
- ✅ Utiliser AltStore ou Sideloadly
- ✅ Vérifier que l'iPhone est connecté à internet
- ✅ Redémarrer l'iPhone après activation du mode développeur

#### **Erreur de certificat**
```bash
# Vérifier la configuration Apple Developer
eas credentials

# Si problème persiste, contacter l'admin du projet
```

#### **App ne se connecte pas à Firebase**
- ✅ Le `GoogleService-Info.plist` est déjà configuré
- ✅ Vérifier la connexion internet
- ✅ Tester avec `node test-firestore.js`

### **Logs utiles**
```bash
# Voir les builds récents
eas build:list --limit 5

# Voir un build spécifique
eas build:view [BUILD_ID]

# Annuler un build
eas build:cancel [BUILD_ID]
```

---

## 📊 **Comparaison des comptes Apple Developer**

| Fonctionnalité | Compte Gratuit | Compte Payant |
|----------------|----------------|---------------|
| **Durée des builds** | 7 jours | Illimitée |
| **TestFlight** | ❌ Non | ✅ Oui |
| **App Store** | ❌ Non | ✅ Oui |
| **Certificats** | Développement | Développement + Distribution |
| **Appareils** | Limité | Illimité |
| **Support** | Communauté | Apple |

---

## 🎯 **Commandes utiles**

### **Scripts automatiques**
```bash
# Script de mise à jour complet
./update-app.sh

# Options disponibles :
# 1) Mise à jour OTA
# 2) Build Android
# 3) Build iOS
# 4) Build de développement Android
# 5) Build de développement iOS
# 6) Build Android + iOS
# 7) Voir les builds récents
# 8) Annuler un build
```

### **Commandes EAS**
```bash
# Voir les builds iOS
eas build:list --platform ios

# Build rapide iOS
eas build --platform ios --profile preview

# Build de développement iOS
eas build --platform ios --profile development

# Mise à jour OTA
eas update --branch preview --message "Description"
```

---

## 📞 **Support et ressources**

### **Documentation officielle**
- **EAS Build** : https://docs.expo.dev/build/introduction/
- **Firebase iOS** : https://firebase.google.com/docs/ios/setup
- **Apple Developer** : https://developer.apple.com/support/

### **Outils recommandés**
- **AltStore** : https://altstore.io/
- **Sideloadly** : https://sideloadly.io/
- **Expo CLI** : https://docs.expo.dev/workflow/expo-cli/

### **Contact**
- **Admin du projet** : papalybn@gmail.com
- **Issues GitHub** : https://github.com/ibrahima98/at-taqwa/issues

---

## ✅ **Checklist de configuration**

- [ ] Compte Apple Developer créé
- [ ] Mode développeur activé sur iPhone
- [ ] AltStore/Sideloadly installé
- [ ] Projet cloné et dépendances installées
- [ ] EAS CLI installé et connecté
- [ ] Premier build iOS réussi
- [ ] App installée sur iPhone
- [ ] Connexion Firebase testée
- [ ] Workflow de développement maîtrisé

---

## 🎉 **Félicitations !**

Tu es maintenant prêt à développer et tester At-Taqwa App sur iOS ! 

**Rappels importants :**
- Le `GoogleService-Info.plist` est déjà configuré
- Utilise le script `./update-app.sh` pour les mises à jour
- Consulte ce guide en cas de problème
- Contacte l'admin si tu rencontres des difficultés

**Bon développement ! 🚀** 