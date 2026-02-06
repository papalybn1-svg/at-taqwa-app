# 🎨 GUIDE COMPLET - ICÔNE ANDROID (Adaptive Icon)

**Date :** 5 février 2025  
**Projet :** at-taqwa-app  
**Objectif :** Créer une icône Android conforme aux normes Google Play

---

## 📐 DIMENSIONS REQUISES POUR ANDROID

### ✅ Icône Adaptive (Android 8.0+)

**Foreground Image (Image de premier plan) :**
- **Dimensions :** 1024x1024 pixels (obligatoire)
- **Format :** PNG avec transparence
- **Zone sûre :** 66% au centre (≈ 676x676 pixels)
  - ⚠️ **IMPORTANT :** Le contenu important (logo, texte) doit être dans un cercle de 676px au centre
  - Les bords peuvent être coupés selon la forme choisie par l'utilisateur
- **Taille fichier :** < 1 MB recommandé

**Background (Arrière-plan) :**
- **Option 1 :** Couleur unie (recommandé)
  - Format : Code couleur hexadécimal (ex: `#2E8B57`)
- **Option 2 :** Image 1024x1024 pixels
  - Format : PNG ou JPG
  - Sera visible uniquement sur les bords (zone non sûre)

### ✅ Icône Standard (Fallback pour Android < 8.0)

- **Dimensions :** 1024x1024 pixels
- **Format :** PNG
- **Fond :** Peut être transparent ou avec fond

---

## 🎯 ZONE SÛRE (Safe Zone)

### Pourquoi c'est important ?

Android permet aux utilisateurs de choisir la forme de l'icône :
- **Cercle** (le plus restrictif)
- **Carré arrondi** (forme par défaut)
- **Carré** (le moins restrictif)

Le système découpe l'icône selon la forme choisie, donc le contenu important doit être dans la **zone sûre**.

### Dimensions de la zone sûre

```
┌─────────────────────────────────┐
│                                 │
│    ┌─────────────────┐         │
│    │                 │         │
│    │   ZONE SÛRE     │         │
│    │   (676x676px)   │         │
│    │                 │         │
│    └─────────────────┘         │
│                                 │
└─────────────────────────────────┘
        1024x1024 pixels
```

**Calcul :**
- Zone sûre = 66% de 1024px = 675.84px ≈ 676px
- Position : Centré (marges de 174px de chaque côté)

---

## 🔧 CONFIGURATION ACTUELLE

### Fichier : `app.json`

```json
{
  "android": {
    "icon": "./assets/LOGO_AT_TAQWA.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/LOGO_AT_TAQWA.png",
      "backgroundColor": "#2E8B57"
    }
  }
}
```

### ✅ Points à vérifier

1. **Dimensions de l'image :** 1024x1024 pixels
2. **Zone sûre :** Le logo doit être centré dans un cercle de 676px
3. **Transparence :** Le PNG doit avoir un fond transparent
4. **Background color :** `#2E8B57` (vert) est bien configuré

---

## 🛠️ COMMENT CRÉER/CORRIGER L'ICÔNE

### Option 1 : Utiliser un outil en ligne (Recommandé)

**Outils recommandés :**
1. **Android Asset Studio** (officiel Google)
   - URL : https://romannurik.github.io/AndroidAssetStudio/icons-adaptive.html
   - Avantages : Crée automatiquement toutes les tailles
   - Instructions :
     - Téléchargez votre logo (1024x1024px)
     - Ajustez la zone sûre
     - Choisissez la couleur de fond
     - Téléchargez le ZIP généré

2. **App Icon Generator**
   - URL : https://www.appicon.co/
   - Avantages : Interface simple, génère iOS + Android

### Option 2 : Créer manuellement avec Photoshop/GIMP

**Étapes :**

1. **Créer un nouveau document**
   - Dimensions : 1024x1024 pixels
   - Résolution : 72 DPI minimum
   - Fond : Transparent

2. **Ajouter le logo**
   - Centrer le logo dans un cercle de 676px
   - Utiliser des guides pour marquer la zone sûre
   - S'assurer que le logo ne dépasse pas la zone sûre

3. **Exporter en PNG**
   - Format : PNG-24 avec transparence
   - Optimiser la taille (utiliser TinyPNG ou ImageOptim)

### Option 3 : Utiliser Figma (Gratuit)

**Étapes :**

1. Créer un frame de 1024x1024px
2. Ajouter un cercle de 676px au centre (guide)
3. Placer le logo dans le cercle
4. Exporter en PNG avec transparence

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### ✅ Vérifications à faire

