# Système de Cadenas des Quiz - AT-Taqwa

## 🎯 Objectif
Implémenter un système de progression où les quiz sont débloqués séquentiellement, avec un cadenas pour les quiz non accessibles.

## 🔧 Fonctionnalités Implémentées

### ✅ Système de Déverrouillage
- **Quiz 1** : Toujours débloqué (point d'entrée)
- **Quiz suivants** : Débloqués seulement si le quiz précédent dans la liste est complété avec **80%**
- **Gestion des chapitres manquants** : Si un chapitre n'existe pas (ex: pas de chapitre 4), le système passe au suivant
- **Exigence équilibrée** : Progression possible avec un bon niveau de maîtrise

### ✅ Affichage Visuel
- **Quiz débloqués** : Affichage normal avec image du chapitre
- **Quiz verrouillés** : 
  - Opacité réduite (60%)
  - Fond grisé
  - Icône de cadenas par-dessus l'image
  - Texte "Quiz verrouillé"
  - Couleurs atténuées

### ✅ Système de Scores
- **Stockage local** : Utilisation d'AsyncStorage pour persistance
- **Mise à jour intelligente** : Le score n'est mis à jour que s'il est meilleur
- **Affichage conditionnel** : Le score n'apparaît que pour les quiz complétés

### ✅ Interaction Utilisateur
- **Quiz débloqués** : Navigation normale vers le quiz
- **Quiz verrouillés** : Alert avec message personnalisé indiquant le score actuel du quiz précédent
- **Rechargement automatique** : Les scores se mettent à jour quand on revient à la page
- **Feedback précis** : L'utilisateur sait exactement quel score il doit atteindre (80%)

## 📁 Fichiers Modifiés

### `src/screens/QuizChapterSelectScreen.tsx`
- Ajout du système de cadenas
- Logique de déverrouillage
- Affichage conditionnel des scores
- Styles pour les états verrouillés/débloqués

### `src/screens/OriginalQuizScreen.tsx`
- Sauvegarde automatique du score à la fin du quiz
- Calcul du pourcentage de réussite
- Mise à jour uniquement si le score est meilleur

## 🎨 Styles Ajoutés

```typescript
// États verrouillés
lockedCard: { opacity: 0.6, backgroundColor: '#f5f5f5' }
lockedImage: { opacity: 0.4 }
lockOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.3)' }
lockIcon: { width: 30, height: 30, tintColor: '#666' }
lockedText: { color: '#999' }
lockedMessage: { fontSize: 11, color: '#999', fontStyle: 'italic' }

// Affichage des scores
scoreContainer: { backgroundColor: colors.primary + '15', borderRadius: 6 }
scoreText: { fontSize: 11, fontWeight: '600', color: colors.primary }
```

## 🔄 Flux de Données

1. **Chargement initial** : Récupération des scores depuis AsyncStorage
2. **Vérification déverrouillage** : Pour chaque chapitre, vérification si le précédent est complété
3. **Affichage conditionnel** : Application des styles selon l'état
4. **Sauvegarde score** : À la fin d'un quiz, calcul et sauvegarde du pourcentage
5. **Mise à jour UI** : Rechargement des scores quand l'écran redevient actif

## 🧪 Test du Système

Pour tester le système :
1. Commencer par le quiz du chapitre 1 (toujours débloqué)
2. **Obtenir 80%** au quiz pour débloquer le chapitre 2
3. Vérifier que les chapitres suivants restent verrouillés si le score < 80%
4. Vérifier l'affichage du score sur les quiz complétés
5. Tester la mise à jour du score (refaire un quiz avec un meilleur score)
6. Vérifier que seuls les scores de 80% ou plus permettent la progression

## 🎯 Avantages

- **Progression guidée** : L'utilisateur suit un parcours logique
- **Motivation** : Le cadenas crée un objectif à atteindre
- **Niveau équilibré** : 80% requis pour assurer une bonne maîtrise
- **Persistance** : Les scores sont sauvegardés localement
- **Performance** : Pas de requêtes serveur pour les scores
- **UX claire** : Distinction visuelle nette entre états
- **Feedback précis** : L'utilisateur sait exactement ce qu'il doit accomplir 