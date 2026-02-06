# 📱 At‑Taqwa App

Application mobile (React Native + Expo) pour apprendre, lire les chapitres, faire des quiz et consulter les horaires de prière. Déploiements iOS (TestFlight) et Android (EAS Build), CI/CD GitHub Actions.

---

## ✨ Fonctionnalités
- Lecture chapitres avec reprise précise (dernière section)
- Quiz par chapitre avec reprise de session et sauvegarde du meilleur score
- Favoris par section
- Progression, favoris et scores scopiés par utilisateur (`uid:` sur AsyncStorage)
- Nettoyage automatique des données locales à la déconnexion
- Splashs uniquement au premier lancement (flag `onboarding_seen`)
- Optimisations scroll/gestes Android (nestedScrollEnabled, keyboard resize)

---

## 🗂️ Structure
- `App.tsx`: Entrée app, routing et splash logique premier lancement
- `src/screens/`: Écrans (Home, Books, Chapter, Quiz*, Tasbih, Notifications, …)
- `src/hooks/useAuth.ts`: Auth + logout avec purge des clés utilisateur
- `src/utils/userStorage.ts`: `read/write/remove`, migration optionnelle, suppression par préfixe
- `eas.json`: Profils de build/submit
- `.github/workflows/*.yml`: CI/CD Android + iOS

---

## 🔧 Installation locale
```bash
git clone https://github.com/papalybn1-svg/at-taqwa-app.git
cd at-taqwa-app
npm install
```

### Config Expo/EAS
- `app.json` (owner/slug, ids, icônes/splash):
  - iOS: `ios.buildNumber` (à incrémenter à chaque soumission)
  - Android: `android.softwareKeyboardLayoutMode = "resize"`
  - Icône/splash: `./assets/LOGO_AT_TAQWA.png` (PNG 1024×1024)
- `eas.json`: profils `preview` (APK), `production` (AAB/IPA), `submit.production.ios.ascAppId`

### Secrets CI/CD (GitHub)
- `ATTAQWAAPP` (ou `EXPO_TOKEN`) pour EAS

---

## 🏗️ Build & Submit (EAS)

### ⚠️ Configuration initiale requise (première fois seulement)

**Avant le premier build Android**, tu dois générer le keystore en mode interactif :

```bash
# Se connecter à EAS (si pas déjà fait)
npx eas-cli@latest login

# Générer le keystore Android (mode interactif - une seule fois)
npx eas-cli@latest credentials --platform android
# Choisir le profil "production" et "Generate a new keystore"
```

**Voir le guide complet :** `EAS_ANDROID_KEYSTORE_SETUP.md`

### Android
```bash
# APK interne (preview)
npx eas-cli@latest build --platform android --profile preview --non-interactive

# Production (AAB)
npx eas-cli@latest build --platform android --profile production --non-interactive
```

### iOS
```bash
# Build production (IPA)
npx eas-cli@latest build --platform ios --profile production --non-interactive

# Soumettre le dernier build à TestFlight
npx eas-cli@latest submit -p ios --latest --non-interactive

# Ou build + auto-submit
npx eas-cli@latest build --platform ios --profile production --non-interactive --auto-submit
```

---

## 🤖 CI/CD GitHub Actions
- Android: `.github/workflows/android-build.yml`
  - Push sur `main`/`imam` → build EAS Android + (option conseillé) upload d’artifact
  - Ajoutez après le download:
```yaml
- name: Upload APK artifact
  uses: actions/upload-artifact@v4
  with:
    name: android-apk
    path: |
      **/*.apk
      **/*.aab
```

- iOS: `.github/workflows/ios-testflight.yml`
  - Push sur `main`/`imam` → build + `eas submit` TestFlight

---

## ✅ Check‑list avant release
- [ ] iOS `buildNumber` incrémenté (ex: 1.4.6)
- [ ] Android `versionCode` (si utilisé) incrémenté
- [ ] Icône/splash: `assets/LOGO_AT_TAQWA.png` (PNG 1024)
- [ ] Tests manuels:
  - Lecture: reprise section OK
  - Quiz: reprise session + meilleur score OK
  - Changement de compte: pas de fuite de progression/favoris/scores
  - Android: scrolls imbriqués OK, clavier ne masque pas les champs

---

## 🧠 Notes techniques
- Stockage local scopié: clés `uid:<name>` (`chapterProgress`, `favorites`, `quizScores`, `quizSession:*`)
- Logout: suppression de toutes les clés `uid:*` + `quizSession:*`
- Splash: premier lancement uniquement (flag `onboarding_seen`)
- UI: `numberOfLines`, `adjustsFontSizeToFit` pour titres longs; `nestedScrollEnabled` et `keyboardDismissMode` sur scrolls

---

## 👤 Contact
- Auteur: Ibrahima Ly — papalybn@gmail.com
- Expo: `https://expo.dev/@brahim98/at-taqwa-app`

---

Barakallahu fik pour la confiance et l’utilisation d’At‑Taqwa.
