import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

type Usuario = {
  id: string;
  email: string;
  nome?: string;
  tipo?: string;
};

interface UserContextType {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  logout: () => Promise<void>;
  loadingUser: boolean; // 👈 novo
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: async () => {},
  loadingUser: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  // 🔹 Carrega usuário e token salvos no AsyncStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("usuario");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  // 🔹 Salva o usuário no AsyncStorage sempre que mudar
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem("usuario", JSON.stringify(user));
    }
  }, [user]);

  // 🔹 Logout com confirmação
  const logout = async () => {
    Alert.alert("Confirmar saída", "Você realmente deseja sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("usuario");
          await AsyncStorage.removeItem("token");
          setUser(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 🔹 Hook customizado pra usar fácil
export const useUser = () => useContext(UserContext);
