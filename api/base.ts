import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://10.0.1.11:3000", // muda conforme tua API
  timeout: 10000, // tempo limite (10s)
});

// Intercepta requisições (útil pra token, logs, etc)
api.interceptors.request.use(
  async (config) => {
    // Exemplo: adiciona token automaticamente se existir
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function setFotoUrlIdoso(id: string, fotoUrl: string | null) {
  const { data } = await api.patch(`/idosos/${id}/foto-url`, { fotoUrl });
  return data as { id?: string; fotoUrl: string | null };
}
// Intercepta respostas (tratamento global de erros)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sessão expirada, redirecionando pro login...");

    }
    return Promise.reject(error);
  }
);

export default api;
