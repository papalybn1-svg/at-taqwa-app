# 🎨 GUIDE - REMPLACER L'ICÔNE SUR GOOGLE PLAY
**Date :** 30 janvier 2025  
**Projet :** at-taqwa-app  
**Problème :** Icône "unnamed" affichée sur Google Play au lieu de l'icône de l'app

---

## ✅ CONFIGURATION ACTUELLE

### Configuration dans `app.json`

```json
"android": {
  "icon": "./assets/LOGO_AT_TAQWA.png",
  "adaptiveIcon": {
    "foregroundImage": "./assets/LOGO_AT_TAQWA.png",
    "backgroundColor": "#2E8B57"
  },
```

**✅ La configuration est correcte !** L'icône `LOGO_AT_TAQWA.png` est bien configurée pour Android.

---

## 🔧 POURQUOI L'ICÔNE "UNNAMED" APPARAÎT ?

### Causes possibles

1. **Build ancien** : Le build actuel sur Google Play a été créé avant la configuration de l'icône
2. **Icône non intégrée** : L'icône n'a pas été correctement intégrée dans le build
3. **Cache Google Play** : Google Play peut mettre du temps à mettre à jour l'icône

---

## 🚀 SOLUTION : CRÉER UN NOUVEAU BUILD

### Étape 1 : Vérifier la configuration

**Fichier :** `app.json`

✅ Vérifier que :
- `android.icon` pointe vers `./assets/LOGO_AT_TAQWA.png`
- `android.adaptiveIcon.foregroundImage` pointe vers `./assets/LOGO_AT_TAQWA.png`
- Le fichier `assets/LOGO_AT_TAQWA.png` existe

### Étape 2 : Vérifier les dimensions de l'icône

**Recommandations Google Play :**
- **Format :** PNG
- **Dimensions :** 1024x1024 pixels (minimum)
- **Fond :** Transparent (pour adaptive icon)
- **Taille fichier :** < 1 MB

**Vérifier :**
```bash
# Vérifier les dimensions
file assets/LOGO_AT_TAQWA.png
```

### Étape 3 : Incrémenter le versionCode

**Fichier :** `app.json`

```json
"android": {
  "versionCode": 6,  // Incrémenter de 5 à 6
```

**⚠️ IMPORTANT :** Le `versionCode` doit être supérieur à la version actuelle sur Google Play.

### Étape 4 : Créer un nouveau build

**Option A : Build local (test)**
```bash
npx eas-cli@latest build --platform android --profile production --local
```

**Option B : Build sur EAS (recommandé)**
```bash
npx eas-cli@latest build --platform android --profile production
```

### Étape 5 : Uploader sur Google Play Console

1. Aller dans **Google Play Console**
2. Sélectionner votre app **At-Taqwa**
3. Aller dans **Tester et publier** > **Créer une release**
4. Uploader le nouveau **AAB** généré
5. Vérifier que l'icône est correcte dans l'aperçu
6. Envoyer pour examen

---

## 📋 CHECKLIST AVANT LE BUILD

### ✅ Vérifications pré-build

- [ ] `app.json` : `android.icon` = `./assets/LOGO_AT_TAQWA.png`
- [ ] `app.json` : `android.adaptiveIcon.foregroundImage` = `./assets/LOGO_AT_TAQWA.png`
- [ ] `app.json` : `android.versionCode` incrémenté (ex: 5 → 6)
- [ ] Fichier `assets/LOGO_AT_TAQWA.png` existe
- [ ] Icône en 1024x1024 pixels minimum
- [ ] Icône avec fond transparent (pour adaptive icon)

---

## 🎯 RÉSULTAT ATTENDU

### Après le nouveau build

- ✅ L'icône `LOGO_AT_TAQWA.png` sera intégrée dans l'AAB
- ✅ L'icône s'affichera correctement sur Google Play
- ✅ L'icône s'affichera correctement sur les appareils Android après téléchargement
- ✅ Plus d'icône "unnamed"

---

## ⚠️ IMPORTANT

### Temps de propagation

- **Google Play Console** : L'icône peut prendre quelques minutes à apparaître dans l'aperçu
- **Google Play Store** : L'icône peut prendre quelques heures à se mettre à jour après publication
- **Appareils** : Les utilisateurs verront la nouvelle icône après avoir mis à jour l'app

### Vérification après upload

1. **Dans Google Play Console :**
   - Aller dans **Tester et publier** > **Créer une release**
   - Vérifier l'aperçu de l'icône avant de publier

2. **Après publication :**
   - Vérifier sur Google Play Store que l'icône est correcte
   - Tester sur un appareil Android après téléchargement

---

## 🔍 DÉPANNAGE

### Si l'icône ne s'affiche toujours pas

1. **Vérifier le build :**
   ```bash
   # Extraire l'AAB et vérifier les icônes
   unzip app-release.aab -d extracted
   ls extracted/res/mipmap-*/
   ```

2. **Vérifier les logs EAS :**
   - Regarder les logs du build pour voir si l'icône a été trouvée
   - Vérifier qu'il n'y a pas d'erreurs

3. **Vérifier le format de l'icône :**
   - S'assurer que l'icône est en PNG
   - Vérifier que l'icône n'est pas corrompue

4. **Nettoyer le cache :**
   ```bash
   # Nettoyer le cache Expo
   npx expo start --clear
   ```

---

## ✅ STATUT ACTUEL

**Configuration :** ✅ Correcte  
**Icône configurée :** `LOGO_AT_TAQWA.png`  
**Prochaine étape :** Créer un nouveau build avec `versionCode` incrémenté

---

**Une fois le nouveau build créé et uploadé sur Google Play, l'icône "unnamed" sera remplacée par votre icône `LOGO_AT_TAQWA.png` !** 🎉






