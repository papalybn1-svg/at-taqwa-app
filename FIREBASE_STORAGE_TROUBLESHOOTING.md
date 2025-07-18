# Guide de Dépannage Firebase Storage

## Erreurs Courantes et Solutions

### 1. Erreur `storage/unknown`

**Symptômes :**
- Message d'erreur : "Firebase Storage: An unknown error occurred"
- Upload d'image échoue

**Causes possibles :**
- Règles de sécurité Firebase Storage non configurées
- Projet Firebase non configuré pour Storage
- Permissions manquantes

**Solutions :**

#### A. Vérifier la Configuration Firebase
```bash
# Vérifier que Firebase Storage est activé
firebase projects:list
firebase use at-taqwa-app-14b7f
```

#### B. Déployer les Règles de Sécurité
```bash
# Créer le fichier storage.rules
firebase init storage

# Déployer les règles
firebase deploy --only storage
```

#### C. Règles de Sécurité Recommandées
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId.split('_')[0]
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Erreur `storage/unauthorized`

**Symptômes :**
- Accès refusé lors de l'upload
- Utilisateur non authentifié

**Solutions :**
- Vérifier que l'utilisateur est connecté
- Vérifier les règles de sécurité
- S'assurer que l'UID correspond

### 3. Erreur `storage/quota-exceeded`

**Symptômes :**
- Espace de stockage insuffisant
- Limite de quota atteinte

**Solutions :**
- Nettoyer les anciennes images
- Augmenter le quota Firebase
- Compresser les images avant upload

### 4. Erreur `storage/network-request-failed`

**Symptômes :**
- Problèmes de connexion réseau
- Timeout lors de l'upload

**Solutions :**
- Vérifier la connexion internet
- Réduire la taille des images
- Implémenter une retry logic

## Configuration Recommandée

### 1. Initialisation Firebase Storage
```typescript
import { getStorage } from 'firebase/storage';

export const storage = getStorage(app);
```

### 2. Gestion d'Erreurs Améliorée
```typescript
const uploadImage = async (uri: string) => {
  try {
    // Vérifications préalables
    if (!user?.uid) throw new Error('Utilisateur non connecté');
    if (!storage) throw new Error('Storage non initialisé');
    
    // Upload avec gestion d'erreur
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur upload:', error);
    throw error;
  }
};
```

### 3. Compression d'Image
```typescript
const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512, height: 512 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

## Tests de Diagnostic

### 1. Test de Connexion
```typescript
const testStorageConnection = async () => {
  try {
    const testRef = ref(storage, 'test/connection.txt');
    console.log('✅ Storage accessible');
    return true;
  } catch (error) {
    console.error('❌ Erreur Storage:', error);
    return false;
  }
};
```

### 2. Test d'Upload
```typescript
const testUpload = async () => {
  try {
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testRef = ref(storage, 'test/upload-test.txt');
    await uploadBytes(testRef, testBlob);
    console.log('✅ Upload test réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur upload test:', error);
    return false;
  }
};
```

## Monitoring et Logs

### 1. Logs Recommandés
```typescript
console.log('📤 Upload début:', fileName);
console.log('📏 Taille:', blob.size, 'bytes');
console.log('🔗 URL finale:', downloadURL);
```

### 2. Métriques à Surveiller
- Taux de succès des uploads
- Temps de réponse moyen
- Erreurs par type
- Utilisation du stockage

## Optimisations

### 1. Performance
- Compression des images (qualité 0.8)
- Redimensionnement automatique
- Cache local des URLs

### 2. Sécurité
- Validation des types MIME
- Limitation de la taille
- Règles de sécurité strictes

### 3. UX
- Indicateurs de progression
- Messages d'erreur clairs
- Retry automatique

## Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Tester la connexion Firebase
3. Vérifier les règles de sécurité
4. Consulter la documentation Firebase 