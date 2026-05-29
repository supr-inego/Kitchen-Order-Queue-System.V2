import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_ROOT_URL = API_BASE_URL.replace(/\/$/, '').endsWith('/api')
  ? API_BASE_URL.replace(/\/$/, '')
  : `${API_BASE_URL.replace(/\/$/, '')}/api`;

async function apiRequest(path, options = {}, retry = true) {
  const token = await AsyncStorage.getItem('access');
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ROOT_URL}${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.status === 401 && retry && !path.includes('/auth/')) {
    const refresh = await AsyncStorage.getItem('refresh');
    if (refresh) {
      const refreshResponse = await fetch(`${API_ROOT_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });
      const refreshText = await refreshResponse.text();
      const refreshData = refreshText ? JSON.parse(refreshText) : null;
      if (refreshResponse.ok && refreshData?.access) {
        await AsyncStorage.setItem('access', refreshData.access);
        return apiRequest(path, options, false);
      }
    }
    await AsyncStorage.multiRemove(['access', 'refresh']);
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || data?.message || 'Request failed');
  }

  return data;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!email || !password) {
      setError('Fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const tokens = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await AsyncStorage.multiSet([
        ['access', tokens.access],
        ['refresh', tokens.refresh],
      ]);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.authPanel}>
        <Text style={styles.logo}>KitchenPOS</Text>
        <Text style={styles.muted}>Unified mobile client</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#777"
          style={styles.input}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <TouchableOpacity disabled={loading} onPress={submit} style={styles.primaryButton}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DashboardScreen({ onLogout }) {
  const [tab, setTab] = useState('queue');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ticket, setTicket] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = useMemo(() => ['queue', 'menu', 'track'], []);

  async function loadData() {
    setLoading(true);
    try {
      const [nextProducts, nextOrders] = await Promise.all([
        apiRequest('/products/'),
        apiRequest('/orders/'),
      ]);
      setProducts(nextProducts);
      setOrders(nextOrders);
    } catch (err) {
      Alert.alert('KitchenPOS', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function trackOrder() {
    if (!ticket.trim()) return;
    setLoading(true);
    try {
      setTrackedOrder(await apiRequest(`/track/${ticket.trim()}/`));
    } catch (err) {
      setTrackedOrder(null);
      Alert.alert('KitchenPOS', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await AsyncStorage.multiRemove(['access', 'refresh']);
    onLogout();
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>KitchenPOS</Text>
          <Text style={styles.muted}>{API_ROOT_URL}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.ghostButton}>
          <Text style={styles.ghostText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {tabs.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>
              {item.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color="#f97316" style={styles.loader} /> : null}

      {tab === 'queue' ? (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          onRefresh={loadData}
          refreshing={loading}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ticket #{item.ticket_number}</Text>
              <Text style={styles.muted}>{item.customer_name || 'Walk-in'} - {item.status}</Text>
              <Text style={styles.price}>PHP {item.total}</Text>
            </View>
          )}
        />
      ) : null}

      {tab === 'menu' ? (
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          onRefresh={loadData}
          refreshing={loading}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.muted}>{item.category_name || 'Uncategorized'}</Text>
              <Text style={styles.price}>PHP {item.price}</Text>
            </View>
          )}
        />
      ) : null}

      {tab === 'track' ? (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Track an order</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setTicket}
              placeholder="Ticket number"
              placeholderTextColor="#777"
              style={styles.input}
              value={ticket}
            />
            <TouchableOpacity onPress={trackOrder} style={styles.primaryButton}>
              <Text style={styles.buttonText}>Track</Text>
            </TouchableOpacity>
          </View>
          {trackedOrder ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ticket #{trackedOrder.ticket_number}</Text>
              <Text style={styles.muted}>Status: {trackedOrder.status}</Text>
              <Text style={styles.price}>PHP {trackedOrder.total}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('access').then(token => {
      setAuthenticated(Boolean(token));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color="#f97316" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return authenticated ? (
    <DashboardScreen onLogout={() => setAuthenticated(false)} />
  ) : (
    <LoginScreen onLogin={() => setAuthenticated(true)} />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    padding: 18,
  },
  authPanel: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  muted: {
    color: 'rgba(255,255,255,0.55)',
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.45)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#fecaca',
    padding: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#fff',
    padding: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ghostButton: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostText: {
    color: '#fff',
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  activeTab: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  tabText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  loader: {
    marginVertical: 18,
  },
  list: {
    gap: 12,
    paddingTop: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  price: {
    color: '#fed7aa',
    fontWeight: '800',
  },
});
