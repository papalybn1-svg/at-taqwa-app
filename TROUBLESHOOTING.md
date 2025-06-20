# 🔧 Guide de dépannage - Problèmes Firestore

## Problème : Erreur de connexion Firestore

### Symptômes
- Erreur : `Could not reach Cloud Firestore backend`
- Mode hors ligne activé automatiquement
- Aucune donnée récupérée (0 documents)
- L'app fonctionne mais sans données dynamiques

### Solutions

## 1. **Problème principal : Expo Go**
Expo Go a des limitations avec Firestore. 

### Solution recommandée : Build de développement
```bash
# Installer expo-dev-client
npx expo install expo-dev-client

# Créer un build de développement
npx expo run:android --device
# ou
npx expo run:ios --device
```

## 2. **Vérification de la configuration**

### ✅ Configuration Firebase correcte
Le fichier `src/screens/firebaseConfig.tsx` est correctement configuré avec :
- Project ID : `at-taqwa-app-adc7e`
- API Key valide
- Configuration optimisée pour Expo

### ✅ Règles Firestore
Les règles Firestore permettent la lecture des collections :
- `notifications` : Lecture pour tous les utilisateurs connectés
- `hadiths` : Lecture pour tous les utilisateurs connectés
- `users` : Lecture/écriture pour l'utilisateur propriétaire

## 3. **Tests de diagnostic**

### Test côté serveur (fonctionne ✅)
```bash
node test-firestore.js
```
Résultat : Tous les tests réussis, 5 notifications et 5 hadiths trouvés.

### Test côté client
L'app inclut maintenant :
- ✅ Gestion d'erreur robuste
- ✅ Données de fallback en mode hors ligne
- ✅ Reconnexion automatique
- ✅ Timeout de 10 secondes

## 4. **Mode hors ligne amélioré**

L'app fonctionne maintenant même sans connexion Firestore :
- ✅ Notifications de fallback
- ✅ Hadith du jour de fallback
- ✅ Interface complètement fonctionnelle
- ✅ Pas de blocage de l'utilisateur

## 5. **Logs de débogage**

L'app affiche maintenant des logs détaillés :
```
🚀 Test de connexion Firestore au démarrage...
📡 Réseau réactivé
🔍 Test de connexion Firestore...
✅ Connexion Firestore réussie - X notifications trouvées
```

## 6. **Solutions temporaires**

### Pour tester immédiatement :
1. **Redémarrer Expo** : `npx expo start --clear`
2. **Vérifier la connexion internet**
3. **Attendre 10-15 secondes** après le démarrage
4. **L'app fonctionnera en mode hors ligne** avec les données de fallback

### Pour un développement optimal :
1. **Installer Android Studio** et configurer le SDK
2. **Créer un build de développement** : `npx expo run:android`
3. **Tester sur un appareil physique** ou émulateur

## 7. **Statut actuel**

- ✅ **Configuration Firebase** : Correcte
- ✅ **Règles Firestore** : Correctes
- ✅ **Test côté serveur** : Fonctionne
- ✅ **Gestion d'erreur** : Améliorée
- ✅ **Mode hors ligne** : Fonctionnel
- ⚠️ **Expo Go** : Limitations connues
- 🔧 **Build natif** : Recommandé pour production

## 8. **Prochaines étapes**

1. **Tester l'app actuelle** - elle fonctionne en mode hors ligne
2. **Configurer Android Studio** pour les builds natifs
3. **Créer un build de développement** pour tester Firestore
4. **Déployer en production** avec un build natif

---

**Note** : L'app est maintenant robuste et fonctionne même sans connexion Firestore grâce aux données de fallback et à la gestion d'erreur améliorée. 