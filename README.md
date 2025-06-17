# 📚 At-Taqwa App

Application éducative interactive pour la découverte, la lecture et la pratique de l'islam, pensée pour une expérience mobile premium.

---

## ✨ Présentation

**At-Taqwa App** est une application mobile moderne (Expo/React Native) qui propose :
- Lecture guidée de chapitres thématiques (prières, purification, etc.)
- Progression gamifiée (déblocage, suivi, favoris)
- Quiz interactifs
- Outil de Tasbih digital
- Gestion des horaires de prière
- Espace Favoris et Paramètres
- UI/UX premium, animations, navigation fluide

---

## 🚀 Fonctionnalités principales
- **Lecture interactive** : navigation par "bouts"/pages, progression, animations
- **Déblocage dynamique** : chaque chapitre se débloque après lecture complète du précédent
- **Favoris** : marquer des chapitres, accès rapide
- **Quiz** : testez vos connaissances après chaque partie
- **Tasbih** : compteur digital intégré
- **Horaires de prière** : accès rapide
- **Paramètres** : personnalisation, gestion du compte
- **Mode nuit global** (à venir)

---

## 🛠️ Installation & configuration

### Prérequis
- Node.js >= 16
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation
```bash
npm install
# ou
yarn install
```

### Configuration Firebase
- Renseignez vos clés dans `src/screens/firebaseConfig.tsx` et `src/screens/secrets.ts` si besoin.

### Lancement du projet
```bash
npx expo start
```
- Scanner le QR code avec l'app Expo Go (Android/iOS)
- Ou lancer sur un émulateur Android/iOS

---

## 🗂️ Structure du projet

```
├── App.tsx / App.js         # Entrée de l'app
├── src/
│   ├── screens/            # Tous les écrans principaux (Home, Chapitres, Quiz, etc.)
│   ├── components/         # Composants réutilisables
│   ├── navigation/         # Navigation (TabNavigator, etc.)
│   ├── theme/              # Couleurs et styles globaux
│   ├── types/              # Types TypeScript
│   └── utils/              # Fonctions utilitaires
├── data/
│   ├── chapitres.json      # Index des chapitres
│   ├── chapitres/          # Un fichier JSON par chapitre
│   └── exercices_par_chapitre/ # Exercices liés
├── assets/                 # Images, icônes, illustrations
├── package.json            # Dépendances
└── ...
```

---

## 💡 Astuces de développement
- **Ajouter un chapitre** : créer un fichier JSON dans `data/chapitres/` et l'ajouter à `chapitres.json`
- **Ajouter une image** : placer l'asset dans `assets/` et référencer dans le mapping d'images
- **Personnaliser les couleurs** : modifier `src/theme/colors.ts`
- **Navigation** : voir `src/navigation/TabNavigator.tsx`
- **Types** : ajouter/modifier dans `src/types/`

---

## 🧰 Technologies utilisées
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase Auth](https://firebase.google.com/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [React Navigation](https://reactnavigation.org/)
- [Lottie, Animated, LinearGradient, etc.]


## 📎 Liens utiles
- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Firebase](https://firebase.google.com/docs/)

---

> _N'hésitez pas à contribuer, signaler un bug ou proposer une amélioration !_

## �� Auteur du Livre 
- Aly Sow
## 📝 Développeur 
- Ibrahima LY
- Sokhna Allassane Kebe!
## 📝 Preparation du  Livre 
- Imam Mame Seynou Kebe 
- Mouhamed Abdallah Fall
## 📝 Design 
-Fatoumata Koita 

## 📧 Contact
Pour toute question ou suggestion : papalybn@gmail.com

---
**Projet réalisé avec Expo, React Native, et ❤️** 