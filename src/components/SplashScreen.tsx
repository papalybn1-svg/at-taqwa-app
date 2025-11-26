import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.splashFamilleBg}>
      {/* Bloc image + texte en haut */}
      <View style={styles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('../../assets/Page_acceuil_dome_mosquee.png')} 
          style={styles.splashFamilleLogo}
        />
        {/* Texte principal */}
        <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      {/* Image de la famille en bas */}
      <Image 
        source={require('../../assets/femme_et_enfant_2.png')} 
        style={styles.splashFamilleImageXL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#F4F7F6',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topContentBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  splashFamilleLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  splashMainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  splashFamilleImageXL: {
    width: '100%',
    height: 280,
    resizeMode: 'contain',
    marginBottom: 40,
  },
});

