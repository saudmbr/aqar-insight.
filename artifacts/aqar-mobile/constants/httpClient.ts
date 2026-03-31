import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = DOMAIN
  ? `https://${DOMAIN}`
  : Platform.OS === 'web'
  ? ''
  : 'https://24f6cca2-97a5-4cb7-90fe-09117eb86dda-00-2llx3yzs7zv0w.picard.replit.dev';

const COOKIE_KEY = 'aqar_session_cookie';

async function getStoredCookie(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(COOKIE_KEY);
  } catch {
    return null;
  }
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
