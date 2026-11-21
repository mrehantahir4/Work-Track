import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Header from '../components/Header';
import ShiftCard from '../components/ShiftCard';
import AppUsageList from '../components/AppUsageList';
import KeyboardAwareContainer from '../components/KeyboardAwareContainer';
import StorageService from '../services/storageService';
import AppUsageService from '../services/appUsageService';

export default function EmployeeDashboardScreen({ user, onLogout }) {
  const [activeShift, setActiveShift] = useState(null);
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentUsagePreview, setCurrentUsagePreview] = useState([]);
  const [activeTab, setActiveTab] = useState('shift'); // 'shift' | 'history'

  const timerRef = useRef(null);

  useEffect(() => {
    loadData();
    checkUsagePermission();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Live timer for active shift
  useEffect(() => {
    if (activeShift && activeShift.checkInTime) {
      const updateTimer = () => {
        const diff = Math.floor((Date.now() - activeShift.checkInTime) / 1000);
        setElapsedSeconds(Math.max(diff, 0));
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeShift]);

  const checkUsagePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await AppUsageService.hasPermission();
      setHasPermission(granted);
    }
  };

  const handleRequestPermission = async () => {
    await AppUsageService.requestPermission();
    // Re-check after returning from settings
    setTimeout(async () => {
      const granted = await AppUsageService.hasPermission();
      setHasPermission(granted);
    }, 1500);
  };

  const loadData = async () => {
    try {
      const shift = await StorageService.getActiveShift(user.id);
      setActiveShift(shift);

      const history = await StorageService.getShiftsByEmployee(user.id);
      setShiftsHistory(history);

      if (shift) {
        // Fetch real-time preview of apps tracked so far in active shift
        loadLiveUsage(shift.checkInTime);
      }
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLiveUsage = async checkInTime => {
    try {
      const usage = await AppUsageService.getUsageStats(checkInTime, Date.now());
      setCurrentUsagePreview(usage);
    } catch (e) {
      console.warn('Failed to get live usage preview', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkUsagePermission();
    await loadData();
  };

  // Check In Handler
  const handleCheckIn = async () => {
    if (Platform.OS === 'android' && !hasPermission) {
      Alert.alert(
        'Usage Permission Required',
        'Android requires "Usage Access" to accurately monitor apps used during your shift. Please allow access in settings to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: handleRequestPermission },
        ]
      );
      return;
    }

    setActionLoading(true);
    try {
      const newShift = await StorageService.startShift(user);
      setActiveShift(newShift);
      await loadLiveUsage(newShift.checkInTime);
      Alert.alert('Shift Started', 'You are now checked in! App tracking is active for your shift.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not start shift');
    } finally {
      setActionLoading(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = () => {
    Alert.alert(
      'Confirm Check-Out',
      'Are you sure you want to end your shift? App usage statistics will be recorded and submitted to Admin.',
      [
        { text: 'Stay Checked In', style: 'cancel' },
        {
          text: 'Check-Out Now',
          style: 'destructive',
          onPress: performCheckOut,
        },
      ]
    );
  };

  const performCheckOut = async () => {
    setActionLoading(true);
    try {
      // 1. Gather all phone app usage stats between check-in and now
      const appUsage = await AppUsageService.getUsageStats(activeShift.checkInTime, Date.now());

      // 2. Complete the shift and persist
      const completedShift = await StorageService.endShift(user.id, appUsage);

      setActiveShift(null);
      setCurrentUsagePreview([]);
      setShiftsHistory(prev => [completedShift, ...prev]);

      Alert.alert(
        'Shift Completed Successfully',
        `Check-out recorded at ${new Date(completedShift.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total apps tracked: ${appUsage.length}`
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not complete check-out');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = totalSec => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = n => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading shift information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        user={user}
        onLogout={onLogout}
        title={user.name}
        subtitle={user.department}
      />

      {/* Permission Warning Banner (if not granted on Android) */}
      {!hasPermission && (
        <TouchableOpacity
          style={styles.permissionBanner}
          onPress={handleRequestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>App Usage Tracking Disabled</Text>
            <Text style={styles.warningSubtitle}>
              Tap here to grant "Usage Access" in Android Settings so your shift apps can be tracked.
            </Text>
          </View>
          <Text style={styles.grantBtnText}>Enable ➔</Text>
        </TouchableOpacity>
      )}

      {/* Tabs Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'shift' && styles.tabItemActive]}
          onPress={() => setActiveTab('shift')}
        >
          <Text style={[styles.tabText, activeTab === 'shift' && styles.tabTextActive]}>
            ⚡ Active Shift
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📋 Shift History ({shiftsHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'shift' ? (
          <View>
            {/* Shift Main Control Card */}
            <View style={styles.shiftCard}>
              <View style={styles.shiftCardHeader}>
                <View>
                  <Text style={styles.cardSectionTitle}>Shift Availability</Text>
                  <Text style={styles.cardSectionSubtitle}>
                    {activeShift ? 'Currently Active & Tracking' : 'You are currently off duty'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    activeShift ? styles.statusPillActive : styles.statusPillOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      activeShift ? styles.statusPillTextActive : styles.statusPillTextOff,
                    ]}
                  >
                    {activeShift ? 'ON DUTY' : 'OFF DUTY'}
                  </Text>
                </View>
              </View>

              {activeShift ? (
                <View style={styles.activeShiftDetails}>
                  {/* Digital Clock Timer */}
                  <View style={styles.timerDisplay}>
                    <Text style={styles.timerLabel}>ACTIVE TIME ELAPSED</Text>
                    <Text style={styles.timerDigits}>{formatTimer(elapsedSeconds)}</Text>
                    <Text style={styles.checkInTimeText}>
                      Checked In at{' '}
                      {new Date(activeShift.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* Check-Out Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.checkOutBtn, actionLoading && styles.btnDisabled]}
                    onPress={handleCheckOut}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.actionBtnIcon}>🛑</Text>
                        <View>
                          <Text style={styles.actionBtnTitle}>CHECK OUT</Text>
                          <Text style={styles.actionBtnSubtitle}>End shift & save app usage report</Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.offDutyDetails}>
                  <Text style={styles.offDutyPrompt}>
                    Start your shift to begin tracking your working hours and phone app usage breakdown.
                  </Text>

                  {/* Check-In Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.checkInBtn, actionLoading && styles.btnDisabled]}
                    onPress={handleCheckIn}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.actionBtnIcon}>🟢</Text>
                        <View>
                          <Text style={styles.actionBtnTitle}>CHECK IN</Text>
                          <Text style={styles.actionBtnSubtitle}>Start shift & tracking</Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Live App Usage Preview (if active) */}
            {activeShift && (
              <View style={styles.previewSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Live Apps Usage (Current Shift)</Text>
                  <TouchableOpacity
                    style={styles.refreshUsageBtn}
                    onPress={() => loadLiveUsage(activeShift.checkInTime)}
                  >
                    <Text style={styles.refreshUsageText}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtext}>
                  Shows apps opened and time spent since check-in ({new Date(activeShift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </Text>

                <AppUsageList
                  appUsage={currentUsagePreview}
                  emptyMessage="Tracking started. Open any app on your phone and its usage time will appear here."
                />
              </View>
            )}

            {/* Recent Completed Shifts Summary */}
            <View style={styles.historyPreviewSection}>
              <Text style={styles.sectionHeader}>Recent Shift Reports</Text>
              {shiftsHistory.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Text style={styles.emptyHistoryText}>No completed shifts yet.</Text>
                </View>
              ) : (
                shiftsHistory.slice(0, 3).map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))
              )}
            </View>
          </View>
        ) : (
          /* Full Shift History Tab */
          <View>
            <Text style={styles.sectionHeader}>All Past Shifts & App Breakdown</Text>
            <Text style={styles.sectionSubtext}>
              Detailed logs of your working hours and phone apps used in each shift.
            </Text>

            {shiftsHistory.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Text style={styles.emptyHistoryIcon}>📅</Text>
                <Text style={styles.emptyHistoryText}>No past shift records found.</Text>
                <Text style={styles.emptyHistorySub}>
                  When you check out from a shift, your full report will appear here.
                </Text>
              </View>
            ) : (
              shiftsHistory.map(shift => (
                <ShiftCard key={shift.id} shift={shift} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  permissionBanner: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  grantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillOff: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#15803D',
  },
  statusPillTextOff: {
    color: '#64748B',
  },
  timerDisplay: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  timerDigits: {
    fontSize: 38,
    fontWeight: '800',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  checkInTimeText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 6,
  },
  offDutyPrompt: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkInBtn: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  checkOutBtn: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  actionBtnTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionBtnSubtitle: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.85,
    marginTop: 1,
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshUsageBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  refreshUsageText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 12,
  },
  historyPreviewSection: {
    marginTop: 8,
  },
  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyHistoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  emptyHistorySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
