import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import KeyboardAwareContainer from '../components/KeyboardAwareContainer';
import StorageService from '../services/storageService';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (customEmail, customPass) => {
    const targetEmail = customEmail !== undefined ? customEmail : email;
    const targetPassword = customPass !== undefined ? customPass : password;

    if (!targetEmail.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    if (!targetPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const user = await StorageService.login(targetEmail, targetPassword);
      setLoading(false);
      onLoginSuccess(user);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const fillQuickCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <KeyboardAwareContainer contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Branding & Header */}
        <View style={styles.brandingBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⏱️</Text>
          </View>
          <Text style={styles.title}>WorkTrack</Text>
          <Text style={styles.subtitle}>Shift & Phone App Usage Monitoring</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In to Account</Text>
          <Text style={styles.cardSubtitle}>
            Employee accounts are issued and managed by Admin
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Work Email</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. ali@worktrack.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.inputLabel}>Password</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={t => {
                  setPassword(t);
                  if (errorMessage) setErrorMessage('');
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Notice info */}
          <View style={styles.infoNotice}>
            <Text style={styles.infoNoticeText}>
              ℹ️ Only login is allowed for employees. New accounts are provisioned via Admin Panel.
            </Text>
          </View>
        </View>

        {/* Quick Demo Switcher for Evaluation */}
        <View style={styles.demoSection}>
          <Text style={styles.demoHeading}>Quick Test Credentials:</Text>
          <View style={styles.demoChipsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillQuickCredentials('ali@worktrack.com', 'ali123')}
            >
              <Text style={styles.demoChipTitle}>Ali Ahmed</Text>
              <Text style={styles.demoChipSub}>Employee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillQuickCredentials('usman@worktrack.com', 'usman123')}
            >
              <Text style={styles.demoChipTitle}>Usman Khan</Text>
              <Text style={styles.demoChipSub}>Employee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, styles.adminDemoChip]}
              onPress={() => fillQuickCredentials('admin@worktrack.com', 'admin123')}
            >
              <Text style={[styles.demoChipTitle, styles.adminChipText]}>Admin</Text>
              <Text style={styles.demoChipSub}>Management</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAwareContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  brandingBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  eyeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoNotice: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoNoticeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    textAlign: 'center',
  },
  demoSection: {
    marginTop: 22,
    alignItems: 'center',
  },
  demoHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  adminDemoChip: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  demoChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  adminChipText: {
    color: '#1D4ED8',
  },
  demoChipSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
});
