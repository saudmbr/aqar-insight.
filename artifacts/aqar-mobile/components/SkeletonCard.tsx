import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.line} />
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '50%', marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 130, backgroundColor: Colors.skeleton },
  content: { padding: 10, gap: 6 },
  line: { height: 10, borderRadius: 5, backgroundColor: Colors.skeleton },
});
