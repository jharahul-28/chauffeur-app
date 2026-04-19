import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { fetchChauffeurProfile, ChauffeurProfile } from '../../../src/services/profileService';
import AppHeader from '@/src/components/AppHeader';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ChauffeurProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChauffeurProfile()
      .then(setProfile)
      .catch((err) => console.warn('[ProfileScreen] Failed to load profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : '—';
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '—';

  return (
    <View style={styles.container}>
      {/* Standardised header — VELVET centre, hamburger right */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            {isLoading
              ? <ActivityIndicator color="#EDB96D" />
              : <Text style={styles.avatarLargeText}>{initials}</Text>
            }
          </View>
          <Text style={styles.driverName}>{isLoading ? '—' : fullName}</Text>
          <Text style={styles.driverSubtext}>Chauffeur Partner</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {isLoading ? '—' : (profile?.rating?.toFixed(1) ?? '—')}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {isLoading ? '—' : (profile?.numberOfRides ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
        </View>

        {/* Details */}
        {!isLoading && profile && (
          <View style={styles.detailsCard}>
            <DetailRow label="Phone" value={profile.phone} />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Gender" value={profile.gender} />
            <DetailRow label="Date of Birth" value={profile.dateOfBirth} isLast />
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(237, 185, 109, 0.35)',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#EDB96D',
    fontSize: 28,
    fontWeight: '700',
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverSubtext: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2C2C2E',
    alignSelf: 'stretch',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
