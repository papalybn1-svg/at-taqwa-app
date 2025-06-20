import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import colors from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
}); 