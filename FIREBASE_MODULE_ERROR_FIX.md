# 🔧 Fix Erreur "Requiring unknown module" - Expo Go + Firebase

## 🚨 **Problème identifié**

L'erreur `Error: Requiring unknown module "1439"` et `require(_dependencyMap[15]) is not a function` indique un problème de compatibilité entre Expo Go et certaines fonctions Firebase.

## 🔍 **Causes possibles**

1. **Import `httpsCallable`** : Problème connu avec Expo Go
2. **Version Firebase** : Conflit de version
3. **Cache Metro** : Cache corrompu
4. **Imports multiples** : Conflit entre différents modules Firebase

## 🛠️ **Solutions appliquées**

### **Solution 1 : Suppression de `httpsCallable`**
- ✅ Supprimé l'import `httpsCallable` de `firebase/functions`
- ✅ Supprimé l'import `functions` de `firebaseConfig`
- ✅ Simplifié pour utiliser seulement `sendPasswordResetEmail` de Firebase Auth

### **Solution 2 : Nettoyage du cache**
```bash
# Nettoyer le cache Metro
npx expo start --clear

# Ou redémarrer complètement
npx expo start --go --clear
```

### **Solution 3 : Vérification des imports**
```typescript
// ✅ Imports stables pour Expo Go
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// ❌ Import problématique (supprimé)
// import { httpsCallable } from 'firebase/functions';
```

## 📧 **Fonctionnalité actuelle**

### **Email de réinitialisation**
- ✅ Utilise Firebase Auth par défaut
- ✅ Plus stable dans Expo Go
- ✅ Affiche un message de confirmation
- ✅ Gestion d'erreurs complète

### **Logs attendus**
```
📧 Envoi email réinitialisation à: imamelhadji.msk@gmail.com
✅ Email de réinitialisation envoyé avec succès
```

## 🎯 **Test de la solution**

1. **Redémarrer l'application** avec le cache nettoyé
2. **Tester la fonctionnalité** :
   - Aller dans "Paramètres"
   - Cliquer sur "Changer le mot de passe"
   - Cliquer sur "Envoyer l'email"
3. **Vérifier les logs** : Plus d'erreur "unknown module"
4. **Vérifier l'email** : Devrait arriver dans la boîte de réception

## 🔄 **Configuration Firebase Auth**

### **Vérifier Firebase Console**
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans "Authentication" → "Templates"
4. Vérifier que les templates d'email sont configurés
5. Vérifier l'adresse d'envoi autorisée

### **Templates d'email**
- **Action Code** : Template de réinitialisation de mot de passe
- **Adresse d'envoi** : `noreply@at-taqwa-app-14b7f.firebaseapp.com`
- **Domaine autorisé** : Votre domaine Firebase

## 📊 **Monitoring**

### **Logs de succès**
```
📧 Envoi email réinitialisation à: imamelhadji.msk@gmail.com
✅ Email de réinitialisation envoyé avec succès
```

### **Logs d'erreur**
```
❌ Erreur reset password: [FirebaseError: auth/user-not-found]
❌ Erreur reset password: [FirebaseError: auth/too-many-requests]
❌ Erreur reset password: [FirebaseError: auth/network-request-failed]
```

## 🎯 **Prochaines étapes**

1. **Tester immédiatement** la fonctionnalité
2. **Vérifier l'email** dans la boîte de réception
3. **Signaler le résultat** : Email reçu ou non
4. **Si problème persiste** : Configurer SendGrid (guide SENDGRID_SETUP.md)

## 💡 **Alternative SendGrid**

Si Firebase Auth ne fonctionne toujours pas :
1. Suivre le guide `SENDGRID_SETUP.md`
2. Configurer SendGrid pour un envoi plus fiable
3. Déployer les Firebase Functions

---

**Note** : Cette solution utilise Firebase Auth par défaut qui est plus stable dans Expo Go. L'erreur de module devrait être résolue. 