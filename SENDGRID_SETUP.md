# Configuration SendGrid Gratuit - At-Taqwa App

## 🚀 Configuration rapide (5 minutes)

### 1. Créer un compte SendGrid gratuit
1. Va sur [sendgrid.com](https://sendgrid.com)
2. Clique sur "Start for free"
3. Remplis le formulaire (nom, email, mot de passe)
4. Choisis "Free" plan (100 emails/jour)
5. Vérifie ton email

### 2. Créer une API Key
1. Connecte-toi à SendGrid
2. Va dans "Settings" → "API Keys"
3. Clique sur "Create API Key"
4. Nom : "At-Taqwa OTP"
5. Permissions : "Restricted Access" → "Mail Send"
6. Copie l'API Key (commence par "SG.")

### 3. Vérifier un domaine d'envoi
1. Dans SendGrid, va dans "Settings" → "Sender Authentication"
2. Clique sur "Verify a Single Sender"
3. Email : `noreply@attaqwa.app`
4. Nom : `At-Taqwa App`
5. Clique sur "Create"
6. Vérifie l'email reçu

### 4. Configurer Firebase
```bash
# Remplace YOUR_API_KEY par l'API Key SendGrid
firebase functions:config:set sendgrid.api_key="YOUR_API_KEY"
```

### 5. Déployer
```bash
firebase deploy --only functions
```

## ✅ Avantages SendGrid gratuit

- **100 emails/jour** (suffisant pour commencer)
- **Templates HTML** professionnels
- **Statistiques** d'envoi
- **Pas de mot de passe d'application** à gérer
- **Plus fiable** que Gmail
- **100% gratuit** pour commencer

## 🔧 Configuration alternative

Si tu veux utiliser ton email Gmail à la place :
1. Remplace `noreply@attaqwa.app` par ton email
2. Vérifie ton email dans SendGrid
3. Utilise la même API Key

## 📧 Test

Après déploiement, teste l'inscription :
1. Lance l'app
2. Va à "S'inscrire"
3. Remplis le formulaire
4. Tu devrais recevoir un email avec le code OTP

## 💰 Coût

- **SendGrid Free** : 0€ (100 emails/jour)
- **Firebase Functions** : 0€ (125K invocations/mois)
- **Total** : 0€ pour commencer !

---

**Note** : Quand tu auras plus de 100 utilisateurs/jour, tu pourras passer au plan payant SendGrid (très économique). 