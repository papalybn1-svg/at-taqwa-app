# 📱 Guide d'Intégration PayDunya - App Mobile

## 🎯 **Vue d'ensemble**

L'application mobile At-Taqwa est maintenant configurée pour intégrer PayDunya avec le backend. Voici comment tout fonctionne ensemble.

## 🔗 **Architecture Complète**

```
App Mobile (React Native/Expo)
    ↓ Appelle les APIs
Backend (Next.js API)
    ↓ Communique avec
PayDunya (Paiements)
    ↓ Redirige vers
Deep Links (attaqwa://)
    ↓ Ouvre
App Mobile (Retour)
```

## 📱 **Configuration Deep Links**

### **1. Schéma configuré**
```json
// app.json
{
  "expo": {
    "scheme": "attaqwa"  // ✅ Configuré
  }
}
```

### **2. URLs de redirection PayDunya**
```bash
# Dans le backend (.env.local)
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
```

### **3. Deep Links gérés dans l'app**
```typescript
// App.tsx - Gestion des deep links
attaqwa://paydunya/success  // Paiement réussi
attaqwa://paydunya/cancel   // Paiement annulé
attaqwa://paydunya/failed   // Paiement échoué
```

## 🔄 **Flux de Paiement Complet**

### **1. Vérification des accès**
```typescript
// Dans l'app mobile
const { checkEntitlements } = usePaymentService(userId);
const entitlements = await checkEntitlements();

if (!entitlements.part2 || !entitlements.part3) {
  // Afficher le bouton de paiement
  showPaymentButton();
}
```

### **2. Création du paiement**
```typescript
// Dans l'app mobile
const { createPayment, openPayDunyaCheckout } = usePaymentService(userId);

const handlePayment = async () => {
  const result = await createPayment('BOOK_PART_2');
  
  if (result.success && result.checkoutUrl) {
    // Ouvrir PayDunya
    await openPayDunyaCheckout(result.checkoutUrl);
  }
};
```

### **3. Retour via deep link**
```typescript
// App.tsx - Gestion automatique
if (parsed?.hostname === 'paydunya' && parsed?.path === 'success') {
  // Paiement réussi - vérifier les entitlements
  handlePaymentSuccess();
}
```

### **4. Déblocage du contenu**
```typescript
const handlePaymentSuccess = async () => {
  // Re-vérifier les entitlements
  const entitlements = await checkEntitlements();
  
  if (entitlements.part2 && entitlements.part3) {
    // Débloquer le contenu dans l'app
    unlockContent();
  }
};
```

## 🛠️ **Services Disponibles**

### **PaymentService**
```typescript
import { usePaymentService } from './src/lib/paymentService';

const { 
  checkEntitlements,
  createPayment,
  checkPaymentStatus,
  openPayDunyaCheckout
} = usePaymentService(userId);
```

### **Méthodes disponibles**
- `checkEntitlements()` - Vérifier les accès utilisateur
- `createPayment(planId)` - Créer un paiement PayDunya
- `checkPaymentStatus(token)` - Vérifier le statut d'un paiement
- `openPayDunyaCheckout(url)` - Ouvrir le checkout PayDunya

## 🔧 **Configuration Backend**

### **Variables d'environnement**
```bash
# Backend (.env.local)
PAYDUNYA_ENV=sandbox
PAYDUNYA_MASTER_KEY=3T9S0zED-0LOy-6WWg-98Ra-c4JbSf1BduVk
PAYDUNYA_PRIVATE_KEY=test_private_KskQ9V7MRHg0dDjs0M22SZuD4m2
PAYDUNYA_TOKEN=MVxlWyhNl6GhGNpTKOfe
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
NEXT_PUBLIC_BASE_URL=http://localhost:3000
POSTGRES_URL=postgres://...
```

### **APIs Backend**
- `GET /api/entitlements?userId=xxx` - Vérifier les accès
- `POST /api/paydunya/checkout` - Créer une facture
- `POST /api/paydunya/ipn` - Webhook PayDunya

## 📱 **Exemple d'Implémentation**

### **Écran de paiement**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { usePaymentService } from '../lib/paymentService';

const PaymentScreen = ({ userId }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { checkEntitlements, createPayment, openPayDunyaCheckout } = usePaymentService(userId);

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    const entitlements = await checkEntitlements();
    setHasAccess(entitlements.part2 && entitlements.part3);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const result = await createPayment('BOOK_PART_2');
      
      if (result.success && result.checkoutUrl) {
        await openPayDunyaCheckout(result.checkoutUrl);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le paiement');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {hasAccess ? (
        <Text>Vous avez accès aux parties 2 et 3 !</Text>
      ) : (
        <TouchableOpacity onPress={handlePayment} disabled={isLoading}>
          <Text>{isLoading ? 'Chargement...' : 'Acheter l\'accès (15000 FCFA)'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

## 🚀 **Déploiement Production**

### **1. Variables d'environnement production**
```bash
# Backend Vercel
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=votre_clé_production
PAYDUNYA_PRIVATE_KEY=votre_clé_privée_production
PAYDUNYA_TOKEN=votre_token_production
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
NEXT_PUBLIC_BASE_URL=https://votre-backend.vercel.app
```

### **2. Configuration PayDunya**
Dans votre dashboard PayDunya :
- **IPN Endpoint** : `https://votre-backend.vercel.app/api/paydunya/ipn`
- **Return URL** : `attaqwa://paydunya/success`
- **Cancel URL** : `attaqwa://paydunya/cancel`

### **3. App mobile**
```bash
# Variables d'environnement app mobile
EXPO_PUBLIC_BACKEND_URL=https://votre-backend.vercel.app
```

## ✅ **Tests**

### **Test du flux complet**
1. Vérifier les entitlements initiaux
2. Créer un paiement
3. Simuler un retour PayDunya
4. Vérifier les entitlements finaux

### **Test des deep links**
```bash
# Tester les deep links
npx uri-scheme open "attaqwa://paydunya/success" --android
npx uri-scheme open "attaqwa://paydunya/success" --ios
```

## 🔒 **Sécurité**

- ✅ Deep links sécurisés avec schéma personnalisé
- ✅ Validation des tokens PayDunya
- ✅ Vérification des entitlements côté backend
- ✅ Webhook IPN pour confirmation automatique

## 📊 **Monitoring**

### **Logs à surveiller**
- Création de factures PayDunya
- Réceptions d'IPN
- Deep links reçus
- Mises à jour d'entitlements

### **Métriques importantes**
- Taux de conversion des paiements
- Temps de traitement des deep links
- Erreurs de validation des tokens 