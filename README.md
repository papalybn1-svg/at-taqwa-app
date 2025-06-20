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

## 🛠️ Installation & Lancement

```bash
git clone https://github.com/ibrahima98/at-taqwa.git
cd at-taqwa-app
npm install
# Pour lancer en mode développement
npx expo start
```

- **Configuration Firebase** : renseigner les clés dans `src/screens/firebaseConfig.tsx`
- **Images** : toutes les images nécessaires sont dans le dossier `/assets`

---

## 👤 Accès administrateur

- Un utilisateur avec le rôle `admin` accède à l'interface d'administration.
- Pour attribuer un rôle admin à un utilisateur :
  ```bash
  node updateUserRole.js <email> admin
  ```

---

## 📝 Nouveautés & Changements récents

- Refonte complète de l'UI/UX (cartes, typographie, navigation)
- Système de notifications dynamique et performant
- Optimisation du chargement (pagination, FlatList optimisée)
- Ajout d'un dashboard admin moderne
- Correction des problèmes de typage, images, dépendances

---

## 📸 Captures d'écran

*(À insérer : accueil, notifications, admin, quiz, etc.)*

---

## 📂 Structure du projet

- `/src/screens` : tous les écrans (Accueil, Admin, Quiz, etc.)
- `/src/components` : composants réutilisables (Card, UserCard…)
- `/src/navigation` : navigation principale et admin
- `/src/theme` : couleurs, typographie
- `/data` : données statiques (chapitres, etc.)

---

## 🤝 Contribuer

1. Fork le repo
2. Crée une branche (`git checkout -b feature/ma-feature`)
3. Commit tes changements (`git commit -am 'feat: ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvre une Pull Request

---

## 🧑‍💻 Auteurs

- Ibrahima Ly  
- [Contributeurs bienvenus !](https://github.com/ibrahima98/at-taqwa/graphs/contributors)

---

## 📄 Licence

MIT

##  Auteur du Livre 
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