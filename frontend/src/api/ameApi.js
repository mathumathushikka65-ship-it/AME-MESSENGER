import axios from 'axios';
import { io } from 'socket.io-client';

export const TOKEN_KEY = 'token';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '');

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function connectAmeSocket() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('Please login before connecting to Messenger');
  return io(SOCKET_BASE, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
}

export async function uploadAmeFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}