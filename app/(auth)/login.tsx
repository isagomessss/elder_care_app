import api from "@/api/base";
import { Colors } from "@/constants/theme";
import { useUser } from "@/context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { user, setUser, loadingUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loadingUser && user) {
      router.replace("/(tabs)");
    }
  }, [loadingUser, user]);

  if (loadingUser) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.secondaryDark} />
      </View>
    );
  }

  async function login() {
    if (!email || !password) return Alert.alert("Erro", "Preencha email e senha");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, senha: password });
      const { token, usuario } = res.data;
      if (!token) return Alert.alert("Erro", "Token não recebido da API");

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("usuario", JSON.stringify(usuario));
      setUser(usuario);
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Erro ao logar:", err);
      Alert.alert("Erro", err.response?.data?.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, backgroundColor: Colors.background }}
        color={Colors.secondaryDark}
      />
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo 👋</Text>
      <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.primaryDark}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={Colors.primaryDark}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("./register")}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    color: Colors.accent,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryDark,
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: Colors.white,
    color: Colors.accent,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.secondaryDark,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: Colors.secondaryDark,
    textAlign: "center",
    fontWeight: "600",
  },
});
