# 📱 At-Taqwa App

## Description
Application mobile islamique (React Native/Expo) pour l'apprentissage, les quiz, la prière et la distribution sur iOS (TestFlight) et Android (Firebase).

---

## 🚀 Fonctionnalités principales
- Quiz à progression verrouillée (cadenas)
- Gestion des scores et progression utilisateur
- Splash screen personnalisé
- Distribution iOS automatisée via TestFlight (CI/CD GitHub Actions)
- Distribution Android via Firebase App Distribution

---

## 🛠️ Installation & Configuration

### 1. **Cloner le projet**
```bash
git clone https://github.com/ibrahima98/at-taqwa.git
cd at-taqwa-app
```

### 2. **Installer les dépendances**
```bash
npm install
```

### 3. **Configuration Firebase**
- Ajoute les fichiers `google-services.json` (Android) et `GoogleService-Info.plist` (iOS) si tu utilises Firebase.
- Configure les identifiants dans la console Firebase.

### 4. **Configuration Expo/EAS**
- Vérifie le fichier `app.json` (owner, slug, bundle ID, etc.)
- Vérifie le fichier `eas.json` (profils build/submit, ascAppId, etc.)

### 5. **Variables d'environnement (CI/CD)**
- Ajoute le secret `EXPO_TOKEN` dans GitHub (Settings > Secrets > Actions)
- Configure la clé API App Store Connect (Key ID, Issuer ID, .p8) via `eas credentials`

---

## 🏗️ Build & Distribution

### **iOS (TestFlight via GitHub Actions)**
- À chaque push sur `main` ou `imam`, le workflow `.github/workflows/ios-testflight.yml` :
  - Build l'app iOS sur un runner macOS
  - Soumet automatiquement le build sur TestFlight
- **Clé API App Store Connect** obligatoire (voir doc plus haut)
- Les testeurs peuvent être ajoutés sans UDID, via TestFlight

### **Android (Firebase App Distribution)**
- Build APK ou AAB via EAS ou Expo
- Upload sur Firebase App Distribution pour testeurs Android

---

## 🧪 Test du système de cadenas (Quiz)
1. Commencer par le quiz du chapitre 1 (toujours débloqué)
2. Obtenir 80% pour débloquer le chapitre suivant
3. Les chapitres suivants restent verrouillés si score < 80%
4. Le score s'affiche uniquement pour les quiz complétés
5. La progression est sauvegardée localement (AsyncStorage)

---

## 🔑 Clés techniques
- **React Native / Expo**
- **EAS Build & Submit**
- **TestFlight (CI/CD)**
- **Firebase App Distribution**
- **AsyncStorage** pour la persistance locale

---

## 📦 Structure du projet
- `App.tsx` : Entrée principale de l'app
- `src/screens/` : Tous les écrans (Quiz, Sélection, Tasbih, etc.)
- `assets/` : Images, icônes, splash, etc.
- `eas.json` : Profils de build et de soumission
- `.github/workflows/ios-testflight.yml` : CI/CD TestFlight

---

## 📝 Déploiement TestFlight (Résumé)
1. Générer une clé API App Store Connect (Key ID, Issuer ID, .p8)
2. Lier la clé à ton projet avec `eas credentials`
3. Push sur GitHub → build & soumission automatique
4. Attendre la vérification Apple
5. Ajouter des testeurs sur TestFlight

---

## 📧 Contact
Pour toute question ou contribution :
- **Auteur** : Ibrahima Ly
- **Mail** : papalybn@gmail.com
- **Expo** : [expo.dev/@brahim98/at-taqwa-app](https://expo.dev/@brahim98/at-taqwa-app)

---

**Barakallahoufik pour ta confiance et bonne utilisation de l'app At-Taqwa !** 
