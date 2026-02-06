# 📍 Où Ajouter le SHA1 dans Google Play Console

**SHA1 à ajouter :** `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

---

## 🎯 Emplacement Exact

### Option 1 : Configuration de l'App (Recommandé)

1. **Menu de gauche** → **"Configuration de l'app"** (App settings)
2. Section **"Intégrité de l'app"** (App integrity) 
3. **"Empreintes de certificat"** (Certificate fingerprints)
4. Cliquez sur **"Ajouter une empreinte"** (Add fingerprint)
5. Collez le SHA1 : `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

### Option 2 : Paramètres de l'App

1. **Menu de gauche** → **"Paramètres"** (Settings)
2. **"Intégrité de l'app"** (App integrity)
3. **"Empreintes de certificat"** (Certificate fingerprints)

### Option 3 : Via l'URL Directe

Si vous êtes dans Google Play Console, l'URL devrait ressembler à :
```
https://play.google.com/console/u/0/developers/[ID]/app/[APP_ID]/app-integrity
```

---

## 🔍 Si Vous Ne Trouvez Pas "Empreintes de Certificat"

### Vérification Alternative

Parfois, les empreintes SHA1 sont gérées automatiquement par Google Play si vous utilisez "Signature par Google Play". 

**Vérifiez :**
1. Dans "Intégrité des applis" → "Signature d'application Play"
2. Si c'est activé, Google Play gère automatiquement les clés
3. Dans ce cas, vous n'avez peut-être pas besoin d'ajouter manuellement le SHA1

---

## ✅ Solution : Utiliser la Signature par Google Play

Si vous voyez "Signature par Google Play" activée :

1. **C'est normal** - Google Play gère les clés automatiquement
2. **L'erreur peut venir d'autre chose** :
   - L'AAB a été signé avec une clé différente avant l'activation
   - Il faut reconstruire l'AAB après l'activation de la signature par Google Play

### Action à Faire

1. **Vérifier** que "Signature par Google Play" est activée
2. **Reconstruire l'AAB** avec EAS :
   ```bash
   npx eas-cli build --platform android --profile production
   ```
3. **Uploader le nouvel AAB** - Google Play le re-signera automatiquement

---

## 🎯 Si "Signature par Google Play" N'est PAS Activée

Alors vous devez ajouter le SHA1 manuellement :

1. **Aller dans** : Configuration de l'app → Intégrité de l'app
2. **Chercher** : "Empreintes de certificat" ou "Certificate fingerprints"
3. **Ajouter** : `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

---

## 💡 Astuce

Si vous ne trouvez toujours pas la section "Empreintes de certificat", c'est peut-être parce que :
- Votre app utilise déjà "Signature par Google Play" (gestion automatique)
- Vous devez d'abord désactiver "Signature par Google Play" pour gérer manuellement
- Ou l'interface a changé dans Google Play Console

**Dans ce cas :** Reconstruisez simplement l'AAB et uploadez-le. Google Play devrait l'accepter si la signature par Google Play est activée.





