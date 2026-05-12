# 🚀 GUIDE DE DÉMARRAGE - AT-TAQWA APP

## 📋 Scripts Disponibles

D'après le `package.json`, voici les scripts disponibles :

```json
{
  "scripts": {
    "start": "expo start --go --clear",
    "start:collab": "expo start --go --clear",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  }
}
```

## ✅ Commandes pour démarrer l'application

### Option 1 : Démarrer Expo (recommandé)

```bash
npm start
# ou
npm run start
```

**Ce que ça fait :**
- Démarre le serveur Expo
- Ouvre automatiquement l'app (`--go`)
- Vide le cache (`--clear`)

### Option 2 : Démarrer pour Android

```bash
npm run android
```

**Ce que ça fait :**
- Compile et lance l'app sur un émulateur Android ou appareil connecté
- Nécessite Android Studio et un émulateur/appareil

### Option 3 : Démarrer pour iOS

```bash
npm run ios
```

**Ce que ça fait :**
- Compile et lance l'app sur un simulateur iOS ou appareil
- Nécessite Xcode (macOS uniquement)

### Option 4 : Démarrer pour Web

```bash
npm run web
```

**Ce que ça fait :**
- Ouvre l'app dans le navigateur web

---

## ⚠️ Note sur `npm run dev`

**Le script `dev` n'existe pas** dans le `package.json`. 

**Pour démarrer en mode développement, utilisez :**
```bash
npm start
```

Si vous voulez ajouter un script `dev`, vous pouvez modifier le `package.json` :

```json
{
  "scripts": {
    "dev": "expo start --go --clear",
    "start": "expo start --go --clear",
    // ... autres scripts
  }
}
```

---

## 🔧 Configuration Java

### Version Java actuelle

D'après la vérification système :
- **Version installée :** OpenJDK 17.0.17
- **Statut :** ✅ Compatible avec Expo/React Native

### Note sur Java 21

Si vous mentionnez **JavaSE-21 LTS**, voici les informations :

**Pour Expo/React Native :**
- ✅ **Java 17** est recommandé et fonctionne parfaitement
- ✅ **Java 21** devrait aussi fonctionner, mais peut nécessiter des ajustements
- ⚠️ **Java 8** est trop ancien et peut causer des problèmes

**Si vous voulez utiliser Java 21 :**
1. Vérifier que Java 21 est installé : `java -version`
2. Configurer `JAVA_HOME` si nécessaire
3. Pour les builds Android locaux, vérifier la compatibilité avec Gradle

**Pour les builds EAS (recommandé) :**
- ✅ EAS gère automatiquement la version Java
- ✅ Pas besoin de configurer Java localement pour les builds cloud

---

## 🎯 Commandes Utiles

### Vérifier la version Node.js
```bash
node --version
```

### Vérifier la version npm
```bash
npm --version
```

### Vérifier la version Java
```bash
java -version
```

### Vérifier la version Expo CLI
```bash
npx expo --version
```

### Installer les dépendances
```bash
npm install
```

### Nettoyer le cache
```bash
npm start -- --clear
# ou
npx expo start --clear
```

---

## 📱 Démarrer avec Expo Go

1. **Installer Expo Go** sur votre téléphone :
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. **Démarrer le serveur :**
   ```bash
   npm start
   ```

3. **Scanner le QR code** avec :
   - **Android :** Expo Go app
   - **iOS :** Appareil photo (ouvre Expo Go automatiquement)

---

## 🏗️ Build pour Production

### Android (EAS Build)
```bash
npx eas-cli@latest build --platform android --profile production
```

### iOS (EAS Build)
```bash
npx eas-cli@latest build --platform ios --profile production
```

**Note :** Les builds EAS utilisent leur propre environnement Java, donc la version Java locale n'affecte pas les builds cloud.

---

## ❓ Problèmes Courants

### "Missing script: dev"
**Solution :** Utilisez `npm start` au lieu de `npm run dev`

### "Command not found: expo"
**Solution :** 
```bash
npm install -g @expo/cli
# ou utilisez npx
npx expo start
```

### Problèmes de cache
**Solution :**
```bash
npm start -- --clear
# ou
npx expo start --clear
```

---

## ✅ Résumé

**Pour démarrer l'application :**
```bash
npm start
```

**Pour ajouter un script `dev` :**
Modifiez `package.json` et ajoutez :
```json
"dev": "expo start --go --clear"
```

**Java :**
- ✅ Java 17 actuel fonctionne parfaitement
- ✅ Java 21 devrait aussi fonctionner
- ✅ Pour les builds EAS, Java local n'est pas nécessaire





