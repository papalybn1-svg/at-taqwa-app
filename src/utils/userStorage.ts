import AsyncStorage from '@react-native-async-storage/async-storage';

const makeKey = (uid: string | null | undefined, name: string) => `${uid ?? 'anon'}:${name}`;

export async function read<T = any>(uid: string | null | undefined, name: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(makeKey(uid, name));
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function write(uid: string | null | undefined, name: string, value: any) {
  await AsyncStorage.setItem(makeKey(uid, name), JSON.stringify(value));
}

export async function remove(uid: string | null | undefined, name: string) {
  await AsyncStorage.removeItem(makeKey(uid, name));
}

// Migration optionnelle: si une clé non scopée existe et que la version scopée n'existe pas encore, on copie puis on supprime l'ancienne
export async function migrateUnscopedKeyToUser(uid: string | null | undefined, name: string) {
  const unscoped = await AsyncStorage.getItem(name);
  const scoped = await AsyncStorage.getItem(makeKey(uid, name));
  if (unscoped && !scoped) {
    await AsyncStorage.setItem(makeKey(uid, name), unscoped);
    await AsyncStorage.removeItem(name);
  }
}

// Suppression de toutes les clés d'un préfixe pour un utilisateur (ex: quizSession:*)
export async function removeAllWithPrefix(uid: string | null | undefined, prefix: string) {
  const keys = await AsyncStorage.getAllKeys();
  const fullPrefix = makeKey(uid, prefix);
  const toRemove = keys.filter(k => k.startsWith(fullPrefix));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}

export async function listKeysWithPrefix(uid: string | null | undefined, prefix: string): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  const fullPrefix = makeKey(uid, prefix);
  return keys.filter(k => k.startsWith(fullPrefix)).map(k => k.substring(fullPrefix.length));
}

export type ChapterState = Record<string, { percent: number; lastSection: number; updatedAt: number }>;
