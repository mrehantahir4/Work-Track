import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppUsageList from './AppUsageList';

export default function ShiftCard({ shift, showEmployeeInfo = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = timestamp => {
    if (!timestamp) return 'In Progress';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTotalDuration = ms => {
    if (!ms) return 'Active now';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} mins`;
    return `${hours} hrs ${minutes} mins`;
  };

  const isActive = shift.status === 'active';
  const appsCount = shift.appUsage ? shift.appUsage.length : 0;

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{formatDate(shift.checkInTime)}</Text>
          {showEmployeeInfo && (
            <Text style={styles.employeeName} numberOfLines={1}>
              👤 {shift.employeeName} ({shift.department})
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.completedBadge]}>
          <View style={[styles.statusDot, isActive ? styles.activeDot : styles.completedDot]} />
          <Text style={[styles.statusText, isActive ? styles.activeStatusText : styles.completedStatusText]}>
            {isActive ? 'CURRENT SHIFT' : 'COMPLETED'}
          </Text>
        </View>
      </View>

      {/* Time & Availability Details */}
      <View style={styles.timeGrid}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-In Time</Text>
          <Text style={styles.timeValue}>{formatTime(shift.checkInTime)}</Text>
        </View>

        <View style={styles.arrowBlock}>
          <Text style={styles.arrowText}>➔</Text>
        </View>

        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-Out Time</Text>
          <Text style={styles.timeValue}>{formatTime(shift.checkOutTime)}</Text>
        </View>

        <View style={styles.durationBlock}>
          <Text style={styles.timeLabel}>Total Duration</Text>
          <Text style={styles.durationValue}>
            {isActive ? 'Tracking...' : formatTotalDuration(shift.totalDurationMs)}
          </Text>
        </View>
      </View>

      {/* Expand / Collapse Button for App Usage */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleBtnText}>
          {isExpanded
            ? '▲ Hide App Tracking Details'
            : `▼ View Apps Used During Shift (${appsCount} apps)`}
        </Text>
      </TouchableOpacity>

      {/* App Breakdown List when expanded */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.breakdownHeader}>Phone App Usage Breakdown:</Text>
          <AppUsageList
            appUsage={shift.appUsage || []}
            emptyMessage="No foreground apps were recorded during this shift."
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeeName: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  completedBadge: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  activeDot: {
    backgroundColor: '#10B981',
  },
  completedDot: {
    backgroundColor: '#64748B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeStatusText: {
    color: '#065F46',
  },
  completedStatusText: {
    color: '#475569',
  },
  timeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  timeBlock: {
    flex: 1,
  },
  arrowBlock: {
    paddingHorizontal: 4,
  },
  arrowText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  durationBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  durationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  toggleBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  breakdownHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
});
