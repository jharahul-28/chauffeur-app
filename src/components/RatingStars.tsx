import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RatingStarsProps {
  rating: number;       // current rating 0–5
  onRate: (star: number) => void;
  size?: number;
  color?: string;
  emptyColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const RatingStars = memo(function RatingStars({
  rating,
  onRate,
  size = 38,
  color = '#EDB96D',
  emptyColor = '#3A3A3C',
}: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRate(star)}
          hitSlop={8}
          style={styles.starBtn}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? color : emptyColor}
          />
        </Pressable>
      ))}
    </View>
  );
});

export default RatingStars;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBtn: {
    padding: 2,
  },
});
