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
  // ✅ CORRECTION : Réduire sur petits écrans pour libérer de l'espace
  const widthRatios: Record<Breakpoint, number> = {
    xs: 0.55,   // ✅ Très petits écrans : 55% (était 75%) - Réduit pour libérer espace
    sm: 0.65,   // ✅ Petits écrans : 65% (était 70%) - Légèrement réduit
    md: 0.65,   // Écrans moyens : 65%
    lg: 0.60,   // Grands écrans : 60%
    xl: 0.50,   // Très grands écrans : 50%
    xxl: 0.45,  // Écrans extra larges : 45%
  };
  
  // Ratios de hauteur optimisés
  // ✅ CORRECTION : Réduire sur petits écrans pour ne pas cacher le contenu
  const heightRatios: Record<Breakpoint, number> = {
    xs: 0.30,   // ✅ Très petits écrans : 30% (était 45%) - Réduit significativement
    sm: 0.35,   // ✅ Petits écrans : 35% (était 40%) - Réduit
    md: 0.38,   // Écrans moyens : 38%
    lg: 0.35,   // Grands écrans : 35%
    xl: 0.35,   // Très grands écrans : 35%
    xxl: 0.30,  // Écrans extra larges : 30%
  };
  
  // Largeurs maximales pour éviter que le personnage soit trop grand
  // ✅ CORRECTION : Réduire les maxWidths sur petits écrans
  const maxWidths: Record<Breakpoint, number> = {
    xs: 200,    // ✅ Très petits écrans : 200px (était 280px) - Réduit
    sm: 260,    // ✅ Petits écrans : 260px (était 300px) - Réduit
    md: 320,   // Écrans moyens : 320px
    lg: 350,   // Grands écrans : 350px
    xl: 400,   // Très grands écrans : 400px
    xxl: 450,  // Écrans extra larges : 450px
  };
  
  // Hauteurs maximales
  // ✅ CORRECTION : Réduire les maxHeights sur petits écrans
  const maxHeights: Record<Breakpoint, number> = {
    xs: 220,    // ✅ Très petits écrans : 220px (était 350px) - Réduit significativement
    sm: 280,    // ✅ Petits écrans : 280px (était 400px) - Réduit
    md: 450,   // Écrans moyens : 450px
    lg: 480,   // Grands écrans : 480px
    xl: 500,   // Très grands écrans : 500px
    xxl: 550,  // Écrans extra larges : 550px
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
  // ✅ CORRECTION : Réduire le marginTop négatif sur petits écrans pour ne pas cacher le contenu
  const marginTopRatios: Record<Breakpoint, number> = {
    xs: -0.02,   // ✅ Très petits : -2% (était -8%) - Réduit pour ne pas descendre trop bas
    sm: -0.04,   // ✅ Petits écrans : -4% (était -9%) - Réduit
    md: -0.06,   // ✅ Écrans moyens : -6% (était -10%) - Réduit
    lg: -0.08,   // ✅ Grands écrans : -8% (était -11%) - Réduit
    xl: -0.08,   // Très grands écrans : -8%
    xxl: -0.07,  // Écrans extra larges : -7%
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
  // ✅ CORRECTION : Réduire le bottom sur petits écrans pour que la carte monte plus haut
  const bottomRatios: Record<Breakpoint, number> = {
    xs: 0.02,   // ✅ Très petits : 2% (était 8%) - Réduit pour monter la carte
    sm: 0.03,   // ✅ Petits écrans : 3% (était 6%) - Réduit
    md: 0.04,   // ✅ Écrans moyens : 4% (était 5%) - Légèrement réduit
    lg: 0.05,   // Grands écrans : 5%
    xl: 0.05,   // Très grands écrans : 5%
    xxl: 0.04,  // Écrans extra larges : 4%
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
  // ✅ CORRECTION : Augmenter la hauteur des cartes sur petits écrans pour afficher plus de contenu
  const cardHeightRatios: Record<Breakpoint, { back: number; middle: number; white: number }> = {
    xs: { back: 0.65, middle: 0.63, white: 0.61 },  // ✅ Très petits écrans : 61% (était 51%) - Augmenté
    sm: { back: 0.60, middle: 0.58, white: 0.56 },  // ✅ Petits écrans : 56% (était 48%) - Augmenté
    md: { back: 0.55, middle: 0.53, white: 0.51 },  // ✅ Écrans moyens : 51% (était 46%) - Augmenté
    lg: { back: 0.50, middle: 0.48, white: 0.46 },  // Grands écrans : 46%
    xl: { back: 0.50, middle: 0.48, white: 0.46 },  // Très grands écrans : 46%
    xxl: { back: 0.48, middle: 0.46, white: 0.44 }, // Écrans extra larges : 44%
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
    sm: 1.1,   // Petits écrans : +10%
    md: 1.2,   // Écrans moyens : +20%
    lg: 1.3,   // Grands écrans : +30%
    xl: 1.5,   // Très grands écrans : +50%
    xxl: 1.6,  // Écrans extra larges : +60%
  };
  
  return paddingTopMultipliers[breakpoint];
};





