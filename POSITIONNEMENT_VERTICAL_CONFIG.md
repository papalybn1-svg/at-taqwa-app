# Configuration du Positionnement Vertical - Référence

**Date de création :** Avant pull  
**Problème :** L'application est actuellement trop montée vers le haut sur toutes les pages  
**Objectif :** Documenter les configurations actuelles pour pouvoir les restaurer après un pull

---

## 1. Configuration Globale (App.tsx)

### SafeAreaView Principal
**Fichier :** `App.tsx`  
**Ligne :** 450

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F7' }} edges={["top","bottom"]}>
```

**Configuration actuelle :**
- `edges={["top","bottom"]}` - Active les safe areas en haut et en bas
- `backgroundColor: '#F3F5F7'`

---

## 2. Navigation Tab (TabNavigator.tsx)

### Configuration de la TabBar
**Fichier :** `src/navigation/TabNavigator.tsx`  
**Lignes :** 115-131

```tsx
tabBarStyle: { 
  backgroundColor: colors.white,
  height: 80,
  paddingBottom: 20,
  paddingTop: 12,  // ← IMPORTANT
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 12,
  borderTopWidth: 0,
},
tabBarLabelStyle: {
  fontSize: 11,
  fontWeight: '600',
  marginTop: 4,  // ← IMPORTANT
},
```

**Valeurs clés :**
- `paddingTop: 12`
- `paddingBottom: 20`
- `marginTop: 4` (pour les labels)

---

## 3. Écrans Principaux

### HomeScreen.tsx
**Fichier :** `src/screens/HomeScreen.tsx`  
**Lignes :** 791-806

```tsx
safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
container: { flex: 1 },
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: responsive.horizontalPadding,
  paddingTop: 20,      // ← IMPORTANT
  paddingBottom: 10,
  marginTop: 15,       // ← IMPORTANT
  marginBottom: 20,
  alignSelf: 'center',
  width: '100%',
  maxWidth: responsive.maxContentWidth,
},
```

**Valeurs clés :**
- `paddingTop: 20`
- `marginTop: 15`

---

### HorairesScreen.tsx
**Fichier :** `src/screens/HorairesScreen.tsx`

**Note :** Cet écran n'utilise pas de SafeAreaView explicite, il hérite de la configuration globale.

**Valeurs marginTop/paddingTop importantes :**
- Ligne 658: `marginTop: 16`
- Ligne 696: `marginTop: 12`
- Ligne 712: `marginTop: 12`
- Ligne 756: `marginTop: 2`
- Ligne 823: `marginTop: 0`
- Ligne 829: `paddingTop: 2`
- Lignes 953+: Valeurs responsives conditionnelles

---

### ParametresScreen.tsx
**Fichier :** `src/screens/ParametresScreen.tsx`  
**Ligne :** 561

```tsx
scrollContent: { paddingTop: 28, paddingBottom: 24 },  // ← IMPORTANT
```

**Valeurs clés :**
- `paddingTop: 28`
- `paddingBottom: 24`

**Autres valeurs importantes :**
- Ligne 605: `paddingTop: 10` (sectionTitle)
- Ligne 584: `marginTop: 14` (profileQuickRow)
- Ligne 582: `marginTop: 8` (userBadgeXL)

---

### FavoritesScreen.tsx
**Fichier :** `src/screens/FavoritesScreen.tsx`  
**Lignes :** 294, 324

```tsx
paddingTop: 10,  // Ligne 294
paddingTop: 16,  // Ligne 324
```

---

### TasbihScreen.tsx
**Fichier :** `src/screens/TasbihScreen.tsx`  
**Lignes :** 781-798

```tsx
safeArea: { 
  flex: 1, 
  backgroundColor: '#F8FAF9' 
},
header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 16,  // ← IMPORTANT (équivaut à paddingTop: 16)
  backgroundColor: colors.white,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
},
```

**Valeurs clés :**
- `paddingVertical: 16` (header)
- Ligne 835: `paddingTop: 16` (section)
- Ligne 827: `marginTop: 16` (loadingText)

---

### ChapterScreen.tsx
**Fichier :** `src/screens/ChapterScreen.tsx`

**Valeurs importantes :**
- Ligne 880: `marginTop: 60` (contenu principal)
- Ligne 902: `paddingTop: currentSectionIndex === 0 ? 20 : 16`
- Ligne 1126: `marginTop: 24`
- Ligne 1133: `marginTop: 20`
- Ligne 1140: `marginTop: 20`

---

### LoginScreen.tsx
**Fichier :** `src/screens/LoginScreen.tsx`  
**Lignes :** 602, 669, 727, 745

```tsx
// Ligne 602
paddingTop: 32,

