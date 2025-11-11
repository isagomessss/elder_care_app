import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/api/base";
import MaskInput, { Masks } from "react-native-mask-input";
import { Colors } from "@/constants/theme";

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<"Cuidador" | "Responsável" | "">("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState(new Date());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNext = () => {
    if (!tipo)
      return Alert.alert("Erro", "Selecione o tipo de usuário primeiro");
    setStep(2);
  };

  const handleRegister = async () => {
    if (!nome || !email || !cpf || !password || !confirmPassword)
      return Alert.alert("Erro", "Preencha todos os campos obrigatórios");

    if (password !== confirmPassword)
      return Alert.alert("Erro", "As senhas não coincidem");

    try {
      const payload = {
        nome,
        email,
        cpf,
        telefone,
        endereco,
        tipo,
        senha: password,
        dataNascimento: dataNascimento.toISOString(),
        dataCadastro: new Date().toISOString(),
        fotoUrl: "",
      };

      await api.post("/auth/register", payload);
      Alert.alert("Sucesso", "Usuário registrado!");
      router.replace("/login");
    } catch (err: any) {
      console.error("Erro ao registrar:", err);
      Alert.alert("Erro", err.response?.data?.message || "Falha no registro");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Junte-se a nós 💜</Text>

      {step === 1 ? (
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>Selecione o tipo de usuário:</Text>

          <TouchableOpacity
            style={[
              styles.optionButton,
              tipo === "Cuidador" && styles.optionSelected,
            ]}
            onPress={() => setTipo("Cuidador")}
          >
            <Text
              style={{
                color: tipo === "Cuidador" ? Colors.white : Colors.accent,
                fontWeight: "600",
              }}
            >
              Cuidador
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              tipo === "Responsável" && styles.optionSelected,
            ]}
            onPress={() => setTipo("Responsável")}
          >
            <Text
              style={{
                color: tipo === "Responsável" ? Colors.white : Colors.accent,
                fontWeight: "600",
              }}
            >
              Responsável
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.link}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={Colors.primaryDark}
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.primaryDark}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <MaskInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor={Colors.primaryDark}
            value={cpf}
            onChangeText={setCpf}
            mask={Masks.BRL_CPF}
            keyboardType="numeric"
          />

          <MaskInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor={Colors.primaryDark}
            value={telefone}
            onChangeText={setTelefone}
            mask={Masks.BRL_PHONE}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Endereço"
            placeholderTextColor={Colors.primaryDark}
            value={endereco}
            onChangeText={setEndereco}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.primaryDark}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            placeholderTextColor={Colors.primaryDark}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.link}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: Colors.accent,
  },
  subtitle: {
    textAlign: "center",
    color: Colors.secondaryDark,
    fontSize: 16,
    marginBottom: 20,
  },
  stepContainer: {
    gap: 12,
  },
  stepText: {
    textAlign: "center",
    color: Colors.accent,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
    color: Colors.accent,
  },
  optionButton: {
    padding: 16,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.secondaryDark,
    borderColor: Colors.secondary,
  },
  button: {
    marginTop: 20,
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
    marginTop: 15,
    color: Colors.secondaryDark,
    textAlign: "center",
    fontWeight: "600",
  },
});
