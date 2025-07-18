# Guide d'Activation Firebase Storage

## État Actuel

La fonctionnalité de photo de profil fonctionne actuellement avec les images locales. Pour une solution complète en production, vous devez activer Firebase Storage.

## Étapes pour Activer Firebase Storage

### 1. Accéder à la Console Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `at-taqwa-app-14b7f`
3. Dans le menu de gauche, cliquez sur **Storage**

### 2. Activer Firebase Storage

1. Cliquez sur **"Commencer"** ou **"Get started"**
2. Choisissez **"Production mode"** pour les règles de sécurité
3. Sélectionnez l'emplacement de votre bucket (choisissez le plus proche de vos utilisateurs)
4. Cliquez sur **"Terminé"**

### 3. Déployer les Règles de Sécurité

Une fois Storage activé, déployez les règles de sécurité :

```bash
# Installer Firebase CLI (si pas déjà fait)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Déployer les règles Storage
firebase deploy --only storage
```

### 4. Mettre à Jour le Code

Une fois Storage activé, remplacez la fonction `uploadImage` dans `ParametresScreen.tsx` par :

```typescript
const uploadImage = async (uri: string) => {
  setLoading(true);
  try {
    if (!user || !user.uid) {
      throw new Error('Utilisateur non connecté');
    }

    // Téléversement sur Firebase Storage
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `avatars/${user.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Mettre à jour le profil
    await updateProfile(user, { photoURL: downloadURL });
    const updatedUser = { ...user, photoURL: downloadURL };
    setUser(updatedUser);
    
    await updateDoc(doc(db, 'users', user.uid), { 
      photoURL: downloadURL,
      updatedAt: new Date()
    });
    
    Alert.alert('Succès', 'Photo de profil mise à jour avec succès !');
  } catch (e) {
    console.error('❌ Erreur upload image:', e);
    Alert.alert('Erreur', 'Impossible de téléverser l\'image. Veuillez réessayer.');
  }
  setLoading(false);
};
```

## Avantages de Firebase Storage

### ✅ Fonctionnalités
- **Stockage permanent** : Les images ne sont pas perdues
- **URLs publiques** : Accès direct aux images
- **Sécurité** : Contrôle d'accès via les règles
- **Performance** : CDN global pour un accès rapide

### ✅ Sécurité
- **Authentification requise** : Seuls les utilisateurs connectés peuvent uploader
- **Propriété** : Chaque utilisateur ne peut modifier que ses propres images
- **Validation** : Types et tailles d'images contrôlés

### ✅ Scalabilité
- **Stockage illimité** : Évolue avec vos besoins
- **Performance** : Optimisé pour les applications mobiles
- **Coût** : Payez seulement ce que vous utilisez

## Coûts Firebase Storage

### Tarification (2024)
- **Stockage** : $0.026/GB/mois
- **Transfert** : $0.12/GB (sortant)
- **Opérations** : $0.004/10,000 opérations

### Estimation pour 1000 utilisateurs
- **Stockage** : ~1GB = $0.026/mois
- **Transfert** : ~10GB = $1.20/mois
- **Total** : ~$1.23/mois

## Alternative Temporaire

En attendant l'activation de Firebase Storage, l'application utilise les URIs locaux des images. Cela fonctionne pour les tests mais les images ne sont pas persistantes entre les sessions.

## Test de la Fonctionnalité

1. **Actuellement** : Les images sont stockées localement
2. **Après activation Storage** : Les images seront stockées dans le cloud
3. **Migration** : Les anciennes images locales devront être re-uploadées

## Support

Pour toute question sur l'activation de Firebase Storage :
1. Consultez la [documentation Firebase](https://firebase.google.com/docs/storage)
2. Vérifiez les [règles de sécurité](https://firebase.google.com/docs/storage/security)
3. Contactez l'équipe de développement 