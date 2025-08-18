# 🧪 Guide de Test - Intégration Paiements PayDunya

## ✅ **État Actuel de l'Intégration**

### **Backend (Déployé)** ✅
- **URL** : https://attaqwa-paiement-noi4uzmnj-bathilycoumba254-6208s-projects.vercel.app
- **APIs** : `/api/paydunya/checkout`, `/api/paydunya/ipn`, `/api/entitlements`
- **Variables d'environnement** : Configurées avec clés PayDunya production

### **App Mobile (Intégrée)** ✅
- **Service de paiement** : `src/lib/paymentService.ts`
- **Deep links** : `attaqwa://paydunya/*` configurés dans `App.tsx`
- **UI Premium** : Badges et modals dans `BooksScreen.tsx`
- **Configuration** : `src/config/environment.ts`

## 🧪 **Tests à Effectuer**

### **1. Test de Connexion Backend**
```bash
# Tester l'API entitlements
curl -X GET "https://attaqwa-paiement-noi4uzmnj-bathilycoumba254-6208s-projects.vercel.app/api/entitlements" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### **2. Test de Création de Paiement**
```bash
# Tester l'API checkout
curl -X POST "https://attaqwa-paiement-noi4uzmnj-bathilycoumba254-6208s-projects.vercel.app/api/paydunya/checkout" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "BOOK_PART_2"}'
```

### **3. Test des Deep Links**
```bash
# Tester les deep links (Android)
adb shell am start -W -a android.intent.action.VIEW -d "attaqwa://paydunya/success" com.attaqwa.app

# Tester les deep links (iOS Simulator)
xcrun simctl openurl booted "attaqwa://paydunya/success"
```

### **4. Test dans l'App Mobile**

#### **Étapes de test :**
1. **Ouvrir l'app** et se connecter avec `papalybn1@gmail.com`
2. **Aller dans "Livre"** → Partie 2 ou 3
3. **Cliquer sur un chapitre premium** → Modal de paiement
4. **Cliquer "Débloquer maintenant"** → Redirection PayDunya
5. **Simuler un paiement** → Retour via deep link
6. **Vérifier l'accès** → Contenu débloqué

#### **Scénarios de test :**
- ✅ **Paiement réussi** : `attaqwa://paydunya/success`
- ❌ **Paiement annulé** : `attaqwa://paydunya/cancel`
- 💥 **Paiement échoué** : `attaqwa://paydunya/failed`

## 🔧 **Configuration PayDunya**

### **Dashboard PayDunya**
- **IPN Endpoint** : `https://attaqwa-paiement-noi4uzmnj-bathilycoumba254-6208s-projects.vercel.app/api/paydunya/ipn`
- **Return URL** : `attaqwa://paydunya/success`
- **Cancel URL** : `attaqwa://paydunya/cancel`

### **Variables d'environnement Backend**
```bash
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=votre_clé_production
PAYDUNYA_PRIVATE_KEY=votre_clé_privée_production
PAYDUNYA_TOKEN=votre_token_production
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
```

## 📱 **Déploiement App Mobile**

### **Build de test**
```bash
# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview
```

### **Variables d'environnement App**
```bash
EXPO_PUBLIC_BACKEND_URL=https://attaqwa-paiement-noi4uzmnj-bathilycoumba254-6208s-projects.vercel.app
```

## 🐛 **Débogage**

### **Logs à surveiller**
```javascript
// Dans l'app mobile
console.log('🔄 Démarrage du processus de paiement pour:', planId);
console.log('✅ Paiement créé, ouverture PayDunya...');
console.log('🔗 Deep link reçu:', url);
console.log('🎯 Entitlements après paiement:', entitlements);
```

### **Erreurs communes**
1. **Token Firebase expiré** → Reconnecter l'utilisateur
2. **Deep link non reçu** → Vérifier le schéma `attaqwa://`
3. **Backend inaccessible** → Vérifier l'URL et les CORS
4. **PayDunya non configuré** → Vérifier les clés dans le dashboard

## 🎯 **Validation Finale**

### **Checklist de validation**
- [ ] Backend accessible et APIs fonctionnelles
- [ ] App mobile peut créer des paiements
- [ ] Deep links fonctionnent (success/cancel/failed)
- [ ] Entitlements mis à jour après paiement
- [ ] Contenu premium débloqué
- [ ] Logs d'audit en place
- [ ] Configuration PayDunya production

### **Métriques de succès**
- Taux de conversion des paiements
- Temps de traitement des deep links
- Taux d'erreur des APIs
- Satisfaction utilisateur

## 🚀 **Prêt pour la Production**

Une fois tous les tests validés, l'intégration est prête pour la production !

**Prochaines étapes :**
1. Tests avec de vrais paiements PayDunya
2. Monitoring des métriques
3. Optimisation des performances
4. Support client 