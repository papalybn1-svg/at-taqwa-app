/**
 * Utilitaires responsives pour les écrans Quiz
 * Système unifié pour QuizStartScreen et OriginalQuizScreen
 */

import { ResponsiveDimensions, Breakpoint } from '../hooks/useResponsive';

/**
 * Calcule la taille optimale du personnage selon le breakpoint
 */
export const getCharacterSize = (responsive: ResponsiveDimensions) => {
  const { width, height, breakpoint } = responsive;
  
  // Ratios de largeur optimisés pour chaque breakpoint
  const widthRatios: Record<Breakpoint, number> = {
    xs: 0.75,   // Très petits écrans : 75%
    sm: 0.70,   // iPhone standard : 70%
    md: 0.65,   // Grands téléphones : 65%
    lg: 0.60,   // Très grands téléphones : 60%
    xl: 0.50,   // Tablettes : 50%
    xxl: 0.45,  // Grandes tablettes : 45%
  };
  
  // Ratios de hauteur optimisés
  const heightRatios: Record<Breakpoint, number> = {
    xs: 0.45,   // Très petits écrans : 45%
    sm: 0.40,   // iPhone standard : 40%
    md: 0.38,   // Grands téléphones : 38%
    lg: 0.35,   // Très grands téléphones : 35%
    xl: 0.35,   // Tablettes : 35%
    xxl: 0.30,  // Grandes tablettes : 30%
  };
  
  // Largeurs maximales pour éviter que le personnage soit trop grand
  const maxWidths: Record<Breakpoint, number> = {
    xs: 280,
    sm: 300,
    md: 320,
    lg: 350,
    xl: 400,
    xxl: 450,
  };
  
  // Hauteurs maximales
  const maxHeights: Record<Breakpoint, number> = {
    xs: 350,
    sm: 400,
    md: 450,
    lg: 480,
    xl: 500,
    xxl: 550,
  };
  
  return {
    width: Math.min(width * widthRatios[breakpoint], maxWidths[breakpoint]),
    height: Math.min(height * heightRatios[breakpoint], maxHeights[breakpoint]),
  };
};

/**
 * Calcule la position du personnage (marginTop) pour poser les pieds au début de la carte
 * Utilise des ratios basés sur la hauteur d'écran plutôt que des pixels fixes
 */
export const getCharacterPosition = (responsive: ResponsiveDimensions) => {
  const { height, breakpoint } = responsive;
  
  // Ratios de marginTop négatif pour faire descendre le personnage
  // Basés sur la hauteur d'écran pour une meilleure adaptation
  const marginTopRatios: Record<Breakpoint, number> = {
    xs: -0.08,   // Très petits : -8% de la hauteur (~-45px sur 568px)
    sm: -0.09,   // iPhone standard : -9% (~-73px sur 812px)
    md: -0.10,   // Grands téléphones : -10% (~-90px sur 900px)
    lg: -0.11,   // Très grands téléphones : -11%
    xl: -0.08,   // Tablettes : -8% (~-80px sur 1024px)
    xxl: -0.07,  // Grandes tablettes : -7%
  };
  
  return {
    marginTop: height * marginTopRatios[breakpoint],
  };
};

/**
 * Calcule la position de la stack de cartes en bas de l'écran
 */
export const getCardStackPosition = (responsive: ResponsiveDimensions) => {
  const { height, breakpoint } = responsive;
  
  // Ratios de position en bas de l'écran
  const bottomRatios: Record<Breakpoint, number> = {
    xs: 0.08,   // Très petits : 8% du bas (~45px sur 568px)
    sm: 0.06,   // iPhone standard : 6% (~49px sur 812px)
    md: 0.05,   // Grands téléphones : 5% (~45px sur 900px)
    lg: 0.05,   // Très grands téléphones : 5%
    xl: 0.05,   // Tablettes : 5% (~51px sur 1024px)
    xxl: 0.04,  // Grandes tablettes : 4%
  };
  
  return {
    bottom: height * bottomRatios[breakpoint],
  };
};

/**
 * Calcule les tailles des cartes empilées (backCard, middleCard, whiteCard)
 */
export const getCardSizes = (responsive: ResponsiveDimensions) => {
  const { height, breakpoint } = responsive;
  
  // Ratios de hauteur pour chaque carte selon le breakpoint
  const cardHeightRatios: Record<Breakpoint, { back: number; middle: number; white: number }> = {
    xs: { back: 0.55, middle: 0.53, white: 0.51 },  // Très petits écrans
    sm: { back: 0.52, middle: 0.50, white: 0.48 },  // iPhone standard
    md: { back: 0.50, middle: 0.48, white: 0.46 },  // Grands téléphones
    lg: { back: 0.48, middle: 0.46, white: 0.44 },  // Très grands téléphones
    xl: { back: 0.50, middle: 0.48, white: 0.46 },  // Tablettes
    xxl: { back: 0.48, middle: 0.46, white: 0.44 }, // Grandes tablettes
  };
  
  const ratios = cardHeightRatios[breakpoint];
  
  return {
    backCard: { height: height * ratios.back },
    middleCard: { height: height * ratios.middle },
    whiteCard: { height: height * ratios.white },
  };
};

/**
 * Calcule le paddingTop de la carte blanche pour laisser de l'espace au personnage
 */
export const getWhiteCardPaddingTop = (responsive: ResponsiveDimensions) => {
  const { breakpoint } = responsive;
  
  // PaddingTop basé sur les breakpoints (utilise responsiveStyle.spacing)
  const paddingTopMultipliers: Record<Breakpoint, number> = {
    xs: 1.0,   // Très petits écrans : base
    sm: 1.1,   // iPhone standard : +10%
    md: 1.2,   // Grands téléphones : +20%
    lg: 1.3,   // Très grands téléphones : +30%
    xl: 1.5,   // Tablettes : +50%
    xxl: 1.6,  // Grandes tablettes : +60%
  };
  
  return paddingTopMultipliers[breakpoint];
};





