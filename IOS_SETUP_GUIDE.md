# 🍎 Guide de Configuration iOS pour At-Taqwa App

## 📋 **Prérequis**

### **1. Compte Apple Developer**
- Compte Apple Developer actif (99$/an)
- Ou compte gratuit (limitations : 7 jours de build, pas de TestFlight)

### **2. Configuration Firebase**
- Projet Firebase existant
- iOS app ajoutée dans Firebase Console

---

## 🔥 **Configuration Firebase pour iOS**

### **Étape 1 : Ajouter iOS dans Firebase Console**

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner ton projet `at-taqwa-app-adc7e`
3. Cliquer sur l'icône iOS (🍎) pour ajouter une app iOS
4. Remplir les informations :
   - **Bundle ID** : `com.attaqwa.app`
   - **App nickname** : `At-Taqwa iOS`
   - **App Store ID** : (laisser vide pour l'instant)

### **Étape 2 : Télécharger GoogleService-Info.plist**

1. Télécharger le fichier `GoogleService-Info.plist`
2. **NE PAS** le commiter dans Git (contient des clés sensibles)
3. Le placer dans le dossier racine du projet

### **Étape 3 : Configuration automatique**

```bash
# EAS Build s'occupera automatiquement de la configuration
# Pas besoin de configuration manuelle !
```

---

## 🛠️ **Configuration EAS Build pour iOS**

### **Étape 1 : Vérifier la configuration**

```bash
# Vérifier que EAS est configuré
eas project:info

# Voir les builds disponibles
eas build:list
```

### **Étape 2 : Premier build iOS**

```bash
# Build de prévisualisation iOS
eas build --platform ios --profile preview

# Ou build de développement
eas build --platform ios --profile development
```

### **Étape 3 : Suivre le build**

```bash
# Voir le statut du build
eas build:view [BUILD_ID]

# Télécharger l'IPA quand terminé
eas build:download [BUILD_ID]
```

---

## 📱 **Installation sur iPhone**

### **Option 1 : Installation directe (Build Preview)**

1. Télécharger l'IPA depuis EAS
2. Utiliser **AltStore** ou **Sideloadly** pour installer
3. Ou utiliser **Xcode** si tu as un Mac

### **Option 2 : TestFlight (Build Production)**

```bash
# Soumettre à l'App Store
eas submit --platform ios --profile production
```

### **Option 3 : Installation via Xcode (Mac requis)**

```bash
# Build local avec Xcode
npx expo run:ios
```

---

## 🔧 **Configuration Apple Developer**

### **Étape 1 : Certificats et Profils**

EAS Build gère automatiquement :
- ✅ Certificats de développement
- ✅ Certificats de distribution
- ✅ Profils de provisioning
- ✅ App Store Connect

### **Étape 2 : Configuration App Store Connect**

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. Créer une nouvelle app
3. Récupérer l'App Store ID
4. Mettre à jour dans Firebase Console

---

## 🚀 **Workflow de développement iOS**

### **Développement quotidien**

```bash
# 1. Faire tes modifications
# 2. Tester avec Expo Go (limité)
npx expo start -c

# 3. Build de développement pour tests complets
eas build --platform ios --profile development

# 4. Installer l'IPA sur ton iPhone
# 5. Tester les fonctionnalités Firebase
```

### **Mise à jour de l'app**

```bash
# Mise à jour OTA (rapide)
eas update --branch preview --message "Nouvelles fonctionnalités"

# Build complet (nécessaire pour nouvelles dépendances)
eas build --platform ios --profile preview
```

---

## 🐛 **Dépannage iOS**

### **Problèmes courants**

#### **Build échoue avec erreur de certificat**
```bash
# Vérifier la configuration Apple Developer
eas credentials

# Réinitialiser les certificats
eas credentials --platform ios --clear
```

#### **App ne se connecte pas à Firebase**
- Vérifier que `GoogleService-Info.plist` est bien téléchargé
- Vérifier les règles Firestore
- Tester la connexion : `node test-firestore.js`

#### **App ne s'installe pas sur iPhone**
- Vérifier que l'iPhone est en mode développeur
- Utiliser AltStore ou Sideloadly
- Vérifier les profils de provisioning

### **Logs de débogage**

```bash
# Voir les logs du build
eas build:view [BUILD_ID] --logs

# Voir les logs de l'app installée
# Utiliser Xcode ou Console.app sur Mac
```

---

## 📊 **Comparaison des options iOS**

| Option | Coût | Facilité | Limitations |
|--------|------|----------|-------------|
| **Compte gratuit** | 0€ | ⭐⭐⭐⭐ | 7 jours, pas TestFlight |
| **Compte Developer** | 99€/an | ⭐⭐⭐⭐⭐ | Aucune |
| **Build local** | 0€ | ⭐⭐ | Mac requis |

---

## 🎯 **Commandes utiles**

```bash
# Voir tous les builds iOS
eas build:list --platform ios

# Voir les builds récents
eas build:list --limit 5

# Annuler un build en cours
eas build:cancel [BUILD_ID]

# Voir les métriques de build
eas build:view [BUILD_ID] --json
```

---

## 📞 **Support**

- **Documentation EAS** : https://docs.expo.dev/build/introduction/
- **Documentation Firebase iOS** : https://firebase.google.com/docs/ios/setup
- **Support Apple Developer** : https://developer.apple.com/support/

---

## ✅ **Checklist de configuration**

- [ ] Compte Apple Developer configuré
- [ ] iOS app ajoutée dans Firebase Console
- [ ] `GoogleService-Info.plist` téléchargé
- [ ] Configuration EAS mise à jour
- [ ] Premier build iOS réussi
- [ ] App installée sur iPhone
- [ ] Connexion Firebase testée
- [ ] TestFlight configuré (optionnel)

**🎉 Ton app iOS est prête !** 