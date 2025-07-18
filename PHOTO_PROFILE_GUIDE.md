# Guide de la Fonctionnalité Photo de Profil

## Vue d'ensemble

La fonctionnalité de photo de profil permet aux utilisateurs de personnaliser leur profil en ajoutant une photo personnelle. Cette fonctionnalité est accessible depuis la page des paramètres.

## Fonctionnalités

### 1. Sélection de Photo
- **Caméra** : Prendre une nouvelle photo avec la caméra de l'appareil
- **Galerie** : Sélectionner une photo existante depuis la galerie

### 2. Édition d'Image
- Recadrage automatique en format carré (1:1)
- Qualité optimisée (80%) pour un bon équilibre qualité/taille
- Aperçu en temps réel de la photo sélectionnée

### 3. Stockage et Synchronisation
- **Firebase Storage** : Stockage sécurisé des images
- **Firebase Auth** : Mise à jour du profil utilisateur
- **Firestore** : Synchronisation des données utilisateur
- **Cache local** : Aperçu immédiat dans l'interface

## Permissions Requises

### iOS
- `NSCameraUsageDescription` : Accès à la caméra
- `NSPhotoLibraryUsageDescription` : Accès à la galerie

### Android
- `CAMERA` : Permission caméra
- `READ_EXTERNAL_STORAGE` : Lecture galerie
- `WRITE_EXTERNAL_STORAGE` : Écriture galerie

## Structure des Données

### Firebase Storage
```
avatars/
  ├── {user_uid}_{timestamp}.jpg
  └── ...
```

### Firestore User Document
```json
{
  "photoURL": "https://firebasestorage.googleapis.com/...",
  "displayName": "Nom Utilisateur",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Flux Utilisateur

1. **Accès** : L'utilisateur clique sur "Modifier le profil" dans les paramètres
2. **Sélection** : Choix entre caméra ou galerie
3. **Permission** : Demande automatique des permissions si nécessaire
4. **Édition** : Recadrage de l'image en format carré
5. **Upload** : Téléversement automatique vers Firebase Storage
6. **Synchronisation** : Mise à jour du profil Firebase Auth et Firestore
7. **Confirmation** : Message de succès et mise à jour de l'interface

## Gestion des Erreurs

### Erreurs de Permission
- Message explicatif pour guider l'utilisateur
- Redirection vers les paramètres système si nécessaire

### Erreurs de Téléversement
- Tentative de récupération automatique
- Message d'erreur clair avec suggestion de réessayer

### Erreurs de Réseau
- Indicateur de chargement pendant l'upload
- Gestion des timeouts et interruptions

## Sécurité

### Validation des Images
- Vérification du type MIME
- Limitation de la taille (max 10MB)
- Format forcé en JPG pour la compression

### Stockage Sécurisé
- Chemins uniques avec timestamp
- Accès restreint via Firebase Security Rules
- Suppression automatique des anciennes images

## Performance

### Optimisation des Images
- Compression automatique (qualité 80%)
- Redimensionnement en format carré
- Cache local pour les aperçus

### Gestion de la Mémoire
- Libération automatique des ressources
- Éviter les fuites mémoire lors de la sélection

## Tests Recommandés

### Fonctionnels
- [ ] Sélection depuis la galerie
- [ ] Prise de photo avec la caméra
- [ ] Recadrage et édition
- [ ] Upload et synchronisation
- [ ] Gestion des erreurs

### Permissions
- [ ] Demande de permission caméra
- [ ] Demande de permission galerie
- [ ] Gestion du refus de permission

### Performance
- [ ] Upload d'images de différentes tailles
- [ ] Gestion de la connexion lente
- [ ] Libération de la mémoire

## Maintenance

### Nettoyage du Storage
- Suppression des anciennes images non utilisées
- Monitoring de l'espace de stockage

### Mise à Jour
- Vérification de la compatibilité avec les nouvelles versions d'Expo
- Mise à jour des permissions si nécessaire

## Support

Pour toute question ou problème lié à cette fonctionnalité, consultez :
- La documentation Expo ImagePicker
- Les logs Firebase pour les erreurs de téléversement
- Les permissions système de l'appareil 