import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

function normalizeApiBase(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `https://${trimmed.replace(/\/+$/, '')}`;
}

const API_BASE_FROM_ENV = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE);
const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = API_BASE_FROM_ENV
  ? API_BASE_FROM_ENV
  : DOMAIN
  ? normalizeApiBase(DOMAIN)
  : Platform.OS === 'web'
  ? ''
  : '';

if (__DEV__ && Platform.OS !== 'web' && !API_BASE) {
  console.warn(
    'API base is missing. Set EXPO_PUBLIC_API_BASE or EXPO_PUBLIC_DOMAIN so the mobile app talks to the same Replit backend as the web app.',
  );
}

const COOKIE_KEY = 'aqar_session_cookie';
const AUTH_TOKEN_KEY = 'aqar_auth_token';

async function getStoredCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
}

async function getStoredAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

async function storeCookie(cookieHeader: string): Promise<void> {
  try {
    const match = cookieHeader.match(/aqar\.sid=[^;]+/);
    if (match) {
      await AsyncStorage.setItem(COOKIE_KEY, match[0]);
    }
  } catch {}
}

export async function clearCookie(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COOKIE_KEY);
  } catch {}
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: Platform.OS === 'web',
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const authToken = await getStoredAuthToken();
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (Platform.OS !== 'web') {
    const cookie = await getStoredCookie();
    if (cookie) {
      config.headers['Cookie'] = cookie;
    }
  }
  return config;
});

client.interceptors.response.use(async (response: AxiosResponse) => {
  if (Platform.OS !== 'web') {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      if (cookieStr) await storeCookie(cookieStr);
    }
  }
  return response;
});

export default client;
