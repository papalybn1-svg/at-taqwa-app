# 🔐 Configuration Email de Réinitialisation - At-Taqwa App

## 🚀 Configuration rapide (10 minutes)

### **1. Créer un compte SendGrid gratuit**
1. Aller sur [sendgrid.com](https://sendgrid.com)
2. Cliquer sur "Start for free"
3. Remplir le formulaire (nom, email, mot de passe)
4. Choisir "Free" plan (100 emails/jour)
5. Vérifier votre email

### **2. Créer une API Key SendGrid**
1. Se connecter à SendGrid
2. Aller dans "Settings" → "API Keys"
3. Cliquer sur "Create API Key"
4. Nom : "At-Taqwa Password Reset"
5. Permissions : "Restricted Access" → "Mail Send"
6. Copier l'API Key (commence par "SG.")

### **3. Vérifier un domaine d'envoi**
1. Dans SendGrid, aller dans "Settings" → "Sender Authentication"
2. Cliquer sur "Verify a Single Sender"
3. Email : `noreply@attaqwa.app` (ou votre email)
4. Nom : `At-Taqwa App`
5. Cliquer sur "Create"
6. Vérifier l'email reçu

### **4. Configurer Firebase Functions**
```bash
# Installer les dépendances
cd functions
npm install

# Configurer l'API Key SendGrid
firebase functions:config:set sendgrid.api_key="VOTRE_API_KEY_SENDGRID"

# Vérifier la configuration
firebase functions:config:get
```

### **5. Déployer les Firebase Functions**
```bash
# Compiler et déployer
npm run build
firebase deploy --only functions
```

## ✅ **Avantages de cette solution**

- **✅ Email personnalisé** : Design At-Taqwa avec couleurs de la marque
- **✅ Lien sécurisé** : Lien de réinitialisation Firebase Auth
- **✅ Gestion d'erreurs** : Messages d'erreur clairs
- **✅ Gratuit** : 100 emails/jour avec SendGrid Free
- **✅ Fiable** : Plus fiable que Gmail
- **✅ Templates HTML** : Email professionnel

## 🔧 **Configuration alternative**

Si vous voulez utiliser votre email Gmail à la place :
1. Remplacer `noreply@attaqwa.app` par votre email
2. Vérifier votre email dans SendGrid
3. Utiliser la même API Key

## 📧 **Test de la fonctionnalité**

Après déploiement, tester la réinitialisation :
1. Lancer l'app
2. Aller dans "Paramètres"
3. Cliquer sur "Changer le mot de passe"
4. Cliquer sur "Envoyer l'email"
5. Vérifier votre boîte email

## 💰 **Coût**

- **SendGrid Free** : 0€ (100 emails/jour)
- **Firebase Functions** : 0€ (125K invocations/mois)
- **Total** : 0€ pour commencer !

## 🛠️ **Dépannage**

### **Erreur "Service indisponible"**
```bash
# Vérifier que les fonctions sont déployées
firebase functions:list

# Vérifier les logs
firebase functions:log
```

### **Erreur "API Key invalide"**
```bash
# Reconfigurer l'API Key
firebase functions:config:set sendgrid.api_key="NOUVELLE_API_KEY"
firebase deploy --only functions
```

### **Email non reçu**
1. Vérifier le dossier spam
2. Vérifier que l'email est vérifié dans SendGrid
3. Vérifier les logs SendGrid

## 📱 **Interface utilisateur**

L'application affiche maintenant :
- ✅ **Modal de confirmation** avec l'email
- ✅ **Bouton d'envoi** avec état de chargement
- ✅ **Toast de succès** vert avec icônes
- ✅ **Messages d'erreur** explicites
- ✅ **Gestion des cas d'erreur** complets

## 🔒 **Sécurité**

- **Lien sécurisé** : Utilise Firebase Auth pour la réinitialisation
- **Expiration** : Lien valide 1 heure
- **Validation** : Vérification que l'utilisateur existe
- **Rate limiting** : Protection contre le spam

---

**Note** : Quand vous aurez plus de 100 utilisateurs/jour, vous pourrez passer au plan payant SendGrid (très économique). 