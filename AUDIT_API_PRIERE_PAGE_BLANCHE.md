# 🔍 AUDIT COMPLET - API PRIÈRE PAGE BLANCHE
**Date :** 30 janvier 2025  
**Projet :** at-taqwa-app  
**Problème :** Page blanche avec connexion, nécessite de fermer l'app pour voir les heures

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. ❌ Pas de timeout sur les appels API

**Fichier :** `src/services/prayerTimesService.ts`  
**Ligne :** 192-202

#### Problème A : `callAladhan` sans timeout

**Code actuel :**
```tsx
const callAladhan = async (url: string) => {
  const response = await fetch(url); // ❌ Pas de timeout
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  const json = await response.json();
  if (json.code !== 200 || !json.data) {
    throw new Error(`Réponse Aladhan invalide: ${JSON.stringify(json)}`);
  }
  return json.data;
};
```

**Conséquence :** Si la connexion est lente ou bloquée, `fetch` peut rester en attente **indéfiniment**, causant une page blanche.

#### Problème B : `fetchPrayerTimes` sans timeout global

**Ligne :** 213-332

La fonction `fetchPrayerTimes` fait plusieurs appels API en chaîne :
1. `searchCityWithCountry` (peut bloquer)
2. `callAladhan` (peut bloquer)
3. `Location.getCurrentPositionAsync` (peut bloquer)

**Conséquence :** Si un de ces appels bloque, toute la fonction reste bloquée, causant une page blanche.

---

### 2. ❌ Pas de timeout dans HorairesScreen

**Fichier :** `src/screens/HorairesScreen.tsx`  
**Ligne :** 179-235

#### Problème

