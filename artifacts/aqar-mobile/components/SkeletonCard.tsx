import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const FEATURED_WIDTH = width - 40;

interface Props {
  variant?: 'grid' | 'featured';
}

export function SkeletonCard({ variant = 'grid' }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  if (variant === 'featured') {
    return (
      <Animated.View style={[featStyles.card, { opacity }]}>
        <View style={featStyles.image} />
        <View style={featStyles.content}>
          <View style={featStyles.line} />
          <View style={[featStyles.line, { width: '60%' }]} />
          <View style={featStyles.chips}>
            <View style={featStyles.chip} />
            <View style={featStyles.chip} />
            <View style={featStyles.chip} />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[gridStyles.card, { opacity }]}>
      <View style={gridStyles.image} />
      <View style={gridStyles.content}>
        <View style={gridStyles.lineShort} />
        <View style={gridStyles.line} />
        <View style={[gridStyles.line, { width: '60%' }]} />
        <View style={gridStyles.chips}>
          <View style={gridStyles.chip} />
          <View style={gridStyles.chip} />
        </View>
      </View>
    </Animated.View>
  );
}

const gridStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, backgroundColor: Colors.card, borderRadius: 20, overflow: 'hidden' },
  image: { width: '100%', height: 155, backgroundColor: Colors.skeleton },
  content: { padding: 10, gap: 7 },
  lineShort: { height: 8, width: '40%', borderRadius: 4, backgroundColor: Colors.skeleton, alignSelf: 'flex-end' },
  line: { height: 10, borderRadius: 5, backgroundColor: Colors.skeleton, alignSelf: 'stretch' },
  chips: { flexDirection: 'row-reverse', gap: 6, marginTop: 2 },
  chip: { height: 22, width: 55, borderRadius: 7, backgroundColor: Colors.skeleton },
});

const featStyles = StyleSheet.create({
  card: { width: FEATURED_WIDTH, backgroundColor: Colors.card, borderRadius: 22, overflow: 'hidden', marginRight: 14 },
  image: { width: '100%', height: 200, backgroundColor: Colors.skeleton },
  content: { padding: 14, gap: 9 },
  line: { height: 11, borderRadius: 5, backgroundColor: Colors.skeleton },
  chips: { flexDirection: 'row-reverse', gap: 6, marginTop: 2 },
  chip: { height: 26, width: 70, borderRadius: 8, backgroundColor: Colors.skeleton },
});
