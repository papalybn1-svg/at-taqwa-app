import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

// Breakpoints basés sur la LARGEUR réelle de l'écran
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ResponsiveDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isSmallScreen: boolean;
  scale: number;
  fontScale: number;
  maxContentWidth: number;
  horizontalPadding: number;
  gridColumns: number;

  // 🔽 Nouveaux champs pour un responsive plus précis (sans casser l'existant)
  breakpoint: Breakpoint;
  isStandardScreen: boolean; // iPhone 11/12/13/14 (référence ~375px)
  isWidePhone: boolean;      // Pro Max / grands Android
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
  const minSide = Math.min(width, height);

  // Détection des tablettes : basée sur la plus petite dimension
  const isTablet = minSide >= 768;
  const isSmallScreen = minSide < 400;
  
  // 🔽 Breakpoints unifiés basés sur la LARGEUR (pour layout précis)
  let breakpoint: Breakpoint;
  if (width < 360) breakpoint = 'xs';          // Très petits écrans (anciens iPhone / petits Android)
  else if (width < 400) breakpoint = 'sm';     // iPhone 11/12/13/14 - référence
  else if (width < 480) breakpoint = 'md';     // iPhone Pro Max / grands téléphones
  else if (width < 768) breakpoint = 'lg';     // Grands Android / Fold extérieur
  else if (width < 1024) breakpoint = 'xl';    // Tablettes portrait
  else breakpoint = 'xxl';                     // Grandes tablettes / paysage

  const isStandardScreen = breakpoint === 'sm';
  const isWidePhone = breakpoint === 'md' || breakpoint === 'lg';
  
  // Calcul du scale basé sur la largeur de référence (375px pour iPhone)
  const baseWidth = 375;
  // Pour les tablettes, on utilise un scale plus généreux pour une meilleure lisibilité
  const scale = isTablet 
    ? Math.min(width / baseWidth, 2.0) // Limiter à 2x pour tablettes
    : Math.min(width / baseWidth, 1.5); // Limiter à 1.5x pour téléphones
  
  // Calcul du fontScale pour la lisibilité
  // Sur tablettes, on augmente légèrement le fontScale pour une meilleure lisibilité
  const fontScale = isTablet
    ? (isLandscape ? Math.min(scale * 0.95, 1.4) : Math.min(scale * 1.05, 1.5))
    : (isLandscape ? Math.min(scale * 0.9, 1.2) : scale);

  // Contraintes tablette (iPad / Android)
  const maxContentWidth = isTablet ? (isLandscape ? Math.min(1024, width - 80) : Math.min(820, width - 48)) : width;
  const horizontalPadding = isTablet ? (isLandscape ? 28 : 20) : 16;
  const gridColumns = isTablet ? (isLandscape ? 4 : 3) : 2;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallScreen,
    scale,
    fontScale,
    maxContentWidth,
    horizontalPadding,
    gridColumns,
    breakpoint,
    isStandardScreen,
    isWidePhone,
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
