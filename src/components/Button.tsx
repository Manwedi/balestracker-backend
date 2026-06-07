import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export function Button({ title, variant = 'primary', isLoading, style, ...props }: ButtonProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary': return '#f1f3f5';
      case 'danger': return '#e74c3c';
      case 'outline': return 'transparent';
      case 'primary':
      default: return '#4a90e2';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary': return '#333';
      case 'outline': return '#4a90e2';
      default: return '#fff';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        props.disabled && styles.disabled,
        style
      ]} 
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  disabled: {
    opacity: 0.6,
  }
});