// Ligne 669
loginTitle: { 
  fontSize: 28, 
  fontWeight: 'bold', 
  color: '#174C3C', 
  marginBottom: 32, 
  textAlign: 'left', 
  alignSelf: 'flex-start', 
  maxWidth: 340, 
  width: '100%', 
  marginTop: 60,  // ← IMPORTANT
},

// Ligne 727
paddingTop: 40,

// Ligne 745
paddingTop: 60,
```

**Valeurs clés :**
- `paddingTop: 32` (container principal)
- `marginTop: 60` (loginTitle)
- `paddingTop: 40` (section)
- `paddingTop: 60` (section)

---

### QuizStartScreen.tsx
**Fichier :** `src/screens/QuizStartScreen.tsx`  
**Lignes :** 140, 153, 197, 217

```tsx
// Ligne 140
paddingTop: 0,

// Ligne 153
marginTop: getResponsiveSize(isSmallScreen ? -150 : isLargeScreen ? -250 : -200, false),

// Ligne 197
paddingTop: getResponsiveSize(isSmallScreen ? 100 : isLargeScreen ? 140 : 120, false),

// Ligne 217
marginTop: getResponsiveSize(isSmallScreen ? 15 : isLargeScreen ? 25 : 20, false),
```

**Valeurs clés :**
- `paddingTop: 0` (container)
- `marginTop` négatif pour remonter le contenu (responsive)
- `paddingTop` responsive (100-140)

---

### QuizScreen.tsx
**Fichier :** `src/screens/QuizScreen.tsx`  
**Lignes :** 71, 98

```tsx
// Ligne 71
paddingTop: getResponsiveSize(isSmallScreen ? 40 : 60, false),

// Ligne 98
marginTop: getResponsiveSize(isSmallScreen ? -30 : -50, false),
```

**Valeurs clés :**
- `paddingTop: 40-60` (responsive)
- `marginTop: -30 à -50` (responsive, négatif)

---

### OriginalQuizScreen.tsx
**Fichier :** `src/screens/OriginalQuizScreen.tsx`  
**Lignes :** 1312, 1322, 1326, 1471, 1633

```tsx
// Ligne 1312
paddingTop: 0,

// Ligne 1322
marginTop: 20, // Réduit de 30 à 20

// Ligne 1326
marginTop: 15, // Réduit de 30 à 15

// Ligne 1471
paddingTop: 25,

// Ligne 1633
paddingTop: 25,
```

**Valeurs clés :**
- `paddingTop: 0` (quizCardContainer)
- `marginTop: 20` (questionText)
- `marginTop: 15` (optionsContainer)
- `paddingTop: 25` (sections)

**Note importante :** Les commentaires indiquent que certaines valeurs ont été réduites (de 30 à 20, de 30 à 15).

---

### QuizChapterSelectScreen.tsx
**Fichier :** `src/screens/QuizChapterSelectScreen.tsx`  
**Lignes :** 435, 440, 682, 707, 749, 762, 768

```tsx
// Ligne 435
paddingTop: 20,

// Ligne 440
marginTop: 20,

// Ligne 682
paddingTop: 10,

// Ligne 707
marginTop: 30,

// Ligne 749
paddingTop: 20,

// Ligne 762
marginTop: 40,

// Ligne 768
marginTop: -40,
```

**Valeurs clés :**
- `paddingTop: 20` (plusieurs endroits)
- `marginTop: 30` (title)
- `marginTop: 40` et `marginTop: -40` (compensation)

---

### BooksScreen.tsx
**Fichier :** `src/screens/BooksScreen.tsx`  
**Lignes :** 329, 734, 752, 952, 958, 980

```tsx
// Ligne 329
contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}

// Ligne 734
paddingTop: 10,

// Ligne 752
marginTop: 2,

// Ligne 952
marginTop: 45,

// Ligne 958
paddingTop: 20,

