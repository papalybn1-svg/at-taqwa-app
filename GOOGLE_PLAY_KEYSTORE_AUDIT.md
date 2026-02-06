# 🔍 AUDIT : Erreur Keystore Google Play Console - Analyse Complète

**Date :** 22 décembre 2024  
**Problème :** AAB signé avec la mauvaise clé dans Google Play Console

---

## ❌ Erreur Actuelle

```
Votre Android App Bundle a été signé avec la mauvaise clé.
L'app bundle devrait être signé avec le certificat associé à l'empreinte :
SHA1: 2C:D1:18:87:F2:82:98:AD:27:F8:6E:79:01:C7:BA:C0:78:A4:3A:9B
OU
SHA1: 0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA
```

**Fichier uploadé :** `application-9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd.aab`

---

## 🔍 Analyse de la Situation

### 1. Fingerprints Attendus par Google Play

Google Play accepte **DEUX** fingerprints possibles :
- **Fingerprint 1 :** `2C:D1:18:87:F2:82:98:AD:27:F8:6E:79:01:C7:BA:C0:78:A4:3A:9B`
- **Fingerprint 2 :** `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

**Cela signifie :**
- Google Play a déjà enregistré ces deux keystores comme valides
- L'un d'eux a probablement été utilisé pour une publication précédente
- L'AAB uploadé a été signé avec un **troisième keystore** (non reconnu)

### 2. Keystore Actuel dans EAS

D'après l'historique :
- ✅ Un nouveau keystore a été créé avec le fingerprint : `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`
- ✅ Ce fingerprint correspond au **Fingerprint 2** attendu par Google Play

**Problème potentiel :**
- L'AAB uploadé a peut-être été généré **AVANT** la création du nouveau keystore
- Ou l'AAB a été généré avec un autre profil (preview, development)
- Ou il y a un problème de synchronisation entre EAS et Google Play

### 3. Vérifications Nécessaires

#### A. Vérifier le Keystore Configuré dans EAS

```bash
npx eas-cli@latest credentials --platform android --profile production
```

**À vérifier :**
- ✅ Le SHA1 fingerprint correspond-il à l'un des deux attendus ?
- ✅ Le keystore est-il bien configuré pour le profil "production" ?
- ✅ Y a-t-il plusieurs keystores configurés ?

#### B. Vérifier le Fingerprint de l'AAB Uploadé

**Méthode 1 : Via Google Play Console**
- Google Play devrait afficher le fingerprint de l'AAB uploadé
- Comparer avec les fingerprints attendus

**Méthode 2 : Via la ligne de commande**
```bash
# Télécharger l'AAB depuis Google Play Console ou EAS
# Puis vérifier le fingerprint
keytool -printcert -jarfile application-9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd.aab
```

#### C. Vérifier l'Historique des Builds

```bash
npx eas-cli@latest build:list --platform android --limit 5
```

**À vérifier :**
- ✅ Quand le dernier build a-t-il été fait ?
- ✅ Avant ou après la création du nouveau keystore ?
- ✅ Quel profil a été utilisé (production, preview, development) ?

---

## 🎯 Causes Possibles

### Cause 1 : AAB Généré Avant la Création du Nouveau Keystore

**Scénario :**
1. AAB généré avec un ancien keystore (fingerprint inconnu)
2. Nouveau keystore créé après
3. AAB uploadé avec l'ancien keystore

**Solution :**
- Faire un **nouveau build** avec le nouveau keystore
- Uploader le nouveau AAB

### Cause 2 : Mauvais Profil Utilisé

**Scénario :**
1. Keystore créé pour le profil "production"
2. Build fait avec le profil "preview" ou "development"
3. AAB signé avec un autre keystore

**Solution :**
- Vérifier que le build utilise le profil "production"
- Vérifier que le keystore est configuré pour "production"

### Cause 3 : Keystore Non Synchronisé

**Scénario :**
1. Keystore créé dans EAS
2. Google Play n'a pas encore enregistré ce keystore
3. Premier upload nécessite une configuration spéciale

**Solution :**
- Vérifier dans Google Play Console si le keystore est enregistré
- Peut-être besoin d'uploader le keystore manuellement dans Google Play

### Cause 4 : Ancien Keystore Utilisé

**Scénario :**
1. Un ancien keystore (Fingerprint 1) a été utilisé précédemment
2. Nouveau keystore (Fingerprint 2) créé
3. Mais l'AAB a été signé avec un troisième keystore (inconnu)

**Solution :**
- Identifier quel keystore a été utilisé pour l'AAB
- Utiliser le bon keystore (Fingerprint 1 ou 2)

---

## ✅ Plan d'Action Recommandé

### Étape 1 : Vérifier le Keystore Actuel

```bash
npx eas-cli@latest credentials --platform android --profile production
```

**Résultat attendu :**
- SHA1 Fingerprint : `0A:15:7C:FC:1C:1F:F5:6B:CC:68:29:93:61:68:91:6A:AA:3A:73:DA`

### Étape 2 : Vérifier l'Historique des Builds

```bash
npx eas-cli@latest build:list --platform android --limit 5
```

**À noter :**
- Date du dernier build
- Profil utilisé
- Statut du build

### Étape 3 : Faire un Nouveau Build

```bash
npx eas-cli@latest build --platform android --profile production --non-interactive
```

**Important :**
- Utiliser le profil "production"
- Attendre la fin du build
- Noter l'ID du build

### Étape 4 : Télécharger le Nouveau AAB

```bash
npx eas-cli@latest build:download --platform android --latest
```

**Ou :**
```bash
npx eas-cli@latest build:download --platform android --id [BUILD_ID]
```

### Étape 5 : Vérifier le Fingerprint du Nouveau AAB

**Option 1 : Via Google Play Console**
- Uploader le nouveau AAB
- Google Play affichera le fingerprint
- Comparer avec les fingerprints attendus

**Option 2 : Via la ligne de commande**
```bash
# Si tu as bundletool installé
bundletool dump manifest --bundle=application-*.aab

