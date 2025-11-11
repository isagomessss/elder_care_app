import api from "@/api/base"; // seu cliente axios
import { useUser } from "@/context/UserContext";
import { Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, logout } = useUser();

  // MODALS
  const [modalCriarVisible, setModalCriarVisible] = useState(false);
  const [modalVisualizarMenuVisible, setModalVisualizarMenuVisible] = useState(false);
  const [modalVisualizarUsuariosVisible, setModalVisualizarUsuariosVisible] = useState(false);
  const [modalVisualizarCondicoesVisible, setModalVisualizarCondicoesVisible] = useState(false);

  // Campos de criação
  const [condicao, setCondicao] = useState("");
  const [descricao, setDescricao] = useState("");

  // Dados para visualização
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [condicoes, setCondicoes] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingCondicoes, setLoadingCondicoes] = useState(false);

  // Fetch usuários
  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Fetch condições de saúde
  const fetchCondicoes = async () => {
    setLoadingCondicoes(true);
    try {
      const res = await api.get("/condicoesSaude");
      setCondicoes(res.data);
    } catch (err) {
      console.error("Erro ao buscar condições:", err);
    } finally {
      setLoadingCondicoes(false);
    }
  };

  useEffect(() => {
    if (user?.tipo === "Admin") {
      fetchUsuarios();
      fetchCondicoes();
    }
  }, [user]);

  const criarCondicao = async () => {
    if (!condicao.trim()) return Alert.alert("Erro", "Preencha a condição de saúde");
    try {
      await api.post("/condicoesSaude", { nome: condicao, descricao });
      Alert.alert("Sucesso", "Condição de saúde criada!");
      setCondicao("");
      setDescricao("");
      fetchCondicoes();
      setModalCriarVisible(false);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Erro", err.response?.data?.message || "Falha ao criar condição");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>

        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.infoText}>👤 Nome: {user.nome || "—"}</Text>
            <Text style={styles.infoText}>📧 Email: {user.email}</Text>
            <Text style={styles.infoText}>💼 Tipo: {user.tipo || "—"}</Text>
          </View>
        )}

        {/* ADMIN BUTTONS */}
        {user?.tipo === "Admin" && (
          <>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: Colors.secondaryDark }]}
              onPress={() => setModalCriarVisible(true)}
            >
              <Text style={styles.optionButtonText}>Criar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: Colors.secondary }]}
              onPress={() => setModalVisualizarMenuVisible(true)}
            >
              <Text style={styles.optionButtonText}>Visualizar</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* MODAL CRIAR */}
        <Modal visible={modalCriarVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Criar Condição de Saúde</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da condição"
                value={condicao}
                onChangeText={setCondicao}
              />
              <TextInput
                style={styles.input}
                placeholder="Descrição"
                value={descricao}
                onChangeText={setDescricao}
              />
              <TouchableOpacity style={styles.modalButton} onPress={criarCondicao}>
                <Text style={styles.modalButtonText}>Criar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalCriarVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL VISUALIZAR MENU */}
        <Modal visible={modalVisualizarMenuVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Visualizar</Text>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  fetchUsuarios();
                  setModalVisualizarUsuariosVisible(true);
                }}
              >
                <Text style={{ fontWeight: "600" }}>Usuários</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  fetchCondicoes();
                  setModalVisualizarCondicoesVisible(true);
                }}
              >
                <Text style={{ fontWeight: "600" }}>Condições de Saúde</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalVisualizarMenuVisible(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL VISUALIZAR USUARIOS */}
        <Modal visible={modalVisualizarUsuariosVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Usuários</Text>
              {loadingUsuarios ? (
                <ActivityIndicator color={Colors.secondaryDark} />
              ) : (
                <FlatList
                  data={usuarios}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.listItem}>
                      <Text style={{ fontWeight: "bold", color: Colors.accent }}>{item.nome}</Text>
                      <Text>{item.email}</Text>
                      <Text>{item.tipo}</Text>
                    </View>
                  )}
                />
              )}
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalVisualizarUsuariosVisible(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL VISUALIZAR CONDICOES */}
        <Modal visible={modalVisualizarCondicoesVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Condições de Saúde</Text>
              {loadingCondicoes ? (
                <ActivityIndicator color={Colors.secondaryDark} />
              ) : (
                <FlatList
                  data={condicoes}
                  keyExtractor={(item, idx) => item.id || idx.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.listItem}>
                      <Text style={{ fontWeight: "bold", color: Colors.accent }}>{item.nome}</Text>
                      <Text>{item.descricao}</Text>
                    </View>
                  )}
                />
              )}
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalVisualizarCondicoesVisible(false)}
              >
                <Text style={styles.modalCancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: Colors.background,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.accent,
  },
  userInfo: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoText: {
    color: Colors.accent,
    fontSize: 15,
    marginBottom: 4,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 12,
    marginTop: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoutText: {
    color: "#B83232",
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: Colors.accent,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: Colors.secondaryDark,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  modalButtonCancel: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.backgroundAlt,
    marginTop: 8,
  },
  modalCancelText: {
    color: Colors.secondaryDark,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  listItem: {
    backgroundColor: Colors.backgroundAlt,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
});
