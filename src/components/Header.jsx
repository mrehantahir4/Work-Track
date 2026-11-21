import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Header({ user, onLogout, title, subtitle }) {
  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, isAdmin ? styles.adminAvatar : styles.employeeAvatar]}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.greeting} numberOfLines={1}>
            {title || `Welcome, ${user?.name || 'User'}`}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.employeeBadge]}>
              <Text style={[styles.roleText, isAdmin ? styles.adminRoleText : styles.employeeRoleText]}>
                {isAdmin ? 'ADMIN PANEL' : 'EMPLOYEE'}
              </Text>
            </View>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : user?.department ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                • {user.department}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminAvatar: {
    backgroundColor: '#3B82F6',
  },
  employeeAvatar: {
    backgroundColor: '#10B981',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  adminBadge: {
    backgroundColor: '#DBEAFE',
  },
  employeeBadge: {
    backgroundColor: '#D1FAE5',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adminRoleText: {
    color: '#1D4ED8',
  },
  employeeRoleText: {
    color: '#047857',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});
