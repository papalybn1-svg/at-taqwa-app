import { TextStyle } from 'react-native';

export const typography = {
  // Titres principaux
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  } as TextStyle,
  
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  } as TextStyle,
  
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  } as TextStyle,
  
  // Sous-titres
  subtitle1: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,
  
  subtitle2: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  
  // Corps de texte
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  } as TextStyle,
  
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  } as TextStyle,
  
  // Texte de petite taille
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  } as TextStyle,
  
  // Boutons
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,
  
  // Overline (pour les catégories)
  overline: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as TextStyle,
}; 