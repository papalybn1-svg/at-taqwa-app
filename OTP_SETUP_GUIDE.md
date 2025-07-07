labas # Guide de Configuration OTP - At-Taqwa App

## Vue d'ensemble

Ce guide explique comment configurer et utiliser le système de vérification OTP (One-Time Password) par email pour l'inscription des utilisateurs dans At-Taqwa App.

## Fonctionnalités

- ✅ Génération automatique de codes OTP à 6 chiffres
- ✅ Envoi d'emails HTML personnalisés avec le code
- ✅ Vérification sécurisée via Firebase Functions
- ✅ Expiration automatique des codes (10 minutes)
- ✅ Nettoyage automatique des codes expirés
- ✅ Protection contre la réutilisation des codes
- ✅ Mode développement avec simulation

## Configuration

### 1. Configuration Firebase Functions

#### Étape 1: Installer les dépendances
```bash
cd functions
npm install
```

#### Étape 2: Configurer les variables d'environnement
```bash
# Configurer l'email Gmail pour l'envoi
firebase functions:config:set email.user="votre-email@gmail.com"
firebase functions:config:set email.password="votre-mot-de-passe-app"

# Vérifier la configuration
firebase functions:config:get
```

#### Étape 3: Déployer les fonctions
```bash
# Compiler et déployer
npm run build
firebase deploy --only functions
```

### 2. Configuration Gmail

#### Étape 1: Activer l'authentification à 2 facteurs
1. Allez dans les paramètres de votre compte Google
2. Activez l'authentification à 2 facteurs

#### Étape 2: Générer un mot de passe d'application
1. Dans les paramètres de sécurité Google
2. Cliquez sur "Mots de passe d'application"
3. Générez un nouveau mot de passe pour "Mail"
4. Utilisez ce mot de passe dans la configuration Firebase

### 3. Configuration de l'application

#### Étape 1: Installer les dépendances
```bash
npm install firebase/functions
```

#### Étape 2: Vérifier la configuration Firebase
Assurez-vous que `firebaseConfig.ts` exporte l'application Firebase :
```typescript
export const app = initializeApp(firebaseConfig);
```

## Utilisation

### Flux d'inscription avec OTP

1. **Saisie des informations** : L'utilisateur remplit le formulaire d'inscription
2. **Génération OTP** : Un code à 6 chiffres est généré automatiquement
3. **Envoi email** : Le code est envoyé par email avec un template HTML personnalisé
4. **Vérification** : L'utilisateur saisit le code reçu
5. **Création du compte** : Le compte est créé seulement après vérification réussie

### Interface utilisateur

#### Écran d'inscription
- Formulaire classique avec prénom, nom, email, mot de passe
- Bouton "S'inscrire" qui déclenche l'envoi du code OTP

#### Écran de vérification OTP
- Affichage de l'email de destination
- Champ de saisie pour le code à 6 chiffres
- Bouton "Vérifier le code"
- Lien "Renvoyer le code"
- Lien "Retour à l'inscription"

### Fonctions Firebase

#### `sendOTPEmail`
- **Paramètres** : `{ email, otp, displayName? }`
- **Action** : Envoie un email avec le code OTP
- **Stockage** : Sauvegarde le code dans Firestore avec expiration

#### `verifyOTP`
- **Paramètres** : `{ email, otp }`
- **Action** : Vérifie le code OTP
- **Sécurité** : Vérifie l'expiration et l'utilisation

#### `cleanupExpiredOTP`
- **Déclencheur** : Toutes les heures
- **Action** : Supprime les codes OTP expirés

## Sécurité

### Mesures de sécurité implémentées

1. **Expiration automatique** : Les codes expirent après 10 minutes
2. **Usage unique** : Chaque code ne peut être utilisé qu'une fois
3. **Nettoyage automatique** : Suppression des codes expirés
4. **Validation côté serveur** : Vérification via Firebase Functions
5. **Protection contre les attaques** : Limitation des tentatives

### Bonnes pratiques

- ✅ Utilisez un email dédié pour l'envoi
- ✅ Activez l'authentification à 2 facteurs sur Gmail
- ✅ Utilisez un mot de passe d'application
- ✅ Surveillez les logs Firebase Functions
- ✅ Testez en mode développement avant déploiement

## Développement

### Mode développement

En mode développement, si les Firebase Functions ne sont pas disponibles :
- Les emails sont simulés (affichés dans la console)
- La vérification utilise AsyncStorage local
- Aucun email réel n'est envoyé

### Tests

#### Test d'envoi d'email
```javascript
// Dans la console de développement
const testOTP = generateOTP();
await sendOTPEmail('test@example.com', testOTP, 'Test User');
```

#### Test de vérification
```javascript
// Simuler la vérification
const isValid = await verifyOTP('test@example.com', '123456');
console.log('Code valide:', isValid);
```

## Dépannage

### Problèmes courants

#### 1. Erreur d'authentification Gmail
```
❌ Erreur envoi OTP: Invalid login
```
**Solution** : Vérifiez le mot de passe d'application Gmail

#### 2. Fonctions non déployées
```
❌ Erreur envoi OTP: Function not found
```
**Solution** : Déployez les Firebase Functions

#### 3. Configuration manquante
```
❌ Erreur envoi OTP: Email configuration missing
```
**Solution** : Configurez les variables d'environnement Firebase

### Logs utiles

#### Firebase Functions
```bash
firebase functions:log
```

#### Application
```javascript
// Activer les logs détaillés
console.log('📧 Envoi du code OTP par email...');
console.log('✅ Email OTP envoyé avec succès');
console.log('❌ Erreur envoi OTP:', error);
```

## Personnalisation

### Template d'email

Le template HTML est personnalisable dans `functions/src/index.ts` :
- Couleurs de la marque
- Logo et branding
- Texte et messages
- Style CSS inline

### Durée d'expiration

Modifiez la durée d'expiration dans `functions/src/index.ts` :
```typescript
expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
```

### Fréquence de nettoyage

Modifiez la fréquence de nettoyage :
```typescript
export const cleanupExpiredOTP = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
```

## Support

Pour toute question ou problème :
1. Vérifiez les logs Firebase Functions
2. Testez en mode développement
3. Consultez la documentation Firebase
4. Contactez l'équipe de développement

---

**Note** : Ce système OTP améliore significativement la sécurité en empêchant la création de faux comptes et en garantissant que les utilisateurs ont accès à l'email fourni. 