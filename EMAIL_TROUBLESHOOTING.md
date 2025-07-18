# 🔍 Guide de Dépannage Email de Réinitialisation - At-Taqwa App

## 🚨 **Problème : Email non reçu**

Vous ne recevez pas l'email de réinitialisation malgré que l'application indique qu'il a été envoyé avec succès.

## 🔍 **Diagnostic étape par étape**

### **Étape 1 : Vérifier les logs de l'application**

Dans la console de l'application, vous devriez voir :
```
📧 Envoi email réinitialisation à: votre-email@gmail.com
✅ Email de réinitialisation envoyé avec succès (SendGrid)
📋 Résultat: { success: true, message: 'Email de réinitialisation envoyé avec succès' }
```

**OU**

```
📧 Envoi email réinitialisation à: votre-email@gmail.com
⚠️ Firebase Function échouée, utilisation du fallback Firebase Auth
✅ Email de réinitialisation envoyé avec succès (Firebase Auth)
```

### **Étape 2 : Vérifier votre boîte email**

1. **Boîte principale** : Vérifiez votre boîte de réception principale
2. **Dossier spam** : Vérifiez le dossier spam/indésirable
3. **Dossier promotions** : Si vous utilisez Gmail, vérifiez le dossier "Promotions"
4. **Filtres** : Vérifiez vos filtres email

### **Étape 3 : Vérifier la configuration Firebase**

#### **Option A : Firebase Auth par défaut**
Si vous voyez "Firebase Auth" dans les logs :
- Firebase Auth a des restrictions sur les domaines d'envoi
- L'email peut être bloqué par les fournisseurs email
- Solution : Configurer SendGrid (voir guide SENDGRID_SETUP.md)

#### **Option B : Firebase Function (SendGrid)**
Si vous voyez "SendGrid" dans les logs :
- Vérifiez que SendGrid est configuré
- Vérifiez que l'API Key est correcte
- Vérifiez que l'email d'envoi est vérifié

## 🛠️ **Solutions**

### **Solution 1 : Configuration SendGrid (Recommandée)**

Suivez le guide `SENDGRID_SETUP.md` pour :
1. Créer un compte SendGrid gratuit
2. Configurer l'API Key
3. Vérifier un domaine d'envoi
4. Déployer les Firebase Functions

### **Solution 2 : Vérification Firebase Console**

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans "Authentication" → "Templates"
4. Vérifier que les templates d'email sont configurés
5. Vérifier l'adresse d'envoi autorisée

### **Solution 3 : Test avec un autre email**

1. Créer un compte temporaire avec un autre email
2. Tester la réinitialisation avec ce nouveau compte
3. Vérifier si l'email arrive

### **Solution 4 : Vérification des logs Firebase**

```bash
# Vérifier les logs des fonctions
firebase functions:log

# Vérifier les fonctions déployées
firebase functions:list
```

## 📊 **Logs à surveiller**

### **Logs de succès**
```
📧 Envoi email réinitialisation à: imamelhadji.msk@gmail.com
✅ Email de réinitialisation envoyé avec succès
```

### **Logs d'erreur**
```
❌ Erreur reset password: [FirebaseError: auth/user-not-found]
❌ Erreur reset password: [FirebaseError: auth/too-many-requests]
❌ Erreur reset password: [FirebaseError: functions/unavailable]
```

## 🔧 **Actions immédiates**

### **Action 1 : Vérifier le spam**
- Ouvrir votre boîte email
- Vérifier le dossier spam/indésirable
- Chercher "At-Taqwa" ou "Réinitialisation"

### **Action 2 : Tester avec un autre email**
- Utiliser un email Gmail différent
- Tester la fonctionnalité
- Vérifier si l'email arrive

### **Action 3 : Configurer SendGrid**
- Suivre le guide SENDGRID_SETUP.md
- Configurer un compte SendGrid gratuit
- Déployer les fonctions

## 📧 **Templates d'email**

### **Template SendGrid (Recommandé)**
- Design professionnel avec couleurs At-Taqwa
- Lien de réinitialisation sécurisé
- Expiration de 1 heure
- Responsive design

### **Template Firebase Auth (Fallback)**
- Template par défaut Firebase
- Moins personnalisé
- Peut être bloqué par les fournisseurs

## 🎯 **Prochaines étapes**

1. **Vérifier le spam** immédiatement
2. **Configurer SendGrid** selon le guide
3. **Tester avec un autre email** si nécessaire
4. **Vérifier les logs Firebase** pour diagnostiquer
5. **Signaler le problème** si aucune solution ne fonctionne

## 📞 **Support**

Si aucune solution ne fonctionne :
1. Vérifiez les logs complets
2. Testez avec un autre email
3. Configurez SendGrid
4. Contactez le support avec les logs d'erreur

---

**Note** : La plupart des problèmes d'envoi d'email sont résolus en configurant SendGrid, qui est plus fiable que Firebase Auth par défaut. 