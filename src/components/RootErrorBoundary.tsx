import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthPersistence } from '../utils/authPersistence';

type State = { hasError: boolean; error?: any };

// Petit filet de sécurité global pour éviter un écran blanc silencieux en prod
export default class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('💥 Erreur fatale UI:', error, info?.componentStack);
  }

  reload = async () => {
    try {
      // Import dynamique pour éviter d'exiger expo-updates comme dépendance
      let reloader: (() => Promise<void>) | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('expo-updates');
        if (mod?.reloadAsync) reloader = mod.reloadAsync;
      } catch {}
      if (reloader) await reloader();
      else (globalThis as any)?.location?.reload?.();
    } catch (e) {
      console.error('Reload failed:', e);
    }
  };

  clearCacheAndReload = async () => {
    try {
      await clearAuthPersistence();
      await AsyncStorage.clear();
    } catch {}
    await this.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children as any;
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F5F7', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, color: '#174C3C', fontWeight: 'bold', marginBottom: 8 }}>Un problème est survenu</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
          L’application va redémarrer. Si le problème persiste, videz le cache puis réessayez.
        </Text>
        <TouchableOpacity onPress={this.reload} style={{ backgroundColor: '#174C3C', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.clearCacheAndReload} style={{ backgroundColor: '#BB9B4E', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Vider le cache et redémarrer</Text>
        </TouchableOpacity>
      </View>
    );
  }
}