- [ ] L'icône fait exactement **1024x1024 pixels**
- [ ] Le logo est centré dans la **zone sûre (676x676px)**
- [ ] Le fichier est en **PNG avec transparence**
- [ ] La taille du fichier est **< 1 MB**
- [ ] Le `backgroundColor` dans `app.json` correspond à votre marque
- [ ] L'icône est visible et claire sur fond clair ET foncé

### ✅ Test visuel

**Testez l'icône dans différentes formes :**
1. **Cercle** (le plus restrictif)
2. **Carré arrondi** (forme par défaut)
3. **Carré** (le moins restrictif)

Utilisez : https://romannurik.github.io/AndroidAssetStudio/icons-adaptive.html

---

## 🚀 DÉPLOIEMENT

### Après avoir créé/corrigé l'icône

1. **Remplacer le fichier**
   ```bash
   # Remplacer assets/LOGO_AT_TAQWA.png avec votre nouvelle icône
   ```

2. **Vérifier la configuration dans `app.json`**
   ```json
   {
     "android": {
       "icon": "./assets/LOGO_AT_TAQWA.png",
       "adaptiveIcon": {
         "foregroundImage": "./assets/LOGO_AT_TAQWA.png",
         "backgroundColor": "#2E8B57"  // Ajustez si nécessaire
       }
     }
   }
   ```

3. **Incrémenter le versionCode**
   ```json
   {
     "android": {
       "versionCode": 9  // Incrémenter de 8 à 9
     }
   }
   ```

4. **Créer un nouveau build**
   ```bash
   npx eas-cli build --platform android --profile production
   ```

5. **Téléverser sur Google Play Console**
   - Le nouvel APK/AAB contiendra la nouvelle icône
   - Google Play mettra à jour l'icône dans les 24-48h

---

## 📊 TAILLES GÉNÉRÉES AUTOMATIQUEMENT

Expo génère automatiquement toutes les tailles nécessaires :

| Densité | Taille | Usage |
|---------|--------|-------|
| mdpi | 48x48px | Écrans basse densité |
| hdpi | 72x72px | Écrans moyenne densité |
| xhdpi | 96x96px | Écrans haute densité |
| xxhdpi | 144x144px | Écrans très haute densité |
| xxxhdpi | 192x192px | Écrans ultra haute densité |
| Play Store | 512x512px | Google Play Store |

**Vous n'avez besoin que d'une seule image source de 1024x1024px !**

---

## ⚠️ ERREURS COURANTES À ÉVITER

1. **❌ Logo trop grand**
   - Le logo dépasse la zone sûre → sera coupé sur certains appareils

2. **❌ Logo décentré**
   - Le logo n'est pas au centre → apparaîtra mal aligné

3. **❌ Fond non transparent**
   - Le PNG a un fond blanc → apparaîtra avec un carré blanc

4. **❌ Dimensions incorrectes**
   - L'image n'est pas 1024x1024px → sera déformée ou floue

5. **❌ Fichier trop lourd**
   - Le PNG fait > 1 MB → ralentit le téléchargement

---

## 🎨 RECOMMANDATIONS DE DESIGN

### Pour une icône claire et professionnelle

1. **Simplicité**
   - Utilisez des formes simples et reconnaissables
   - Évitez les détails trop fins

2. **Contraste**
   - Assurez-vous que le logo est visible sur le fond choisi
   - Testez sur fond clair ET foncé

3. **Couleurs**
   - Utilisez des couleurs vives et contrastées
   - Maximum 2-3 couleurs principales

4. **Texte**
   - Évitez le texte dans l'icône (sera illisible en petite taille)
   - Si nécessaire, utilisez des initiales ou un symbole

---

## 📞 BESOIN D'AIDE ?

Si vous avez besoin d'aide pour créer l'icône :
1. Utilisez Android Asset Studio (lien ci-dessus)
2. Ou créez un ticket avec votre logo actuel pour analyse

---

## ✅ RÉSUMÉ RAPIDE

**Dimensions requises :**
- **1024x1024 pixels** (obligatoire)
- **Zone sûre : 676x676px** au centre
- **Format : PNG avec transparence**
- **Taille : < 1 MB**

**Configuration :**
- `foregroundImage` : Votre logo (1024x1024px, transparent)
- `backgroundColor` : Couleur de fond (ex: `#2E8B57`)

**Test :**
- Utilisez Android Asset Studio pour prévisualiser
- Testez en cercle, carré arrondi, et carré



