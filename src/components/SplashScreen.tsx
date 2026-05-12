import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function SplashScreen() {
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.splashFamilleBg}>
      <StatusBar barStyle="light-content" backgroundColor="#174C3C" />
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
      {/* Barre de progression en bas */}
      <View style={[styles.progressContainer, { bottom: 40 }]}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  topContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  splashFamilleLogo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 40,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 8,
  },
  splashMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 20,
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 17,
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 22,
  },
  splashFamilleImageXL: {
    width: '110%',
    height: '55%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: '-10%',
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 50,
    left: 40,
    right: 40,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
});
