import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface AppLogoProps {
  size?: number;
  boxed?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function AppLogo({ size = 72, boxed = true, style, imageStyle }: AppLogoProps) {
  const radius = Math.max(16, Math.round(size * 0.28));

  return (
    <View
      style={[
        boxed && styles.box,
        boxed && {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Image
        source={require('../assets/images/brand-logo.png')}
        style={[
          {
            width: boxed ? size * 0.78 : size,
            height: boxed ? size * 0.78 : size,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
