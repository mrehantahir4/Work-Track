import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CURRENT_USER: '@worktrack_current_user',
  USERS: '@worktrack_users',
  SHIFTS: '@worktrack_shifts',
  ACTIVE_SHIFT_PREFIX: '@worktrack_active_shift_',
};

const DEFAULT_USERS = [
  {
    id: 'admin_1',
    name: 'Admin Manager',
    email: 'admin@worktrack.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
  },
  {
    id: 'emp_1',
    name: 'Ali Ahmed',
    email: 'ali@worktrack.com',
    password: 'ali123',
    role: 'employee',
    department: 'Customer Support',
    phone: '+92 300 1234567',
  },
  {
    id: 'emp_2',
    name: 'Usman Khan',
    email: 'usman@worktrack.com',
    password: 'usman123',
    role: 'employee',
    department: 'Sales & Operations',
    phone: '+92 301 7654321',
  },
];

class StorageService {
  async initDefaults() {
    try {
      const existingUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!existingUsers) {
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
    } catch (e) {
      console.error('Failed to init default storage data', e);
    }
  }

  // Auth & Session
  async getCurrentUser() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      return null;
    }
  }

  async setCurrentUser(user) {
    try {
      if (!user) {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Error saving current user', e);
    }
  }

  async login(email, password) {
    await this.initDefaults();
    const users = await this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );
    if (!user) {
      throw new Error('Invalid email or password. Contact Admin if you do not have an account.');
    }
    await this.setCurrentUser(user);
    return user;
  }

  async logout() {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Users / Employees management
  async getUsers() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return json ? JSON.parse(json) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }

  async getEmployees() {
    const users = await this.getUsers();
    return users.filter(u => u.role === 'employee');
  }

  async createEmployee(employeeData) {
    const users = await this.getUsers();
    const cleanEmail = employeeData.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists!');
    }

    const newEmployee = {
      id: `emp_${Date.now()}`,
      name: employeeData.name.trim(),
      email: cleanEmail,
      password: employeeData.password,
      department: employeeData.department || 'General',
      phone: employeeData.phone || '',
      role: 'employee',
      createdAt: Date.now(),
    };

    const updated = [...users, newEmployee];
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return newEmployee;
  }

  async deleteEmployee(employeeId) {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== employeeId);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  }

  // Shifts management
  async getActiveShift(employeeId) {
    try {
      const json = await AsyncStorage.getItem(`${STORAGE_KEYS.ACTIVE_SHIFT_PREFIX}${employeeId}`);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      return null;
    }
  }

  async startShift(employee) {
    const active = await this.getActiveShift(employee.id);
    if (active) {
      return active;
    }

    const newShift = {
      id: `shift_${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department || 'General',
      checkInTime: Date.now(),
      checkOutTime: null,
      status: 'active',
      appUsage: [],
    };

    await AsyncStorage.setItem(
      `${STORAGE_KEYS.ACTIVE_SHIFT_PREFIX}${employee.id}`,
      JSON.stringify(newShift)
    );
    return newShift;
  }

  async endShift(employeeId, appUsage = []) {
    const active = await this.getActiveShift(employeeId);
    if (!active) {
      throw new Error('No active shift found to check out from.');
    }

    const checkOutTime = Date.now();
    const totalDurationMs = checkOutTime - active.checkInTime;

    const completedShift = {
      ...active,
      checkOutTime,
      totalDurationMs,
      status: 'completed',
      appUsage: appUsage || [],
    };

    // Remove active shift
    await AsyncStorage.removeItem(`${STORAGE_KEYS.ACTIVE_SHIFT_PREFIX}${employeeId}`);

    // Append to shifts history
    const allShifts = await this.getAllShifts();
    const updated = [completedShift, ...allShifts];
    await AsyncStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));

    return completedShift;
  }

  async getAllShifts() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SHIFTS);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      return [];
    }
  }

  async getShiftsByEmployee(employeeId) {
    const all = await this.getAllShifts();
    return all.filter(s => s.employeeId === employeeId);
  }

  async clearAllData() {
    await AsyncStorage.clear();
    await this.initDefaults();
  }
}

export default new StorageService();
