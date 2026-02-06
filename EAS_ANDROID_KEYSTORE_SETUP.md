# 🔐 Configuration du Keystore Android pour EAS Build

## ❌ Problème
```
Generating a new Keystore is not supported in --non-interactive mode
Error: build command failed.
```

## ✅ Solution

### Étape 1 : Générer le keystore en mode interactif

**IMPORTANT :** Tu dois faire cette étape **une seule fois** en mode interactif. Après, tous les builds pourront utiliser ce keystore.

```bash
# Se connecter à EAS (si pas déjà fait)
npx eas-cli@latest login

# Générer le keystore Android en mode interactif
npx eas-cli@latest credentials --platform android
```

**Lors de l'exécution :**
1. Choisis le profil `production` (ou `preview` si tu veux)
2. Sélectionne "Generate a new keystore"
3. EAS va générer et stocker le keystore de manière sécurisée sur leurs serveurs

### Étape 2 : Vérifier que le keystore est créé

```bash
# Voir les credentials Android
npx eas-cli@latest credentials --platform android --profile production
```

Tu devrais voir quelque chose comme :
```
Configuration: Build Credentials [Nom] (Default)
Keystore
Type                JKS
Key Alias           [alias]
MD5 Fingerprint     [fingerprint]
SHA1 Fingerprint    [fingerprint]
SHA256 Fingerprint  [fingerprint]
```

**✅ Si tu vois ces informations, le keystore est créé avec succès !**

### Étape 3 : Build en mode non-interactif (maintenant ça marchera)

```bash
# Build production AAB
npx eas-cli@latest build --platform android --profile production --non-interactive
```

## 🔄 Alternative : Utiliser un keystore existant

Si tu as déjà un keystore Android existant :

```bash
# Uploader un keystore existant
npx eas-cli@latest credentials --platform android --profile production

# Choisir "Upload a keystore"
# Fournir le chemin vers ton fichier .keystore
# Fournir les informations (alias, password, etc.)
```

## 📝 Notes importantes

1. **Keystore géré par Expo** : EAS stocke le keystore de manière sécurisée. Tu n'as pas besoin de le télécharger ou de le gérer manuellement.

2. **Un seul keystore par profil** : Chaque profil (`production`, `preview`, `development`) peut avoir son propre keystore.

3. **Sécurité** : Ne commite JAMAIS un fichier `.keystore` dans Git. EAS le gère pour toi.

4. **CI/CD** : Une fois le keystore généré, les builds en mode `--non-interactive` fonctionneront dans GitHub Actions.

## 🚀 Après la configuration

Une fois le keystore généré, tu pourras utiliser :

```bash
# Build production
npx eas-cli@latest build --platform android --profile production --non-interactive

# Build preview
npx eas-cli@latest build --platform android --profile preview --non-interactive
```

Les deux commandes fonctionneront sans problème en mode non-interactif.





