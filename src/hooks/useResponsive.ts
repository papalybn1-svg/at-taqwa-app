import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export interface ResponsiveDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isSmallScreen: boolean;
  scale: number;
  fontScale: number;
}

export const useResponsive = (): ResponsiveDimensions => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;
  const isSmallScreen = Math.min(width, height) < 400;
  
  // Calcul du scale basé sur la largeur de référence (375px pour iPhone)
  const baseWidth = 375;
  const scale = Math.min(width / baseWidth, 1.5); // Limiter le scale à 1.5x max
  
  // Calcul du fontScale pour la lisibilité
  const fontScale = isLandscape ? Math.min(scale * 0.9, 1.2) : scale;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallScreen,
    scale,
    fontScale
  };
};

// Fonctions utilitaires pour les styles responsifs
export const getResponsiveStyle = (responsive: ResponsiveDimensions) => ({
  // Tailles de police responsives
  fontSize: {
    xs: Math.max(10, responsive.fontScale * 10),
    sm: Math.max(12, responsive.fontScale * 12),
    base: Math.max(14, responsive.fontScale * 14),
    lg: Math.max(16, responsive.fontScale * 16),
    xl: Math.max(18, responsive.fontScale * 18),
    '2xl': Math.max(20, responsive.fontScale * 20),
    '3xl': Math.max(24, responsive.fontScale * 24),
    '4xl': Math.max(28, responsive.fontScale * 28),
  },
  
  // Espacements responsifs
  spacing: {
    xs: Math.max(4, responsive.scale * 4),
    sm: Math.max(8, responsive.scale * 8),
    base: Math.max(12, responsive.scale * 12),
    lg: Math.max(16, responsive.scale * 16),
    xl: Math.max(20, responsive.scale * 20),
    '2xl': Math.max(24, responsive.scale * 24),
    '3xl': Math.max(32, responsive.scale * 32),
  },
  
  // Tailles de composants
  component: {
    buttonHeight: Math.max(44, responsive.scale * 44),
    iconSize: Math.max(20, responsive.scale * 20),
    cardPadding: Math.max(16, responsive.scale * 16),
    borderRadius: Math.max(8, responsive.scale * 8),
  }
});
