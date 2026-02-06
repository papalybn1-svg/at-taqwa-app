# 🔧 Guide : Configurer assetlinks.json pour Android App Links

**Objectif :** Faire en sorte qu'Android ouvre directement l'app sans afficher le site web (comme iOS)

---

## 🎯 Pourquoi Android montre le site ?

**iOS** : Universal Links interceptent directement le lien → App s'ouvre instantanément  
**Android** : App Links nécessitent la vérification de `assetlinks.json` → Si non vérifié, le site s'affiche d'abord

---

## ✅ SOLUTION : Créer le fichier `assetlinks.json`

### Étape 1 : Obtenir le SHA256 Fingerprint

Vous avez **2 options** :

#### Option A : Depuis Google Play Console (Recommandé - Plus simple)

1. Aller sur **Google Play Console** : https://play.google.com/console
2. Sélectionner votre app **At-Taqwa**
3. Menu de gauche → **"Configuration de l'app"** (App settings)
4. Section **"Intégrité de l'app"** (App integrity)
5. **"Empreintes de certificat"** (Certificate fingerprints)
6. **Copier le SHA-256 fingerprint** (pas le SHA1)

**Note :** Si vous utilisez "Signature par Google Play", le SHA256 sera celui de Google Play, pas celui de votre keystore.

#### Option B : Depuis EAS Credentials (Si vous avez accès)

```bash
# Mode interactif (nécessite une interaction)
npx eas-cli credentials --platform android --profile production
```

**Lors de l'exécution :**
1. Choisir le profil `production`
2. Sélectionner "View credentials" ou "Show keystore info"
3. **Copier le SHA256 Fingerprint**

**Note :** Cette commande nécessite une interaction, donc elle ne fonctionne pas en mode non-interactif.

---

### Étape 2 : Créer le fichier `assetlinks.json`

**Format du fichier :**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.attaqwaAly.app",
      "sha256_cert_fingerprints": [
        "VOTRE_SHA256_FINGERPRINT_ICI"
      ]
    }
  }
]
```

**Important :**
- Remplacer `VOTRE_SHA256_FINGERPRINT_ICI` par votre SHA256 réel
- Le SHA256 doit être **sans les deux-points** (`:`) - format continu
- Exemple : `0A157CFC1C1FF56BCC6829936168916AAA3A73DA` (pas `0A:15:7C:FC...`)

---

### Étape 3 : Déployer sur Vercel

**Option A : Si vous avez un projet Vercel pour le site**

1. Créer le dossier `.well-known` dans votre projet Vercel
2. Créer le fichier `assetlinks.json` dans ce dossier
3. Le fichier doit être accessible à :
   ```
   https://attaqwa-confidentialite.vercel.app/.well-known/assetlinks.json
   ```

**Option B : Créer une route API dans Vercel**

Si vous ne pouvez pas créer le dossier `.well-known`, créer une route API :

**Fichier :** `api/.well-known/assetlinks.json.js` (ou `.ts`)

```javascript
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json([
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.attaqwaAly.app",
        "sha256_cert_fingerprints": [
          "VOTRE_SHA256_FINGERPRINT_ICI"
        ]
      }
    }
  ]);
}
```

---

### Étape 4 : Vérifier la configuration

#### Test 1 : Vérifier que le fichier est accessible

```bash
curl https://attaqwa-confidentialite.vercel.app/.well-known/assetlinks.json
```

**Résultat attendu :** Le JSON avec votre configuration

#### Test 2 : Vérifier avec Google Digital Asset Links

**URL de test :**
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://attaqwa-confidentialite.vercel.app&relation=delegate_permission/common.handle_all_urls
```

**Résultat attendu :** Votre app `com.attaqwaAly.app` doit apparaître dans les résultats

---

## ⏱️ Délai de vérification

**Important :** Google peut prendre **quelques heures à quelques jours** pour vérifier le fichier `assetlinks.json`.

Une fois vérifié :
- ✅ Android ouvrira directement l'app (comme iOS)
- ✅ Le site web ne s'affichera plus avant l'app

---

## 🔍 Vérifier si c'est déjà configuré

**Test rapide :**
1. Ouvrir le lien de vérification d'email sur Android
2. Si le site s'affiche avant l'app → `assetlinks.json` n'est pas configuré ou non vérifié
3. Si l'app s'ouvre directement → C'est déjà configuré ! ✅

---

## 📝 Notes importantes

1. **SHA256 vs SHA1** : `assetlinks.json` nécessite le **SHA256**, pas le SHA1
2. **Format du SHA256** : Sans les deux-points (`:`) dans le JSON
3. **Package name** : Doit correspondre exactement à `com.attaqwaAly.app` (dans `app.json`)
4. **HTTPS requis** : Le fichier doit être accessible en HTTPS
5. **Content-Type** : Le serveur doit renvoyer `application/json`

---

## 🚨 Si ça ne fonctionne toujours pas

### Vérifications à faire :

1. **Le fichier est-il accessible ?**
   ```bash
   curl https://attaqwa-confidentialite.vercel.app/.well-known/assetlinks.json
   ```

2. **Le SHA256 est-il correct ?**
   - Vérifier avec Google Play Console
   - S'assurer qu'il correspond au keystore utilisé pour signer l'app

3. **Le package name correspond-il ?**
   - Vérifier dans `app.json` : `com.attaqwaAly.app`
   - Vérifier dans `assetlinks.json` : doit être identique

4. **Attendre la vérification Google**
   - Peut prendre jusqu'à 48 heures
   - Vérifier avec l'outil Google Digital Asset Links

---

## ✅ Résultat attendu

**AVANT :**
- Android : Clique sur lien → Site visible → App s'ouvre

**APRÈS :**
- Android : Clique sur lien → App s'ouvre directement (comme iOS) ✅

---

**Une fois configuré, Android aura le même comportement qu'iOS !** 🎉