# Ou utiliser keytool
keytool -printcert -jarfile application-*.aab
```

### Étape 6 : Uploader dans Google Play Console

1. Supprimer l'ancien AAB (le X à côté du fichier)
2. Uploader le nouveau AAB
3. Vérifier que l'erreur disparaît

---

## 🔍 Questions à Résoudre

### Question 1 : Quel keystore est actuellement configuré dans EAS ?

**Action :**
```bash
npx eas-cli@latest credentials --platform android --profile production
```

**Résultat attendu :**
- Afficher le SHA1 fingerprint
- Confirmer qu'il correspond à l'un des deux attendus

### Question 2 : Quand le dernier build a-t-il été fait ?

**Action :**
```bash
npx eas-cli@latest build:list --platform android --limit 5
```

**Résultat attendu :**
- Date et heure du dernier build
- Profil utilisé
- Statut (finished, in-progress, etc.)

### Question 3 : L'AAB uploadé correspond-il au dernier build ?

**Action :**
- Comparer la date de l'AAB uploadé avec la date du dernier build
- Vérifier si l'AAB a été généré avant ou après la création du nouveau keystore

### Question 4 : Y a-t-il plusieurs keystores configurés ?

**Action :**
```bash
npx eas-cli@latest credentials --platform android
```

**Résultat attendu :**
- Lister tous les profils (production, preview, development)
- Vérifier les keystores pour chaque profil

---

## ⚠️ Points Critiques

### 1. Synchronisation Keystore

**Problème :**
- Le keystore dans EAS peut ne pas correspondre au keystore attendu par Google Play
- Google Play peut avoir enregistré un keystore différent

**Solution :**
- Vérifier dans Google Play Console → "Intégrité des applis" → "Certificats d'application"
- Comparer avec le keystore dans EAS

### 2. Premier Upload vs Mise à Jour

**Problème :**
- Si c'est le premier upload, Google Play enregistre automatiquement le keystore
- Si c'est une mise à jour, le keystore doit correspondre à celui enregistré

**Solution :**
- Vérifier si c'est la première publication ou une mise à jour
- Si première publication, le nouveau keystore devrait fonctionner
- Si mise à jour, utiliser le même keystore que la première publication

### 3. Profil de Build

**Problème :**
- Le profil "production" peut avoir un keystore différent de "preview"
- L'AAB peut avoir été généré avec le mauvais profil

**Solution :**
- Toujours utiliser le profil "production" pour Google Play
- Vérifier que le keystore est configuré pour "production"

---

## 📋 Checklist de Diagnostic

- [ ] Vérifier le keystore configuré dans EAS (production)
- [ ] Vérifier l'historique des builds (date, profil, statut)
- [ ] Comparer le fingerprint du keystore EAS avec ceux attendus par Google Play
- [ ] Vérifier si c'est la première publication ou une mise à jour
- [ ] Vérifier les certificats enregistrés dans Google Play Console
- [ ] Faire un nouveau build avec le profil "production"
- [ ] Vérifier le fingerprint du nouveau AAB
- [ ] Uploader le nouveau AAB dans Google Play Console

---

## 🎯 Conclusion

**Le problème principal :**
L'AAB uploadé a été signé avec un keystore qui ne correspond à aucun des deux fingerprints attendus par Google Play.

**Solution immédiate :**
1. Vérifier le keystore actuel dans EAS
2. Faire un nouveau build avec le profil "production"
3. Uploader le nouveau AAB

**Si le problème persiste :**
- Vérifier les certificats dans Google Play Console
- Comparer avec le keystore dans EAS
- Peut-être besoin d'uploader le keystore manuellement dans Google Play

---

**En attente de tes instructions pour procéder aux vérifications.** 🔍

---

## 🔍 ANALYSE DES BUILDS (Terminal)

### Builds Identifiés

**Build le plus récent (celui uploadé) :**
- **ID :** `9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd`
- **Date :** 16/12/2025 18:28:04 → 19:49:48
- **Profil :** production
- **Status :** finished
- **Fichier :** `application-9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd.aab` ✅ **C'est celui uploadé !**

**Autres builds production :**
- `f44da4d0-5cb2-4689-8a8a-68e1c1307953` (16/12/2025 16:04)
- `f11770da-c3f3-4419-bc8e-ba1f12f05fa5` (14/12/2025 02:30)

### ⚠️ Problème Identifié

**Le build `9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd` a été fait le 16/12/2025 à 18:28.**

**Question :** Le nouveau keystore a-t-il été créé **AVANT** ou **APRÈS** ce build ?

**Si le keystore a été créé APRÈS le build :**
- ✅ Le build a été signé avec un ancien keystore
- ✅ Il faut faire un **nouveau build** avec le nouveau keystore

**Si le keystore a été créé AVANT le build :**
- ⚠️ Il y a un problème de configuration
- ⚠️ Le build n'a pas utilisé le bon keystore

### ✅ Solution Immédiate

**Faire un nouveau build avec le nouveau keystore :**

```bash
npx eas-cli@latest build --platform android --profile production --non-interactive
```

**Puis :**
1. Télécharger le nouveau AAB
2. Vérifier son fingerprint
3. Uploader dans Google Play Console
4. L'erreur devrait disparaître

---

## 📋 Conclusion

**Le build uploadé (`9797ef7a-8d0f-4e1f-b7ad-2934b4fbeddd`) a probablement été signé avec un ancien keystore.**

**Solution :** Faire un nouveau build maintenant que le nouveau keystore est configuré.

