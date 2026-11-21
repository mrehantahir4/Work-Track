import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Header from '../components/Header';
import ShiftCard from '../components/ShiftCard';
import KeyboardAwareContainer from '../components/KeyboardAwareContainer';
import StorageService from '../services/storageService';

export default function AdminDashboardScreen({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilterEmpId, setSelectedFilterEmpId] = useState('ALL');
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'employees'

  // Modal State for Creating Employee
  const [modalVisible, setModalVisible] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [submittingEmp, setSubmittingEmp] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const emps = await StorageService.getEmployees();
      setEmployees(emps);

      const shifts = await StorageService.getAllShifts();
      setAllShifts(shifts);

      // Check which employees currently have active shifts
      const activeList = [];
      for (const emp of emps) {
        const active = await StorageService.getActiveShift(emp.id);
        if (active) {
          activeList.push(active);
        }
      }
      setActiveShifts(activeList);
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
  };

  const handleCreateEmployee = async () => {
    if (!newEmpName.trim()) {
      setFormError('Please enter the employee full name.');
      return;
    }
    if (!newEmpEmail.trim()) {
      setFormError('Please enter a valid work email.');
      return;
    }
    if (!newEmpPassword.trim() || newEmpPassword.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    setSubmittingEmp(true);
    setFormError('');

    try {
      const created = await StorageService.createEmployee({
        name: newEmpName,
        email: newEmpEmail,
        password: newEmpPassword,
        department: newEmpDept || 'Operations',
        phone: newEmpPhone,
      });

      setSubmittingEmp(false);
      setModalVisible(false);
      // Reset form
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpPassword('');
      setNewEmpDept('');
      setNewEmpPhone('');

      Alert.alert(
        'Employee Created Successfully',
        `Account created for ${created.name} (${created.email}).\nThey can now log into WorkTrack.`
      );
      await loadAdminData();
    } catch (err) {
      setSubmittingEmp(false);
      setFormError(err.message || 'Could not create employee account.');
    }
  };

  const handleDeleteEmployee = emp => {
    Alert.alert(
      'Remove Employee',
      `Are you sure you want to delete ${emp.name}? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteEmployee(emp.id);
            await loadAdminData();
          },
        },
      ]
    );
  };

  const filteredShifts =
    selectedFilterEmpId === 'ALL'
      ? allShifts
      : allShifts.filter(s => s.employeeId === selectedFilterEmpId);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Admin Control Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        user={user}
        onLogout={onLogout}
        title="Admin Control Center"
        subtitle="Employee & Shift Monitoring"
      />

      {/* Quick Stats Counter Row */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{employees.length}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, styles.activeStatNumber]}>{activeShifts.length}</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{allShifts.length}</Text>
          <Text style={styles.statLabel}>Total Shifts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'shifts' && styles.tabItemActive]}
          onPress={() => setActiveTab('shifts')}
        >
          <Text style={[styles.tabText, activeTab === 'shifts' && styles.tabTextActive]}>
            📊 Shift & App Reports ({allShifts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'employees' && styles.tabItemActive]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={[styles.tabText, activeTab === 'employees' && styles.tabTextActive]}>
            👥 Manage Employees ({employees.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'shifts' ? (
          <View>
            {/* Filter by Employee */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by Employee:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedFilterEmpId === 'ALL' && styles.filterChipActive]}
                  onPress={() => setSelectedFilterEmpId('ALL')}
                >
                  <Text
                    style={[styles.filterChipText, selectedFilterEmpId === 'ALL' && styles.filterChipTextActive]}
                  >
                    All Staff
                  </Text>
                </TouchableOpacity>

                {employees.map(emp => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[styles.filterChip, selectedFilterEmpId === emp.id && styles.filterChipActive]}
                    onPress={() => setSelectedFilterEmpId(emp.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedFilterEmpId === emp.id && styles.filterChipTextActive,
                      ]}
                    >
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Currently Active Shifts (if any) */}
            {activeShifts.length > 0 && selectedFilterEmpId === 'ALL' && (
              <View style={styles.activeSection}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.livePulse} />
                  <Text style={styles.activeSectionTitle}>Currently On Duty ({activeShifts.length})</Text>
                </View>
                {activeShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} showEmployeeInfo={true} />
                ))}
              </View>
            )}

            {/* Shift History & App Usage List */}
            <View style={styles.historySection}>
              <Text style={styles.sectionHeader}>
                {selectedFilterEmpId === 'ALL'
                  ? 'All Completed Shifts & App Usage Details'
                  : 'Employee Shift & App Tracking History'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Tap any shift below to inspect exact apps used during their shift duration.
              </Text>

              {filteredShifts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyTitle}>No shifts recorded</Text>
                  <Text style={styles.emptySubtitle}>
                    When employees check in and check out, their full reports and phone app logs will appear here.
                  </Text>
                </View>
              ) : (
                filteredShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} showEmployeeInfo={true} />
                ))
              )}
            </View>
          </View>
        ) : (
          /* Manage Employees Tab */
          <View>
            <View style={styles.employeeHeaderRow}>
              <View>
                <Text style={styles.sectionHeader}>Staff Directory</Text>
                <Text style={styles.sectionSubtitle}>
                  Create login credentials for new team members.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addEmpBtn}
                onPress={() => {
                  setFormError('');
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addEmpBtnText}>+ Add Employee</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.empList}>
              {employees.map(emp => {
                const isWorking = activeShifts.some(a => a.employeeId === emp.id);
                return (
                  <View key={emp.id} style={styles.empCard}>
                    <View style={styles.empCardTop}>
                      <View style={styles.empAvatar}>
                        <Text style={styles.empAvatarText}>
                          {emp.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.empInfo}>
                        <Text style={styles.empName}>{emp.name}</Text>
                        <Text style={styles.empEmail}>{emp.email}</Text>
                        <Text style={styles.empDept}>
                          🏢 {emp.department} {emp.phone ? `• 📞 ${emp.phone}` : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteEmpBtn}
                        onPress={() => handleDeleteEmployee(emp)}
                      >
                        <Text style={styles.deleteEmpText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.empCardBottom}>
                      <View
                        style={[
                          styles.shiftStatusPill,
                          isWorking ? styles.shiftStatusPillActive : styles.shiftStatusPillOff,
                        ]}
                      >
                        <Text
                          style={[
                            styles.shiftStatusPillText,
                            isWorking ? styles.shiftStatusTextActive : styles.shiftStatusTextOff,
                          ]}
                        >
                          {isWorking ? '● Working Now' : '○ Off Duty'}
                        </Text>
                      </View>
                      <Text style={styles.empPasswordHint}>
                        Login Pass: <Text style={styles.passwordBold}>{emp.password}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal: Create New Employee (Keyboard-Aware) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Employee Account</Text>
                <Text style={styles.modalSubtitle}>
                  Set up employee login credentials for mobile app access
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* KeyboardAwareContainer inside modal ensures inputs & button never hide */}
            <KeyboardAwareContainer contentContainerStyle={styles.modalScrollContent}>
              {formError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {formError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Employee Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Hamza Tariq"
                  placeholderTextColor="#94A3B8"
                  value={newEmpName}
                  onChangeText={setNewEmpName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Work Email (Login ID) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. hamza@worktrack.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={newEmpEmail}
                  onChangeText={setNewEmpEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. pass1234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  value={newEmpPassword}
                  onChangeText={setNewEmpPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department / Role</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Sales, Support, Operations"
                  placeholderTextColor="#94A3B8"
                  value={newEmpDept}
                  onChangeText={setNewEmpDept}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. +92 300 0000000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={newEmpPhone}
                  onChangeText={setNewEmpPhone}
                />
              </View>

              <TouchableOpacity
                style={[styles.createAccountBtn, submittingEmp && styles.btnDisabled]}
                onPress={handleCreateEmployee}
                disabled={submittingEmp}
                activeOpacity={0.8}
              >
                {submittingEmp ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.createAccountBtnText}>Create Employee Account</Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareContainer>
          </View>
        </View>
      </Modal>
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeStatNumber: {
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '70%',
    alignSelf: 'center',
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
    paddingBottom: 36,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  activeSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  activeSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  historySection: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  employeeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addEmpBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  empList: {
    gap: 12,
  },
  empCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  empCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  empAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  empEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  empDept: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
  },
  deleteEmpBtn: {
    padding: 8,
  },
  deleteEmpText: {
    fontSize: 16,
  },
  empCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shiftStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  shiftStatusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  shiftStatusPillOff: {
    backgroundColor: '#F1F5F9',
  },
  shiftStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shiftStatusTextActive: {
    color: '#16A34A',
  },
  shiftStatusTextOff: {
    color: '#64748B',
  },
  empPasswordHint: {
    fontSize: 11,
    color: '#64748B',
  },
  passwordBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  modalScrollContent: {
    padding: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  createAccountBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  createAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