**Code actuel :**
```tsx
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchPrayerTimes('Dakar'); // ❌ Pas de timeout
      // ...
    } catch (error) {
      // ...
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**Conséquence :** Si `fetchPrayerTimes` bloque (pas d'erreur, juste un blocage), `setLoading(false)` n'est jamais appelé, causant une **page blanche permanente**.

---

### 3. ❌ Cache non utilisé au démarrage

**Fichier :** `src/screens/HorairesScreen.tsx`  
**Ligne :** 179-235

#### Problème

**Code actuel :**
```tsx
const loadData = async () => {
  setLoading(true);
  const result = await fetchPrayerTimes('Dakar'); // ❌ Appel API direct sans vérifier le cache
  // ...
};
```

**Conséquence :** 
- Le cache n'est utilisé **qu'en cas d'erreur** dans `fetchPrayerTimes`
- Si l'API bloque (pas d'erreur, juste un blocage), le cache n'est jamais utilisé
- L'utilisateur voit une page blanche même s'il y a des données en cache

**Solution nécessaire :** Vérifier le cache **avant** d'appeler l'API pour afficher rapidement les données.

---

### 4. ⚠️ Gestion d'erreur incomplète

**Fichier :** `src/services/prayerTimesService.ts`  
**Ligne :** 298-331

#### Problème

**Code actuel :**
```tsx
catch (error) {
  console.error('❌ Erreur fetchPrayerTimes (online):', error);
  
  // 2) Fallback: utiliser le dernier succès pour cette ville / position
  const cached = await loadLastPrayerTimes(id);
  if (cached) {
    return { ...cached, offline: true };
  }
  
  // 3) Fallback ultime: horaires statiques Dakar
  return { timings: fallbackTimings, ... };
}
```

**Problème :** 
- Le cache n'est utilisé que si une **erreur** est levée
- Si `fetch` bloque (pas d'erreur, juste un timeout), le catch n'est jamais appelé
- Le fallback n'est jamais atteint

---

### 5. ⚠️ Pas de gestion de connexion réseau

**Fichier :** `src/screens/HorairesScreen.tsx`  
**Ligne :** 179-235

#### Problème

**Code actuel :**
```tsx
const loadData = async () => {
  setLoading(true);
  setOfflineMode(false);
  const result = await fetchPrayerTimes('Dakar');
  // ...
};
```

**Conséquence :** 
- Pas de vérification de la connexion réseau avant l'appel API
- Pas de détection si la connexion est instable
- L'app essaie toujours d'appeler l'API même sans connexion

---

### 6. 🔍 ANALYSE DU FLUX PROBLÉMATIQUE

#### Scénario qui cause la page blanche

1. **Utilisateur ouvre l'app avec connexion**
   - `HorairesScreen` se monte
   - `useEffect` appelle `loadData()`
   - `setLoading(true)` → écran de chargement affiché

2. **Appel API bloque**
   - `fetchPrayerTimes('Dakar')` est appelé
   - `callAladhan` fait un `fetch` sans timeout
   - La connexion est lente/instable
   - `fetch` reste en attente **indéfiniment**

3. **Résultat**
   - `setLoading(false)` n'est **jamais appelé** (pas d'erreur, pas de timeout)
   - L'écran de chargement reste affiché → **page blanche**
   - Le cache n'est jamais utilisé (pas d'erreur levée)
   - L'utilisateur doit fermer l'app pour que ça fonctionne

4. **Pourquoi ça fonctionne après avoir fermé l'app ?**
   - Quand l'app est fermée, les requêtes en cours sont annulées
   - Au redémarrage, si l'API échoue rapidement, le catch est appelé
   - Le cache est utilisé et les données s'affichent

---

### 7. 📊 PROBLÈMES SPÉCIFIQUES IDENTIFIÉS

| Problème | Fichier | Ligne | Impact | Priorité |
|----------|---------|-------|--------|----------|
| Pas de timeout sur `callAladhan` | prayerTimesService.ts | 192 | **Page blanche** si connexion lente | 🔴 Critique |
| Pas de timeout sur `fetchPrayerTimes` | prayerTimesService.ts | 213 | **Page blanche** si API bloque | 🔴 Critique |
| Pas de timeout dans `useEffect` | HorairesScreen.tsx | 179 | **Page blanche** permanente | 🔴 Critique |
| Cache non utilisé au démarrage | HorairesScreen.tsx | 190 | Pas d'affichage rapide | 🟡 Important |
| Pas de vérification réseau | HorairesScreen.tsx | 186 | Appels API inutiles | 🟡 Important |
| `searchCityWithCountry` peut bloquer | citySearchService.ts | 230 | Blocage en chaîne | 🟡 Important |

---

### 8. 🔍 DÉTAILS TECHNIQUES

#### A. `callAladhan` sans timeout

**Problème :**
```tsx
const callAladhan = async (url: string) => {
  const response = await fetch(url); // ❌ Peut bloquer indéfiniment
  // ...
};
```

**Solution nécessaire :**
```tsx
const callAladhan = async (url: string, timeoutMs: number = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    // ...
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La requête a pris trop de temps');
    }
    throw error;
  }
};
```

#### B. `fetchPrayerTimes` sans timeout global

**Problème :** Plusieurs appels API en chaîne sans timeout global.

**Solution nécessaire :** Ajouter un timeout global avec `Promise.race`.

#### C. Cache non utilisé au démarrage

**Problème :** Le cache n'est vérifié qu'en cas d'erreur.

**Solution nécessaire :** Vérifier le cache **avant** l'appel API pour afficher rapidement les données.

---

### 9. 📋 SOLUTIONS RECOMMANDÉES

#### Solution A : Ajouter des timeouts sur tous les appels API

1. **Timeout sur `callAladhan`** (10 secondes)
2. **Timeout global sur `fetchPrayerTimes`** (15 secondes)
3. **Timeout sur `useEffect` dans HorairesScreen** (20 secondes)

#### Solution B : Utiliser le cache au démarrage

1. **Vérifier le cache AVANT l'appel API**
2. **Afficher les données en cache immédiatement**
3. **Mettre à jour en arrière-plan si l'API répond**

#### Solution C : Améliorer la gestion d'erreur

1. **Détecter les timeouts explicitement**
2. **Utiliser le cache en cas de timeout**
3. **Afficher un message à l'utilisateur**

#### Solution D : Vérifier la connexion réseau

1. **Vérifier la connexion avant l'appel API**
2. **Utiliser le cache directement si pas de connexion**
3. **Réessayer automatiquement quand la connexion revient**

---

## ⏸️ EN ATTENTE DE VOS INSTRUCTIONS

J'ai identifié tous les problèmes de page blanche dans l'API de prière. **J'attends vos instructions** pour procéder aux corrections.

**Problèmes identifiés :**
1. ✅ Pas de timeout sur `callAladhan` → peut bloquer indéfiniment
2. ✅ Pas de timeout sur `fetchPrayerTimes` → peut bloquer indéfiniment
3. ✅ Pas de timeout dans `useEffect` → page blanche permanente
4. ✅ Cache non utilisé au démarrage → pas d'affichage rapide
5. ✅ Pas de vérification réseau → appels API inutiles

**Solutions recommandées :**
1. Ajouter des timeouts sur tous les appels API
2. Utiliser le cache au démarrage pour afficher rapidement
3. Améliorer la gestion d'erreur avec détection de timeout
4. Vérifier la connexion réseau avant les appels

---

**Prochaines étapes suggérées :**
1. Ajouter timeout sur `callAladhan` (10s)
2. Ajouter timeout global sur `fetchPrayerTimes` (15s)
3. Ajouter timeout sur `useEffect` dans HorairesScreen (20s)
4. Utiliser le cache au démarrage
5. Améliorer la gestion d'erreur




