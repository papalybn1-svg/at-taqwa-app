# 🔍 Comment obtenir le SHA256 fingerprint pour assetlinks.json

Si vous ne trouvez pas le SHA256 dans Google Play Console, voici plusieurs méthodes alternatives :

---

## Méthode 1 : Via Google Play Console (Différentes sections)

### Option A : Section "Signature d'application"
1. Google Play Console → Votre app → **"Intégrité des applis"**
2. Cherchez **"Signature d'application"** ou **"App signing"**
3. Si vous voyez **"Signature par Google Play"** activée :
   - Cliquez sur **"Paramètres"** ou **"Afficher plus"**
   - Cherchez **"Empreintes de certificat"** ou **"Certificate fingerprints"**
   - Vous devriez voir SHA1 et SHA256

### Option B : Section "Configuration de l'app"
1. Google Play Console → Votre app
2. Menu de gauche → **"Configuration de l'app"** (App settings)
3. **"Intégrité de l'app"** (App integrity)
4. **"Empreintes de certificat"** (Certificate fingerprints)

### Option C : Via l'API Google Play
Si vous avez accès à l'API, vous pouvez récupérer les empreintes programmatiquement.

---

## Méthode 2 : Depuis EAS Credentials (Mode interactif)

**Note :** Cette méthode nécessite une interaction, donc vous devez la faire manuellement.

```bash
cd /home/ibrahima/Documents/projet_oryx_livre/at-taqwa-app
npx eas-cli credentials --platform android --profile production
```

**Lors de l'exécution :**
1. Sélectionner le profil `production`
2. Choisir **"View credentials"** ou **"Show keystore info"**
3. Vous verrez :
   - MD5 Fingerprint
   - SHA1 Fingerprint
   - **SHA256 Fingerprint** ← C'est celui qu'il vous faut !

**Copier le SHA256** (avec les deux-points, on les enlèvera après)

---

## Méthode 3 : Depuis un AAB existant

Si vous avez déjà téléchargé un AAB depuis EAS :

```bash
# Télécharger le dernier build
npx eas-cli build:download --platform android --latest

# Extraire le SHA256 avec keytool (si Java installé)
keytool -printcert -jarfile application-*.aab | grep SHA256
```

---

## Méthode 4 : Utiliser le SHA256 de Google Play Signing

Si **"Signature par Google Play"** est activée dans Google Play Console :

1. Google Play Console → Votre app → **"Intégrité des applis"**
2. Section **"Signature d'application"**
3. Cherchez **"Certificat de signature d'application"** ou **"App signing certificate"**
4. Le SHA256 devrait être visible là

**Important :** Si vous utilisez Google Play Signing, vous devez utiliser le SHA256 de **Google Play**, pas celui de votre keystore local.

---

## Méthode 5 : Vérifier dans Firebase Console

1. Aller sur Firebase Console : https://console.firebase.google.com
2. Sélectionner votre projet
3. **Paramètres du projet** (⚙️) → **Vos applications**
4. Sélectionner l'app Android (`com.attaqwaAly.app`)
5. Cherchez **"Empreintes SHA"** ou **"SHA fingerprints"**

---

## Méthode 6 : Depuis le code source (si vous avez le keystore)

Si vous avez accès au keystore utilisé pour signer l'app :

```bash
keytool -list -v -keystore votre-keystore.jks -alias votre-alias
```

**Cherchez :**
```
Certificate fingerprints:
     SHA1: XX:XX:XX:...
     SHA256: XX:XX:XX:... ← C'est celui qu'il vous faut !
```

---

## ⚠️ Format du SHA256 pour assetlinks.json

**Important :** Le SHA256 dans `assetlinks.json` doit être **sans les deux-points** (`:`).

**Exemple :**
- Format Google Play/EAS : `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA:...`
- Format assetlinks.json : `0A157CFC1C1FF56BCC6829936168916AAA3A73DA...` (sans les `:`)

**Conversion rapide :**
```bash
# Si vous avez le SHA256 avec deux-points
echo "0A:15:7C:FC:..." | tr -d ':'
# Résultat : 0A157CFC...
```

---

## 🎯 Recommandation

**Pour votre cas, je recommande :**

1. **Essayer d'abord** : Google Play Console → Intégrité des applis → Signature d'application → Paramètres
2. **Si ça ne marche pas** : Utiliser EAS credentials en mode interactif (Méthode 2)
3. **Alternative** : Vérifier dans Firebase Console (Méthode 5)

---

## 📝 Une fois que vous avez le SHA256

1. Ouvrir `.well-known/assetlinks.json`
2. Remplacer `REMPLACER_PAR_VOTRE_SHA256_FINGERPRINT` par votre SHA256
3. **Enlever tous les deux-points** (`:`) du SHA256
4. Déployer sur Vercel
5. Vérifier : `curl https://attaqwa-confidentialite.vercel.app/.well-known/assetlinks.json`

---

**Besoin d'aide pour une méthode spécifique ? Dites-moi laquelle vous préférez essayer !** 🚀


