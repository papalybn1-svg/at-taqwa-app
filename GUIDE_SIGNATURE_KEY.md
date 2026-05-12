# 🔑 Guide Pratique : Résoudre l'Erreur de Signature de Clé

**Problème :** L'AAB a été signé avec une clé qui ne correspond pas aux SHA1 enregistrés dans Google Play Console

---

## 🎯 Solution Rapide (3 Étapes)

### Étape 1 : Récupérer le SHA1 de Votre Clé EAS

**Option A : Depuis l'AAB que vous avez uploadé**

Si vous avez l'AAB qui a causé l'erreur, vous pouvez extraire son SHA1 :

```bash
# Si vous avez l'AAB localement
unzip -p votre-app.aab META-INF/*.RSA | keytool -printcert | grep SHA1
```

**Option B : Depuis EAS (si vous avez accès)**

1. Allez sur [expo.dev](https://expo.dev)
2. Connectez-vous avec votre compte
3. Sélectionnez le projet "at-taqwa-app"
4. Allez dans "Credentials" > "Android"
5. Vous verrez les informations de la clé, y compris le SHA1

**Option C : Vérifier le SHA1 attendu**

D'après l'erreur Google Play Console, les SHA1 attendus sont :
- `2C:D1:18:87:F2:82:98:AD:27:F8:6E:79:01:C7:BA:C0:78:A4:3A:9B`
- `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

---

### Étape 2 : Ajouter le SHA1 dans Google Play Console

1. **Connectez-vous à Google Play Console**
   - [play.google.com/console](https://play.google.com/console)
   - Sélectionnez votre app "At-Taqwa"

2. **Naviguez vers la Configuration**
   - Menu de gauche : **"Configuration de l'app"** (App settings)
   - Ou directement : **"Intégrité de l'app"** (App integrity)

3. **Ajoutez l'Empreinte SHA1**
   - Section **"Empreintes de certificat"** (Certificate fingerprints)
   - Cliquez sur **"Ajouter une empreinte"** (Add fingerprint)
   - Collez le SHA1 de votre clé (format : `XX:XX:XX:XX:...`)
   - Cliquez sur **"Enregistrer"** (Save)

**Format du SHA1 :** `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`

---

### Étape 3 : Reconstruire et Uploader l'AAB

Une fois le SHA1 ajouté dans Google Play Console :

```bash
# Reconstruire l'AAB avec EAS
npx eas-cli build --platform android --profile production

# Attendre la fin du build
# Télécharger l'AAB depuis expo.dev
# Uploader dans Google Play Console
```

---

## 🔍 Vérification : Quel SHA1 Utiliser ?

### Si vous avez déjà uploadé un AAB avec succès avant :

1. **Utilisez le même SHA1** que celui de l'AAB précédent
2. **Ou vérifiez** dans Google Play Console quels SHA1 sont déjà enregistrés

### Si c'est votre premier upload :

1. **Générer une nouvelle clé** (si pas déjà fait) :
   ```bash
   npx eas-cli credentials --platform android
   # Choisir "Set up a new Android Keystore"
   ```

2. **Récupérer le SHA1** de cette nouvelle clé (voir Étape 1)

3. **Ajouter le SHA1** dans Google Play Console (voir Étape 2)

---

## 📝 Commandes Utiles

### Vérifier le SHA1 d'un AAB

```bash
# Extraire le certificat et afficher le SHA1
unzip -p votre-app.aab META-INF/*.RSA | keytool -printcert | grep SHA1
```

### Vérifier le SHA1 d'un Keystore Local

```bash
keytool -list -v -keystore /chemin/vers/keystore.jks -alias votre-alias
# Cherchez "SHA1:" dans la sortie
```

### Build avec EAS

```bash
npx eas-cli build --platform android --profile production
```

---

## ⚠️ Important

- **Ne perdez jamais votre keystore !** Sans lui, vous ne pourrez plus mettre à jour votre app.
- **EAS sauvegarde automatiquement** votre keystore, mais gardez une copie de sécurité.
- **Un SHA1 = Une clé unique** : Chaque keystore a son propre SHA1.

---

## 🆘 Si le SHA1 Ne Correspond Toujours Pas

### Option 1 : Vérifier que vous utilisez la bonne clé

```bash
# Vérifier les credentials EAS
npx eas-cli credentials --platform android
# Vérifier que la clé utilisée correspond au SHA1 ajouté
```

### Option 2 : Utiliser un SHA1 déjà enregistré

Si vous avez déjà un SHA1 enregistré dans Google Play Console qui fonctionnait avant :
- **Utilisez la même clé** pour signer le nouvel AAB
- **Ou vérifiez** dans l'historique des builds EAS quelle clé a été utilisée

### Option 3 : Contacter le Support

Si rien ne fonctionne :
1. **Contactez le support Google Play** pour réinitialiser les empreintes
2. **Ou vérifiez** si vous avez plusieurs apps dans Google Play Console avec des SHA1 différents

---

## ✅ Checklist

- [ ] Récupérer le SHA1 de la clé actuelle
- [ ] Comparer avec les SHA1 attendus dans Google Play Console
- [ ] Ajouter le SHA1 dans Google Play Console (si différent)
- [ ] Vérifier que le SHA1 est bien enregistré
- [ ] Reconstruire l'AAB avec EAS
- [ ] Uploader le nouvel AAB dans Google Play Console
- [ ] Vérifier que l'erreur est résolue

---

## 💡 Astuce

**Pour éviter ce problème à l'avenir :**
- Utilisez toujours la même clé pour signer vos AAB
- Gardez une trace du SHA1 de votre clé de production
- Vérifiez les SHA1 dans Google Play Console avant chaque upload
