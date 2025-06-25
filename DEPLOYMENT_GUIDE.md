# 🚀 Guide de déploiement et mises à jour - At-Taqwa App

## 📱 **Types de modifications et leurs impacts**

### **1. Modifications de code (JavaScript/TypeScript)**
**Exemples :**
- Changement de texte dans les écrans
- Modification de styles CSS
- Ajout de nouvelles fonctionnalités React
- Modification de la logique métier

**Impact :** ✅ **Mise à jour OTA possible (pas de rebuild)**

### **2. Modifications natives (nécessitent un rebuild)**
**Exemples :**
- Ajout de nouvelles dépendances (`npm install`)
- Modification de `app.json` ou `eas.json`
- Changement de configuration Android/iOS
- Ajout de permissions natives

**Impact :** ❌ **Rebuild complet nécessaire**

## 🔄 **Processus de mise à jour**

### **Option 1 : Mise à jour OTA (Recommandée pour le code)**
```bash
# Après avoir fait tes modifications et commit/push
./update-app.sh
# Choisir l'option 1

# Ou manuellement :
eas update --branch preview --message "Description des modifications"
```

**Avantages :**
- ⚡ **Rapide** (quelques secondes)
- 🔄 **Automatique** dans l'app
- 💰 **Gratuit**
- 📱 **Pas besoin de réinstaller**

### **Option 2 : Build complet (Pour les dépendances natives)**
```bash
# Après avoir ajouté des dépendances natives
./update-app.sh
# Choisir l'option 2

# Ou manuellement :
eas build --platform android --profile preview
```

**Quand l'utiliser :**
- Ajout de `npm install` de nouveaux packages
- Modification de la configuration native
- Changement de permissions

### **Option 3 : Build de développement (Pour le développement actif)**
```bash
./update-app.sh
# Choisir l'option 3

# Ou manuellement :
eas build --platform android --profile development
```

**Avantages :**
- 🔧 **Client de développement intégré**
- 🐛 **Logs de débogage**
- ⚡ **Mises à jour OTA plus rapides**

## 📋 **Workflow recommandé**

### **Pour le développement quotidien :**
1. **Faire tes modifications** dans le code
2. **Tester** avec `npx expo start` (Expo Go pour les tests rapides)
3. **Commit et push** sur GitHub
4. **Mise à jour OTA** : `./update-app.sh` → Option 1
5. **Tester** sur l'app installée

### **Pour les nouvelles dépendances :**
1. **Ajouter** la dépendance : `npm install package-name`
2. **Tester** localement
3. **Commit et push**
4. **Build complet** : `./update-app.sh` → Option 2
5. **Télécharger et installer** le nouvel APK

## 🎯 **Commandes utiles**

### **Vérifier le statut EAS :**
```bash
eas whoami          # Voir qui est connecté
eas project:info    # Informations du projet
```

### **Voir les builds récents :**
```bash
eas build:list      # Liste des builds
eas build:view      # Voir un build spécifique
```

### **Gérer les mises à jour :**
```bash
eas update:list     # Voir les mises à jour OTA
eas update:view     # Voir une mise à jour spécifique
```

## ⚡ **Optimisations pour le développement**

### **1. Utiliser le mode développement :**
```bash
# Premier build de développement
eas build --platform android --profile development

# Installer l'APK de développement
# Puis utiliser les mises à jour OTA pour le développement
```

### **2. Branches pour différents environnements :**
```bash
# Développement
eas update --branch development

# Preview/Test
eas update --branch preview

# Production
eas update --branch production
```

### **3. Variables d'environnement :**
```bash
# Dans eas.json, tu peux définir des variables par environnement
# Exemple : URL de l'API différente selon l'environnement
```

## 🚨 **Dépannage**

### **Problème : Mise à jour OTA ne fonctionne pas**
**Solutions :**
1. Vérifier que l'app est connectée à internet
2. Redémarrer l'app
3. Vérifier que le build supporte les mises à jour OTA

### **Problème : Build échoue**
**Solutions :**
1. Vérifier les logs : `eas build:view [BUILD_ID]`
2. Vérifier la configuration dans `eas.json`
3. Tester localement d'abord

### **Problème : App ne se met pas à jour**
**Solutions :**
1. Forcer la fermeture et réouverture de l'app
2. Vérifier la connexion internet
3. Redémarrer le téléphone si nécessaire

## 📊 **Monitoring**

### **Voir les statistiques :**
- **Dashboard Expo** : https://expo.dev/accounts/[username]/projects/[project]
- **Builds** : Onglet "Builds"
- **Mises à jour** : Onglet "Updates"
- **Analytics** : Onglet "Analytics" (si activé)

---

## 🎉 **Résumé**

- **Modifications de code** → Mise à jour OTA (rapide et automatique)
- **Nouvelles dépendances** → Build complet (plus lent mais nécessaire)
- **Développement actif** → Build de développement + mises à jour OTA
- **Script automatique** : `./update-app.sh` pour simplifier le processus

**L'app se met à jour automatiquement dans la plupart des cas !** 🚀 