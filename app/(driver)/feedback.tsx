import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RatingStars from '../../src/components/RatingStars';
import { FeedbackPayload } from '../../src/types/feedback';

// ─── Screen params ────────────────────────────────────────────────────────────

interface FeedbackParams {
  rideId?: string;
  riderName?: string;
}

// ─── Mock submit ──────────────────────────────────────────────────────────────

async function mockSubmitFeedback(payload: FeedbackPayload): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  console.log('[Feedback] Submitted:', payload);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    rideId = 'ride-unknown',
    riderName = 'Rider',
  } = useLocalSearchParams<FeedbackParams>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const initials = getInitials(riderName);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await mockSubmitFeedback({ rideId, rating, comment: comment.trim() || undefined });
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, rideId]);

  const handleBackToHome = useCallback(() => {
    router.replace('/(driver)/(tabs)/bookings');
  }, [router]);

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={[styles.root, styles.centeredRoot, { paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#30D158" />
        </View>
        <Text style={styles.successTitle}>Thank you!</Text>
        <Text style={styles.successBody}>Your feedback has been submitted successfully.</Text>
        <Pressable onPress={handleBackToHome} style={styles.backButtonWrapper}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Back to Home</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  // ── Main feedback form ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Text style={styles.screenTitle}>Feedback</Text>

        {/* ── Avatar + Name ──────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.riderName}>{riderName}</Text>
          <Text style={styles.questionText}>How was your Customer?</Text>
        </View>

        {/* ── Star Rating ────────────────────────────────────────────────── */}
        <View style={styles.ratingSection}>
          <RatingStars rating={rating} onRate={setRating} size={42} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
            </Text>
          )}
        </View>

        {/* ── Comment Input ──────────────────────────────────────────────── */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Additional Comments (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your experience…"
            placeholderTextColor="#4A4A4E"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* ── Submit Button ──────────────────────────────────────────────── */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.backButtonWrapper}
        >
          <LinearGradient
            colors={submitting ? ['#5A4520', '#3D2E18'] : ['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* ── Skip link ─────────────────────────────────────────────────── */}
        <Pressable onPress={handleBackToHome} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
  },
  centeredRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scroll: {
    paddingHorizontal: 24,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
    letterSpacing: 0.2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(237, 185, 109, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#EDB96D',
    fontSize: 28,
    fontWeight: '700',
  },
  riderName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  questionText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  ratingLabel: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputSection: {
    marginBottom: 24,
    gap: 8,
  },
  inputLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  backButtonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  ctaButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  successBody: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
});
