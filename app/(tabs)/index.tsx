import api from "@/api/base";
import Header from "@/components/header";
import { Colors } from "@/constants/theme";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaskInput, { Masks } from "react-native-mask-input";
import { SafeAreaView } from "react-native-safe-area-context";

type Idoso = {
  id: string;
  identificador: number; // 👈 novo campo
  condicoesSaudeIds: string[];
  cpf: string;
  cuidadorId: string;
  responsavelId: string;
  dataCadastro: string;
  dataNascimento: string;
  endereco: string;
  fotoBase64?: string;
  genero: string;
  idade?: number;
  nome: string;
  observacoes: string;
  telefoneEmergencia: string;
};


type Usuario = {
  id: string;
  nome: string;
  tipo: string;
};

const normalizeDate = (data: any) => {
  if (!data) return "";
  if (typeof data === "string") {
    const d = new Date(data);
    return isNaN(d.getTime()) ? data : d.toLocaleDateString("pt-BR");
  }
  if (data?._seconds) return new Date(data._seconds * 1000).toLocaleDateString("pt-BR");
  try { return new Date(data).toLocaleDateString("pt-BR"); } catch { return ""; }
};

export default function HomeScreen() {
  const { user } = useUser();
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIdoso, setSelectedIdoso] = useState<Idoso | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefoneEmergencia, setTelefoneEmergencia] = useState("");
  const [genero, setGenero] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [responsaveis, setResponsaveis] = useState<Usuario[]>([]);
  const [loadingSave, setLoadingSave] = useState(false);
  const [condicoesSaude, setCondicoesSaude] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [medicacoes, setMedicacoes] = useState<any[]>([]);
  const [novaMedicacaoModal, setNovaMedicacaoModal] = useState(false);
  const [nomeMedicacao, setNomeMedicacao] = useState("");
  const [descricaoMedicacao, setDescricaoMedicacao] = useState("");
  const [horarioMedicacao, setHorarioMedicacao] = useState("");
  const [inicioMedicacao, setInicioMedicacao] = useState("");
  const [fimMedicacao, setFimMedicacao] = useState("");
  const [loadingMedicacao, setLoadingMedicacao] = useState(false);
  const [removendoMedicacaoId, setRemovendoMedicacaoId] = useState<string | null>(null);

  const [novaTarefaModal, setNovaTarefaModal] = useState(false);
  const [tituloTarefa, setTituloTarefa] = useState("");
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [dataTarefa, setDataTarefa] = useState("");
  const [horaTarefa, setHoraTarefa] = useState("");
  const [loadingTarefa, setLoadingTarefa] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [identificador, setIdentificador] = useState("");
  const [addIdosoModal, setAddIdosoModal] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    fetchIdosos();
    fetchResponsaveis();
    fetchCondicoesSaude();
  }, []);
  const fetchTarefas = async (idosoId: string) => {
    try {
      const res = await api.get(`/tarefas/idoso/${idosoId}`);
      setTarefas(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
    }
  };

  const fetchMedicacoes = async (idosoId: string) => {
    try {
      const res = await api.get(`/medicacoes/idoso/${idosoId}`);
      setMedicacoes(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar medicações:", err);
    }
  };

  const removerMedicacao = async (medicacaoId: string) => {
    if (!selectedIdoso) return;

    setRemovendoMedicacaoId(medicacaoId);
    try {
      await api.delete(`/medicacoes/${medicacaoId}`);
      Alert.alert("Sucesso", "Medicação removida!");
      fetchMedicacoes(selectedIdoso.id);
    } catch (err) {
      console.error("Erro ao excluir medicação:", err);
      Alert.alert("Erro", "Falha ao excluir medicação");
    } finally {
      setRemovendoMedicacaoId(null);
    }
  };

  const confirmarRemocaoMedicacao = (medicacaoId: string) => {
    Alert.alert(
      "Excluir medicação",
      "Tem certeza que deseja excluir esta medicação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => removerMedicacao(medicacaoId),
        },
      ]
    );
  };


  const escolherFotoBase64 = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true, // 👈 importante
    });

    if (result.canceled) return null;
    return result.assets[0].base64;
  };




  const criarTarefa = async () => {
    if (!tituloTarefa || !descricaoTarefa || !dataTarefa) {
      return Alert.alert("Erro", "Preencha todos os campos da tarefa.");
    }

    setLoadingTarefa(true);
    try {
      const [dia, mes, ano] = dataTarefa.split('/');
      const [hora, minuto] = horaTarefa.split(':');
      const dataCompleta = new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00`);

      const dto = {
        cuidadorId: user?.id,
        idosoId: selectedIdoso?.id,
        titulo: tituloTarefa,
        descricao: descricaoTarefa,
        dataHora: dataCompleta.toISOString(),
        status: "Pendente",
      };

      await api.post("/tarefas", dto);

      Alert.alert("Sucesso", "Tarefa criada com sucesso!");
      setNovaTarefaModal(false);
      fetchTarefas(selectedIdoso!.id);
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
      Alert.alert("Erro", "Falha ao criar tarefa");
    } finally {
      setLoadingTarefa(false);
    }
  };

  const criarMedicacao = async () => {
    if (!nomeMedicacao || !descricaoMedicacao || !horarioMedicacao || !inicioMedicacao || !fimMedicacao) {
      return Alert.alert("Erro", "Preencha todos os campos da medicação.");
    }

    setLoadingMedicacao(true);
    try {
      const [diaI, mesI, anoI] = inicioMedicacao.split("/");
      const [diaF, mesF, anoF] = fimMedicacao.split("/");
      const dto = {
        nome: nomeMedicacao,
        descricao: descricaoMedicacao,
        horario: horarioMedicacao,
        inicio: `${anoI}-${mesI}-${diaI}`,
        fim: `${anoF}-${mesF}-${diaF}`,
        cuidadorId: user?.id,
        idosoId: selectedIdoso?.id,
      };

      await api.post("/medicacoes", dto);

      Alert.alert("Sucesso", "Medicação registrada!");
      setNovaMedicacaoModal(false);
      fetchMedicacoes(selectedIdoso!.id);
    } catch (err) {
      console.error("Erro ao criar medicação:", err);
      Alert.alert("Erro", "Falha ao cadastrar medicação");
    } finally {
      setLoadingMedicacao(false);
    }
  };


  const fetchCondicoesSaude = async () => {
    try {
      const res = await api.get("/condicoesSaude");
      setCondicoesSaude(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar condições de saúde:", err);
    }
  };

  const fetchIdosos = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let res;

      if (user?.tipo === "Admin") {
        res = await api.get<any[]>("/idosos");
      } else if (user?.tipo === "Cuidador") {
        res = await api.get<any[]>(`/idosos/cuidador/${user.id}`);
      } else if (user?.tipo === "Responsável") {
        res = await api.get<any[]>(`/idosos/responsavel/${user.id}`);
      }

      const convertidos = (res?.data || []).map((i) => ({
        ...i,
        dataNascimento: i.dataNascimento?._seconds
          ? new Date(i.dataNascimento._seconds * 1000).toLocaleDateString("pt-BR")
          : i.dataNascimento,
        dataCadastro: i.dataCadastro?._seconds
          ? new Date(i.dataCadastro._seconds * 1000).toLocaleDateString("pt-BR")
          : i.dataCadastro,
      }));

      setIdosos(convertidos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const idososFiltrados = idosos.filter((i) => {
    if (user?.tipo === "Admin") {
      return true; // 👈 Admin vê todos
    } else if (user?.tipo === "Cuidador") {
      return true; // Cuidador vê todos também
    } else if (user?.tipo === "Responsável") {
      return i.responsavelId === user.id;
    }
    return false;
  });



  const fetchResponsaveis = async () => {
    try {
      const res = await api.get<Usuario[]>("/usuarios");
      setResponsaveis(res.data.filter((u) => u.tipo === "Responsável"));
    } catch (err) {
      console.error(err);
    }
  };

  const salvarIdoso = async () => {
    if (!nome || !cpf || !dataNascimento) {
      return Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
    }

    setLoadingSave(true);
    try {
      const base64 = await escolherFotoBase64();

      const dto = {
        nome,
        cpf,
        dataNascimento,
        endereco,
        telefoneEmergencia,
        genero,
        observacoes,
        cuidadorId: user?.id,
        dataCadastro: new Date().toISOString(),
        fotoBase64: base64, // 👈 salva direto no Firestore
        condicoesSaudeIds: []
      };

      await api.post("/idosos", dto);
      Alert.alert("Sucesso", "Idoso cadastrado!");
      setModalVisible(false);
      fetchIdosos();

      // limpa campos
      setNome("");
      setCpf("");
      setDataNascimento("");
      setEndereco("");
      setTelefoneEmergencia("");
      setGenero("");
      setObservacoes("");
      setFoto(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao cadastrar idoso");
    } finally {
      setLoadingSave(false);
    }
  };


  const taskRefs = useRef<Record<string, any>>({});

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondaryDark} />
      </View>
    );
  }

  const formatarData = (data: any) => {
    if (!data) return "";
    try {
      if (typeof data === "string") {
        const d = new Date(data);
        if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
        return data;
      }
      if (data._seconds)
        return new Date(data._seconds * 1000).toLocaleDateString("pt-BR");
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>Idosos</Text>

        {user?.tipo !== "Responsável" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Cadastrar Idoso</Text>
          </TouchableOpacity>
        )}

        {user?.tipo === "Responsável" && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddIdosoModal(true)}
          >
            <Text style={styles.addButtonText}>Adicionar Idoso</Text>
          </TouchableOpacity>
        )}

        {idososFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum paciente cadastrado ainda.</Text>
        ) : (
          <FlatList
            data={idososFiltrados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const responsavel = responsaveis.find(
                (r) => r.id === item.responsavelId
              );

              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedIdoso(item);
                    setDetailModalVisible(true);
                    fetchTarefas(item.id);
                    fetchMedicacoes(item.id);
                    setEditMode(false);
                  }}
                >
                  <View style={styles.card}>
                    <Text style={{ fontWeight: "bold", color: Colors.secondaryDark }}>
                      🆔 Identificador: {item.identificador}
                    </Text>

                    <Text style={styles.name}>{item.nome}</Text>
                    <Text>Idade: {item.idade}</Text>
                    <Text>Gênero: {item.genero}</Text>
                    <Text>Telefone: {item.telefoneEmergencia}</Text>
                    <Text>Endereço: {item.endereco}</Text>
                    <Text>Observações: {item.observacoes}</Text>
                    {(() => {
                      return (
                        <View style={{ marginTop: 6 }}>
                          <Text style={styles.condicaoText}>🩺 Condições de Saúde:</Text>
                          {(item.condicoesSaudeIds || []).length === 0 ? (
                            <Text style={{ marginLeft: 10, color: "#777" }}>Nenhuma informada</Text>
                          ) : (
                            item.condicoesSaudeIds.map((id) => {
                              const cond = condicoesSaude.find((c) => c.id === id);
                              return (
                                <Text key={id} style={{ marginLeft: 10, color: Colors.accent }}>
                                  • {cond?.nome || "Desconhecida"}
                                </Text>
                              );
                            })
                          )}
                        </View>
                      );

                    })()}

                    {responsavel && (
                      <Text style={styles.responsavelText}>
                        👤 Responsável:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {responsavel.nome}
                        </Text>
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* ✅ MODAL CADASTRO */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cadastrar Idoso</Text>

              <TextInput
                placeholder="Nome"
                style={styles.input}
                value={nome}
                onChangeText={setNome}
              />
              <MaskInput
                placeholder="CPF"
                style={styles.input}
                value={cpf}
                onChangeText={setCpf}
                mask={Masks.BRL_CPF}
              />
              <MaskInput
                placeholder="Telefone Emergência"
                style={styles.input}
                value={telefoneEmergencia}
                onChangeText={setTelefoneEmergencia}
                mask={Masks.BRL_PHONE}
              />
              <TextInput
                placeholder="Endereço"
                style={styles.input}
                value={endereco}
                onChangeText={setEndereco}
              />
              <Text style={styles.label}>Gênero</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={genero}
                  onValueChange={(value) => setGenero(value)}
                >
                  <Picker.Item label="Selecione o gênero" value="" />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Feminino" value="Feminino" />
                  <Picker.Item label="Outro" value="Outro" />
                </Picker>
              </View>
              <TextInput
                placeholder="Observações"
                style={styles.input}
                value={observacoes}
                onChangeText={setObservacoes}
              />
              <MaskInput
                placeholder="Data Nascimento (DD/MM/YYYY)"
                style={styles.input}
                value={dataNascimento}
                onChangeText={setDataNascimento}
                mask={Masks.DATE_DDMMYYYY}
              />

              <Text style={styles.label}>Foto do Idoso</Text>
              <View style={{ alignItems: "center", marginVertical: 10 }}>
                {foto ? (
                  <Image
                    source={{ uri: foto }}
                    style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 8 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#eee",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={80} color="#bbb" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={async () => {
                    const url = await escolherFotoBase64();
                    if (url) setFoto(url);
                  }}
                  style={{ backgroundColor: Colors.primaryDark, padding: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Selecionar Foto</Text>
                </TouchableOpacity>

              </View>

              <TouchableOpacity
                style={[styles.addButton, { marginTop: 16 }]}
                onPress={salvarIdoso}
                disabled={loadingSave}
              >
                <Text style={styles.addButtonText}>
                  {loadingSave ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.addButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* ✅ MODAL DETALHES */}
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editMode ? "Editar Idoso" : "Detalhes do Idoso"}
              </Text>

              {selectedIdoso && (
                <>

                  <Text style={styles.label}>Identificador:</Text>
                  <Text style={styles.detailText}>{selectedIdoso.identificador}</Text>
                  {selectedIdoso?.fotoBase64 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${selectedIdoso.fotoBase64}` }}
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 70,
                        alignSelf: "center",
                        marginVertical: 10,
                      }}
                    />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={140}
                      color="#ccc"
                      style={{ alignSelf: "center", marginVertical: 10 }}
                    />
                  )}

                  {editMode && (
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const novaUrl = await escolherFotoBase64();
                          if (!novaUrl || !selectedIdoso) return;

                          // Atualiza no banco via PATCH
                          await api.put(`/idosos/${selectedIdoso.id}`, {
                            fotoBase64: novaUrl,
                          });


                          // Atualiza a tela localmente
                          setSelectedIdoso({ ...selectedIdoso, fotoBase64: novaUrl });
                          Alert.alert("Sucesso", "Foto atualizada com sucesso!");
                          fetchIdosos();
                        } catch (err) {
                          console.error(err);
                          Alert.alert("Erro", "Falha ao atualizar foto do idoso.");
                        }
                      }}
                      style={{
                        backgroundColor: Colors.primaryDark,
                        padding: 10,
                        borderRadius: 10,
                        alignSelf: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>Trocar Foto</Text>
                    </TouchableOpacity>
                  )}

                  <TextInput
                    style={styles.input}
                    editable={editMode}
                    value={selectedIdoso.nome}
                    onChangeText={(text) =>
                      setSelectedIdoso({ ...selectedIdoso, nome: text })
                    }
                    placeholder="Nome"
                  />
                  <TextInput
                    style={styles.input}
                    editable={editMode}
                    value={selectedIdoso.endereco}
                    onChangeText={(text) =>
                      setSelectedIdoso({ ...selectedIdoso, endereco: text })
                    }
                    placeholder="Endereço"
                  />
                  <TextInput
                    style={styles.input}
                    editable={editMode}
                    value={selectedIdoso.telefoneEmergencia}
                    onChangeText={(text) =>
                      setSelectedIdoso({
                        ...selectedIdoso,
                        telefoneEmergencia: text,
                      })
                    }
                    placeholder="Telefone de Emergência"
                  />
                  <TextInput
                    style={styles.input}
                    editable={editMode}
                    value={selectedIdoso.observacoes}
                    onChangeText={(text) =>
                      setSelectedIdoso({ ...selectedIdoso, observacoes: text })
                    }
                    placeholder="Observações"
                  />

                  <Text style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: "bold" }}>
                      Data de Nascimento:
                    </Text>{" "}
                    {formatarData(selectedIdoso.dataNascimento)}
                  </Text>

                  <Text>
                    <Text style={{ fontWeight: "bold" }}>Idade:</Text>{" "}
                    {selectedIdoso.idade}
                  </Text>

                  {/* 🔹 Condições de Saúde */}
                  <Text style={styles.label}>Condições de Saúde</Text>

                  {editMode ? (
                    <View>
                      {condicoesSaude.map((cond) => {
                        const selecionado = selectedIdoso.condicoesSaudeIds?.includes(cond.id);
                        return (
                          <TouchableOpacity
                            key={cond.id}
                            onPress={() => {
                              const novas = selecionado
                                ? selectedIdoso.condicoesSaudeIds.filter((id) => id !== cond.id)
                                : [...(selectedIdoso.condicoesSaudeIds || []), cond.id];
                              setSelectedIdoso({ ...selectedIdoso, condicoesSaudeIds: novas });
                            }}
                            style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}
                          >
                            <Ionicons
                              name={selecionado ? "checkbox" : "square-outline"}
                              size={22}
                              color={selecionado ? Colors.primaryDark : "#ccc"}
                            />
                            <Text style={{ marginLeft: 8 }}>{cond.nome}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.condicaoText}>🩺 Condições de Saúde:</Text>
                      {(selectedIdoso.condicoesSaudeIds || []).length === 0 ? (
                        <Text style={{ color: "#777", marginLeft: 8 }}>Nenhuma informada</Text>
                      ) : (
                        selectedIdoso.condicoesSaudeIds.map((id) => {
                          const cond = condicoesSaude.find((c) => c.id === id);
                          return (
                            <Text key={id} style={{ marginLeft: 10, color: Colors.accent }}>
                              • {cond?.nome || "Desconhecida"}
                            </Text>
                          );
                        })
                      )}
                    </View>
                  )}



                  {user?.tipo !== "Responsável" && !editMode && (
                    <TouchableOpacity
                      style={[styles.addButton, { marginTop: 20 }]}
                      onPress={() => setEditMode(true)}
                    >
                      <Text style={styles.addButtonText}>Editar</Text>
                    </TouchableOpacity>
                  )}


                  {editMode && (
                    <TouchableOpacity
                      style={[styles.addButton, { marginTop: 20 }]}
                      onPress={async () => {
                        try {
                          await api.put(
                            `/idosos/${selectedIdoso.id}`,
                            selectedIdoso
                          );
                          Alert.alert("Sucesso", "Informações atualizadas!");
                          setEditMode(false);
                          setDetailModalVisible(false);
                          fetchIdosos();
                        } catch (err) {
                          console.error(err);
                          Alert.alert("Erro", "Falha ao atualizar informações.");
                        }
                      }}
                    >
                      <Text style={styles.addButtonText}>Salvar</Text>
                    </TouchableOpacity>
                  )}
                  {user?.tipo === "Cuidador" && !editMode && (
                    <View style={{ marginBottom: 30 }}>
                      <TouchableOpacity
                        style={[styles.addButton, { marginTop: 20 }]}
                        onPress={() => setNovaTarefaModal(true)}
                      >
                        <Text style={styles.addButtonText}>+ Criar Nova Tarefa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.addButton, { marginTop: 10 }]}
                        onPress={() => setNovaMedicacaoModal(true)}
                      >
                        <Text style={styles.addButtonText}>💊 Adicionar Medicação</Text>
                      </TouchableOpacity>

                      <Text style={[styles.label, { marginTop: 16 }]}>💊 Medicações</Text>

                      {medicacoes.length === 0 ? (
                        <Text style={{ color: "#666", marginBottom: 10 }}>Nenhuma medicação registrada.</Text>
                      ) : (
                        medicacoes.map((m) => (
                          <View key={m.id} style={[styles.tarefaCard, { borderLeftColor: Colors.accent }]}>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text style={styles.tarefaTitulo}>{m.nome}</Text>
                              <TouchableOpacity
                                onPress={() => confirmarRemocaoMedicacao(m.id)}
                                style={{ padding: 6 }}
                                disabled={removendoMedicacaoId === m.id}
                              >
                                {removendoMedicacaoId === m.id ? (
                                  <ActivityIndicator size="small" color={Colors.danger} />
                                ) : (
                                  <Ionicons name="trash" size={18} color={Colors.danger} />
                                )}
                              </TouchableOpacity>
                            </View>
                            <Text>{m.descricao}</Text>
                            <Text>Horário: {m.horario}</Text>
                            <Text>Início: {normalizeDate(m.inicio)}</Text>
                            <Text>Fim: {normalizeDate(m.fim)}</Text>
                            <Text>Status: {m.ativa ? "Ativa" : "Finalizada"}</Text>
                          </View>
                        ))
                      )}

                      <Text style={[styles.label, { marginTop: 16 }]}>Tarefas do Idoso</Text>

                      {tarefas.length === 0 ? (
                        <Text style={{ color: "#666", marginBottom: 10 }}>
                          Nenhuma tarefa registrada.
                        </Text>
                      ) : (
                        tarefas.map((t) => (
                          <View
                            key={t.id}
                            style={[
                              styles.tarefaCard,
                              t.status === "Atrasada" && { borderLeftColor: Colors.danger },
                              t.status === "Concluída" && { borderLeftColor: "green" },
                            ]}
                          >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={styles.tarefaTitulo}>{t.titulo}</Text>

                              {/* 🔹 Botão de três pontinhos */}
                              <TouchableOpacity
                                ref={(ref) => {
                                  taskRefs.current[t.id] = ref;
                                }}

                                onPress={() => {
                                  taskRefs.current[t.id]?.measure((fx: any, fy: any, width: any, height: any, px: any, py: any) => {
                                    setPopupPos({ x: px + width / 2, y: py + height });
                                    setSelectedTask(t);
                                    setShowPopup(true);
                                  });
                                }}
                                style={{ padding: 4 }}
                              >
                                <Ionicons name="ellipsis-vertical" size={20} color="#555" />
                              </TouchableOpacity>

                            </View>

                            <Text>{t.descricao}</Text>
                            <Text style={styles.tarefaData}>
                              {new Date(t.dataHora._seconds * 1000).toLocaleString("pt-BR")}
                            </Text>
                            <Text>Status: {t.status}</Text>
                          </View>

                        ))

                      )}


                    </View>
                  )}

                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.addButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Modal
          visible={novaTarefaModal}
          animationType="slide"
          transparent
          onRequestClose={() => setNovaTarefaModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>

              <TextInput
                placeholder="Título"
                style={styles.input}
                value={tituloTarefa}
                onChangeText={setTituloTarefa}
              />
              <TextInput
                placeholder="Descrição"
                style={styles.input}
                value={descricaoTarefa}
                onChangeText={setDescricaoTarefa}
              />
              <MaskInput
                placeholder="Data (DD/MM/YYYY)"
                style={styles.input}
                value={dataTarefa}
                onChangeText={setDataTarefa}
                mask={Masks.DATE_DDMMYYYY}
              />

              <MaskInput
                placeholder="Hora (HH:mm)"
                style={styles.input}
                value={horaTarefa}
                onChangeText={setHoraTarefa}
                mask={[/\d/, /\d/, ':', /\d/, /\d/]}
              />


              <TouchableOpacity
                style={[styles.addButton, { marginTop: 16 }]}
                onPress={criarTarefa}
                disabled={loadingTarefa}
              >
                <Text style={styles.addButtonText}>
                  {loadingTarefa ? "Salvando..." : "Salvar Tarefa"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setNovaTarefaModal(false)}
              >
                <Text style={styles.addButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* 🔹 Popup agora 100% dentro do Modal */}
        <Modal visible={showPopup} transparent animationType="fade">
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPressOut={() => setShowPopup(false)}
          >
            <View
              style={[
                styles.popupContainer,
                { top: popupPos.y - 20, left: popupPos.x - 180 },
              ]}
            >
              <Text style={styles.popupTitle}>{selectedTask?.titulo}</Text>

              <TouchableOpacity
                style={styles.popupAction}
                onPress={async () => {
                  const novoStatus =
                    selectedTask.status === "Concluída" ? "Pendente" : "Concluída";
                  await api.put(`/tarefas/${selectedTask.id}`, { status: novoStatus });
                  fetchTarefas(selectedIdoso!.id);
                  setShowPopup(false);
                }}
              >
                <Text style={styles.popupActionText}>
                  {selectedTask?.status === "Concluída"
                    ? "🔁 Marcar como Pendente"
                    : "✅ Marcar como Concluída"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <Modal
          visible={addIdosoModal}
          animationType="slide"
          transparent
          onRequestClose={() => setAddIdosoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Idoso</Text>

              <TextInput
                placeholder="Digite o Identificador do Idoso"
                style={styles.input}
                keyboardType="numeric"
                value={identificador}
                onChangeText={setIdentificador}
              />

              <TouchableOpacity
                style={[styles.addButton, { marginTop: 16 }]}
                onPress={async () => {
                  try {
                    if (!identificador)
                      return Alert.alert("Erro", "Informe o identificador do idoso.");

                    await api.put(`/idosos/vincular`, {
                      identificador: Number(identificador),
                      responsavelId: user?.id,
                    });

                    Alert.alert("Sucesso", "Idoso vinculado com sucesso!");
                    fetchIdosos();
                    setAddIdosoModal(false);
                  } catch (err) {
                    console.error(err);
                    Alert.alert("Erro", "Falha ao vincular idoso. Verifique o identificador.");
                  }
                }}
              >
                <Text style={styles.addButtonText}>Vincular Idoso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddIdosoModal(false)}
              >
                <Text style={styles.addButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={novaMedicacaoModal}
          animationType="slide"
          transparent
          onRequestClose={() => setNovaMedicacaoModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nova Medicação</Text>

              <TextInput
                placeholder="Nome da Medicação"
                style={styles.input}
                value={nomeMedicacao}
                onChangeText={setNomeMedicacao}
              />
              <TextInput
                placeholder="Descrição / Dosagem"
                style={styles.input}
                value={descricaoMedicacao}
                onChangeText={setDescricaoMedicacao}
              />
              <MaskInput
                placeholder="Horário (HH:mm)"
                style={styles.input}
                value={horarioMedicacao}
                onChangeText={setHorarioMedicacao}
                mask={[/\d/, /\d/, ":", /\d/, /\d/]}
              />
              <MaskInput
                placeholder="Início (DD/MM/YYYY)"
                style={styles.input}
                value={inicioMedicacao}
                onChangeText={setInicioMedicacao}
                mask={Masks.DATE_DDMMYYYY}
              />
              <MaskInput
                placeholder="Fim (DD/MM/YYYY)"
                style={styles.input}
                value={fimMedicacao}
                onChangeText={setFimMedicacao}
                mask={Masks.DATE_DDMMYYYY}
              />

              <TouchableOpacity
                style={[styles.addButton, { marginTop: 16 }]}
                onPress={criarMedicacao}
                disabled={loadingMedicacao}
              >
                <Text style={styles.addButtonText}>
                  {loadingMedicacao ? "Salvando..." : "Salvar Medicação"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setNovaMedicacaoModal(false)}
              >
                <Text style={styles.addButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: Colors.background,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.accent,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: Colors.secondary,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: Colors.accent,
  },
  responsavelText: {
    color: Colors.accent,
    marginTop: 6,
  },
  addButton: {
    backgroundColor: Colors.secondaryDark,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: Colors.danger,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
    // adiciona:
    zIndex: 1,
  },

  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: Colors.accent,
  },
  label: {
    fontWeight: "bold",
    marginTop: 8,
    color: Colors.accent,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  responsavelItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: Colors.white,
  },
  condicaoText: {
    color: Colors.accent,
    marginTop: 6,
  },
  tarefaCard: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  tarefaTitulo: {
    fontWeight: "bold",
    color: Colors.accent,
  },
  tarefaData: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },


  popupButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
    alignItems: "center",
  },
  popupButtonText: {
    color: "#fff",
    fontSize: 13,
  },

  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.05)",
    zIndex: 9998,
  },


  popupContainer: {
    position: "absolute",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: 220,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,     // 👈 força sobreposição no Android
    zIndex: 9999,      // 👈 força sobreposição no iOS
  },


  popupTitle: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  popupAction: {
    backgroundColor: Colors.secondaryDark,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 4,
  },

  popupActionDanger: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
  },

  popupActionText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  detailText: {
    color: Colors.text,
  }
});
