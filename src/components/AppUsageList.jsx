import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CATEGORY_COLORS = {
  Work: { bg: '#DBEAFE', text: '#1E40AF', bar: '#3B82F6' },
  Social: { bg: '#FEE2E2', text: '#991B1B', bar: '#EF4444' },
  Entertainment: { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' },
  Browsing: { bg: '#E0E7FF', text: '#3730A3', bar: '#6366F1' },
  Other: { bg: '#F1F5F9', text: '#475569', bar: '#94A3B8' },
};

export default function AppUsageList({ appUsage = [], emptyMessage = 'No app usage recorded yet.' }) {
  if (!appUsage || appUsage.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📱</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          App activity during the shift will appear here with detailed time duration.
        </Text>
      </View>
    );
  }

  // Find max time for relative progress bar calculation if percentages are small
  const maxTime = Math.max(...appUsage.map(a => a.totalTimeForegroundMs || 0), 1);

  return (
    <View style={styles.list}>
      {appUsage.map((app, index) => {
        const cat = CATEGORY_COLORS[app.category] || CATEGORY_COLORS.Other;
        const barWidth = Math.max(Math.round(((app.totalTimeForegroundMs || 0) / maxTime) * 100), 4);

        return (
          <View key={app.packageName + index} style={styles.appCard}>
            <View style={styles.cardHeader}>
              <View style={styles.appTitleContainer}>
                <View style={[styles.avatarCircle, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.avatarLetter, { color: cat.text }]}>
                    {(app.appName || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.appNameBox}>
                  <Text style={styles.appName} numberOfLines={1}>
                    {app.appName}
                  </Text>
                  <Text style={styles.packageName} numberOfLines={1}>
                    {app.packageName}
                  </Text>
                </View>
              </View>

              <View style={styles.rightStats}>
                <Text style={styles.durationText}>{app.formattedDuration}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.categoryText, { color: cat.text }]}>{app.category}</Text>
                </View>
              </View>
            </View>

            {/* Visual progress bar showing relative time spent */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: cat.bar,
                  },
                ]}
              />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.percentText}>
                {app.percent > 0 ? `${app.percent}% of active shift` : 'Just opened'}
              </Text>
              {app.isSystemApp && (
                <Text style={styles.systemTag}>System Service</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  appNameBox: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  packageName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rightStats: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  percentText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  systemTag: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