// Ligne 980
paddingTop: 10,
```

**Valeurs clés :**
- `paddingTop: 10` (plusieurs endroits)
- `marginTop: 45` (section importante)
- `paddingTop: 20` (section)

---

### AuthorProfileScreen.tsx
**Fichier :** `src/screens/AuthorProfileScreen.tsx`  
**Lignes :** 28, 86, 109, 147, 175

```tsx
// Ligne 28
contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}

// Ligne 86
paddingTop: 0,

// Ligne 109
paddingTop: 10,

// Ligne 147
marginTop: 15,

// Ligne 175
marginTop: 20,
```

**Valeurs clés :**
- `paddingTop: 20` (ScrollView contentContainerStyle)
- `paddingTop: 0` (header)
- `marginTop: 15-20` (sections)

---

### CertificateScreen.tsx
**Fichier :** `src/screens/CertificateScreen.tsx`  
**Lignes :** 67, 112, 118, 417, 468, 631

```tsx
// Ligne 67
paddingTop: isForCapture ? 15 : 12

// Ligne 112
marginTop: isForCapture ? 8 : 6

// Ligne 118
paddingTop: isForCapture ? 18 : 14

// Ligne 417
paddingTop: 10,

// Ligne 468
marginTop: 20,

// Ligne 631
paddingTop: 20,
```

**Valeurs clés :**
- Valeurs conditionnelles selon `isForCapture`
- `paddingTop: 10-20` (sections)

---

## 4. Écrans Admin

### AdminDashboardScreen.tsx
**Fichier :** `src/screens/AdminDashboardScreen.tsx`  
**Lignes :** 202-204

```tsx
safeArea: { flex: 1, backgroundColor: '#f4f7f6' },
container: { flex: 1, paddingHorizontal: 16 },
header: { paddingVertical: 20, paddingHorizontal: 8 },  // ← paddingVertical: 20
```

**Valeurs clés :**
- `paddingVertical: 20` (header)

---

### AdminAccountScreen.tsx
**Fichier :** `src/screens/AdminAccountScreen.tsx`  
**Lignes :** 216, 219, 253, 287, 292

```tsx
marginTop: 4,
marginTop: 20,
marginTop: 2,
marginTop: 8,
marginTop: 4,
```

---

### AdminUsersScreen.tsx
**Fichier :** `src/screens/AdminUsersScreen.tsx`  
**Ligne :** 194

```tsx
marginTop: 50,
```

---

## 5. Résumé des Configurations Critiques

### SafeAreaView Global
- **App.tsx ligne 450 :** `edges={["top","bottom"]}`

### TabBar
- **TabNavigator.tsx :** `paddingTop: 12`, `paddingBottom: 20`, `marginTop: 4` (labels)

### Écrans avec paddingTop/marginTop importants
1. **HomeScreen :** `paddingTop: 20`, `marginTop: 15` (header)
2. **ParametresScreen :** `paddingTop: 28` (scrollContent)
3. **LoginScreen :** `marginTop: 60` (loginTitle), `paddingTop: 32/40/60`
4. **TasbihScreen :** `paddingVertical: 16` (header)
5. **ChapterScreen :** `marginTop: 60` (contenu principal)
6. **QuizStartScreen :** `paddingTop: 0`, `marginTop` négatif responsive
7. **QuizScreen :** `paddingTop: 40-60`, `marginTop` négatif responsive
8. **OriginalQuizScreen :** `paddingTop: 0`, `marginTop: 20/15`

---

## 6. Actions à Effectuer Après un Pull

1. **Vérifier App.tsx :** S'assurer que `edges={["top","bottom"]}` est présent
2. **Vérifier TabNavigator.tsx :** Restaurer `paddingTop: 12` et `marginTop: 4`
3. **Vérifier chaque écran :** Comparer les valeurs de `paddingTop` et `marginTop` avec cette référence
4. **Tester visuellement :** Vérifier que le contenu n'est pas trop monté vers le haut

---

## 7. Notes Importantes

- Certains écrans utilisent des valeurs **négatives** de `marginTop` pour remonter le contenu (QuizStartScreen, QuizScreen)
- Certains écrans utilisent des valeurs **responsives** qui varient selon la taille d'écran
- Le `SafeAreaView` global avec `edges={["top","bottom"]}` est crucial pour éviter que le contenu soit sous la barre de statut
- Les valeurs peuvent être conditionnelles (ex: `isForCapture` dans CertificateScreen)

---

**Dernière mise à jour :** Avant pull  
**À restaurer après :** Toutes les valeurs listées ci-dessus

