import api from "@/api/base";
import Header from "@/components/header";
import { PickerFiltro } from "@/components/visitas/renderPickerFiltro";
import { Colors } from "@/constants/theme";
import { useUser } from "@/context/UserContext";
import { Visita } from "@/types/Visita";
import { sortVisitas } from "@/utils/sortVisitas";
import { Picker } from "@react-native-picker/picker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

LocaleConfig.locales["pt-br"] = {
    monthNames: [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ],
    monthNamesShort: [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ],
    dayNames: [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
    ],
    dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

type Usuario = { id: string; nome: string; tipo: string };
type Idoso = { id: string; nome: string };

export default function VisitasScreen() {
    const { user } = useUser();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [responsavelId, setResponsavelId] = useState("");
    const [idosoId, setIdosoId] = useState("");
    const [responsaveis, setResponsaveis] = useState<Usuario[]>([]);
    const [idosos, setIdosos] = useState<Idoso[]>([]);
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"agendar" | "minhas">(
        user?.tipo === "Admin" ? "minhas" : "agendar"
    );
    const [sortOption, setSortOption] = useState("proximas");
    const [modalVisitaVisible, setModalVisitaVisible] = useState(false);
    const [visitaSelecionada, setVisitaSelecionada] = useState<Visita | null>(null);
    const [localVisita, setLocalVisita] = useState("");
    const isMountedRef = useRef(true);

    const fetchResponsaveis = useCallback(async () => {
        try {
            const res = await api.get<Usuario[]>("/usuarios");
            if (!isMountedRef.current) return;
            setResponsaveis(res.data.filter((u) => u.tipo === "Responsável"));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchIdososByResponsavel = useCallback(async (responsavelId: string) => {
        if (!responsavelId) {
            if (isMountedRef.current) setIdosos([]);
            return;
        }
        try {
            const res = await api.get<Idoso[]>(`/idosos/responsavel/${responsavelId}`);
            if (!isMountedRef.current) return;
            setIdosos(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchVisitasAdmin = useCallback(async () => {
        try {
            const [visitasRes, usuariosRes, idososRes] = await Promise.all([
                api.get<Visita[]>("/visitas"),
                api.get<Usuario[]>("/usuarios"),
                api.get<Idoso[]>("/idosos"),
            ]);

            if (!isMountedRef.current) return;

            const usuarios = usuariosRes.data;
            const responsaveisUsuarios = usuarios.filter((u) => u.tipo === "Responsável");
            const cuidadores = usuarios.filter((u) => u.tipo === "Cuidador");
            const idosos = idososRes.data;

            const enriched = visitasRes.data.map((v) => {
                const responsavel = responsaveisUsuarios.find((r) => r.id === v.responsavelId);
                const cuidador = cuidadores.find((c) => c.id === v.cuidadorId);
                const idoso = idosos.find((i) => i.id === v.idosoId);
                return {
                    ...v,
                    responsavelNome: responsavel?.nome || "Desconhecido",
                    cuidadorNome: cuidador?.nome || "Desconhecido",
                    idosoNome: idoso?.nome || "Desconhecido",
                };
            });

            setVisitas(enriched);
        } catch (err) {
            console.error("❌ Erro ao buscar visitas do admin:", err);
        }
    }, []);

    const fetchVisitasCuidador = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [visitasRes, responsaveisRes, idososRes] = await Promise.all([
                api.get<Visita[]>(`/visitas/cuidador/${user.id}`),
                api.get<Usuario[]>("/usuarios"),
                api.get<Idoso[]>("/idosos"),
            ]);

            const responsaveisUsuarios = responsaveisRes.data.filter((u) => u.tipo === "Responsável");
            const idosos = idososRes.data;

            const enriched = visitasRes.data.map((v) => {
                const responsavel = responsaveisUsuarios.find((r) => r.id === v.responsavelId);
                const idoso = idosos.find((i) => i.id === v.idosoId);
                return {
                    ...v,
                    responsavelNome: responsavel?.nome || "Desconhecido",
                    idosoNome: idoso?.nome || "Desconhecido",
                };
            });

            if (!isMountedRef.current) return;

            const deduplicated = enriched.filter(
                (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i
            );

            setVisitas(deduplicated);
        } catch (err) {
            console.error(err);
        }
    }, [user?.id]);

    const fetchVisitasResponsavel = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [visitasRes, idososRes] = await Promise.all([
                api.get<Visita[]>(`/visitas/responsavel/${user.id}`),
                api.get<Idoso[]>("/idosos"),
            ]);

            const enriched = visitasRes.data.map((v) => {
                const idoso = idososRes.data.find((i) => i.id === v.idosoId);
                return {
                    ...v,
                    idosoNome: idoso?.nome || "Desconhecido",
                };
            });

            if (!isMountedRef.current) return;

            setVisitas(enriched);
        } catch (err) {
            console.error(err);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            isMountedRef.current = true;

            if (!user?.tipo) {
                return () => {
                    isMountedRef.current = false;
                };
            }

            fetchResponsaveis();

            if (user.tipo === "Responsável") {
                fetchVisitasResponsavel();
            } else if (user.tipo === "Cuidador") {
                fetchVisitasCuidador();
            } else if (user.tipo === "Admin") {
                fetchVisitasAdmin();
            }

            return () => {
                isMountedRef.current = false;
            };
        }, [
            user?.tipo,
            user?.id,
            fetchResponsaveis,
            fetchVisitasResponsavel,
            fetchVisitasCuidador,
            fetchVisitasAdmin,
        ])
    );

    useEffect(() => {
        if (user?.tipo === "Admin") {
            setViewMode("minhas");
        }
    }, [user?.tipo]);

    useEffect(() => {
        fetchIdososByResponsavel(responsavelId);
    }, [responsavelId, fetchIdososByResponsavel]);

    const sortedVisitas = useMemo(
        () => sortVisitas(visitas, sortOption),
        [visitas, sortOption]
    );

    const handleSalvar = useCallback(async () => {
        if (!selectedDate || !responsavelId || !idosoId || !localVisita.trim()) {
            Alert.alert("Atenção", "Preencha todos os campos!");
            return;
        }

        try {
            setLoading(true);
            const dto = {
                dataVisita: new Date(selectedDate).toISOString(),
                responsavelId,
                cuidadorId: user?.id,
                idosoId,
                localVisita,
            };

            await api.post("/visitas", dto);
            Alert.alert("Sucesso", "Visita cadastrada!");

            if (isMountedRef.current) {
                setSelectedDate("");
                setResponsavelId("");
                setLocalVisita("");
                setIdosoId("");
            }

            await fetchVisitasCuidador();
        } catch (err) {
            console.error("❌ Erro ao salvar visita:", err);
            Alert.alert("Erro", "Falha ao salvar visita");
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [
        fetchVisitasCuidador,
        idosoId,
        localVisita,
        responsavelId,
        selectedDate,
        user?.id,
    ]);

    const formatarData = (data: any) => {
        let date: Date;
        if (data?._seconds) date = new Date(data._seconds * 1000);
        else if (typeof data === "string") date = new Date(data);
        else return "Data inválida";
        date = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        return date.toLocaleDateString("pt-BR");
    };

    const renderCuidadorView = () => {
        if (viewMode === "agendar") {
            return (
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Agendar Visita</Text>

                    <View style={styles.switchContainer}>
                        <TouchableOpacity
                            style={[styles.switchButton, styles.switchActive]}
                            onPress={() => setViewMode("agendar")}
                        >
                            <Text style={[styles.switchText, styles.switchTextActive]}>
                                Agendar Visita
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => setViewMode("minhas")}
                        >
                            <Text style={styles.switchText}>
                                {user?.tipo === "Admin" ? "Visitas" : "Minhas Visitas"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Selecione a data:</Text>
                    <Calendar
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={
                            selectedDate
                                ? { [selectedDate]: { selected: true, selectedColor: Colors.secondaryDark } }
                                : {}
                        }
                        theme={{
                            selectedDayBackgroundColor: Colors.secondaryDark,
                            todayTextColor: Colors.danger,
                            arrowColor: Colors.secondaryDark,
                            textDayFontWeight: "500",
                            monthTextColor: Colors.accent,
                        }}
                        firstDay={1}
                    />

                    {selectedDate && (
                        <Text style={styles.selectedText}>
                            📅 Data escolhida:{" "}
                            {new Date(selectedDate).toLocaleDateString("pt-BR")}
                        </Text>
                    )}

                    <Text style={styles.label}>Responsável</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={responsavelId}
                            onValueChange={(value) => {
                                setResponsavelId(value);
                                setIdosoId("");
                            }}
                        >
                            <Picker.Item label="Selecione um responsável" value="" />
                            {responsaveis.map((r) => (
                                <Picker.Item key={r.id} label={r.nome} value={r.id} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Idoso</Text>
                    <View
                        style={[styles.pickerWrapper, !responsavelId && { opacity: 0.5 }]}
                    >
                        <Picker
                            enabled={!!responsavelId}
                            selectedValue={idosoId}
                            onValueChange={(value) => setIdosoId(value)}
                        >
                            <Picker.Item
                                label={
                                    responsavelId
                                        ? "Selecione um idoso"
                                        : "Selecione um responsável primeiro"
                                }
                                value=""
                            />
                            {idosos.map((i) => (
                                <Picker.Item key={i.id} label={i.nome} value={i.id} />
                            ))}
                        </Picker>
                    </View>
                    <Text style={styles.label}>Local da Visita</Text>
                    <View style={styles.pickerWrapper}>
                        <TextInput
                            placeholder="Digite o local da visita"
                            style={styles.input}
                            value={localVisita}
                            onChangeText={setLocalVisita}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.6 }]}
                        onPress={handleSalvar}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? "Salvando..." : "Salvar Visita"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            );
        }

        return (
            <FlatList
                data={sortedVisitas}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.container}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                updateCellsBatchingPeriod={100}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>

                        <Text style={styles.title}>
                            {user?.tipo === "Admin" ? "Visitas" : "Minhas Visitas"}
                        </Text>

                        {user?.tipo !== "Admin" && (

                            <View style={styles.switchContainer}>
                                <TouchableOpacity
                                    style={[styles.switchButton, styles.switchActive]}
                                    onPress={() => setViewMode("agendar")}
                                >
                                    <Text style={[styles.switchText, styles.switchTextActive]}>
                                        Agendar Visita
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => setViewMode("minhas")}
                                >
                                    <Text style={styles.switchText}>Minhas Visitas</Text>
                                </TouchableOpacity>
                            </View>
                        )}


                        <PickerFiltro sortOption={sortOption} setSortOption={setSortOption} />
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhuma visita agendada ainda.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            if (user?.tipo === "Admin") {
                                setVisitaSelecionada(item);
                                setModalVisitaVisible(true);
                            }
                        }}
                        activeOpacity={user?.tipo === "Admin" ? 0.7 : 1}
                    >
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>🧓 {item.idosoNome}</Text>
                            <Text>📅 {formatarData(item.dataVisita)}</Text>
                            <Text>📍 Local: {item.localVisita || "Não informado"}</Text>
                            <Text style={styles.responsavelText}>
                                👤 Responsável:{" "}
                                <Text style={{ fontWeight: "bold", color: Colors.accent }}>
                                    {item.responsavelNome}
                                </Text>
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}


            />
        );
    };

    const renderResponsavelView = () => (
        <FlatList
            data={sortedVisitas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            removeClippedSubviews={true}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                <View>
                    <Text style={styles.title}>Minhas Visitas</Text>
                    <PickerFiltro sortOption={sortOption} setSortOption={setSortOption} />

                </View>
            }
            ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhuma visita marcada ainda.</Text>
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🧓 {item.idosoNome || item.idosoId}</Text>
                    <Text>📅 {formatarData(item.dataVisita)}</Text>
                    <Text>📍 Local: {item.localVisita || "Não informado"}</Text>
                </View>
            )}
        />
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <Header />
            {user?.tipo === "Responsável"
                ? renderResponsavelView()
                : renderCuidadorView()}
            <Modal
                visible={modalVisitaVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisitaVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Detalhes da Visita</Text>

                        {visitaSelecionada ? (
                            <>
                                <Text style={styles.detailText}>
                                    🧓 <Text style={styles.bold}>Idoso:</Text> {visitaSelecionada.idosoNome}
                                </Text>
                                <Text style={styles.detailText}>
                                    👤 <Text style={styles.bold}>Responsável:</Text> {visitaSelecionada.responsavelNome}
                                </Text>
                                <Text style={styles.detailText}>
                                    🧑‍⚕️ <Text style={styles.bold}>Cuidador:</Text> {visitaSelecionada.cuidadorNome || "Desconhecido"}
                                </Text>
                                <Text style={styles.detailText}>
                                    📅 <Text style={styles.bold}>Data:</Text> {formatarData(visitaSelecionada.dataVisita)}
                                </Text>

                                <Text style={styles.detailText}>
                                    📍 <Text style={styles.bold}>Local:</Text> {visitaSelecionada.localVisita || "Não informado"}
                                </Text>


                                <TouchableOpacity
                                    style={[styles.closeButton, { marginTop: 20 }]}
                                    onPress={() => setModalVisitaVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Fechar</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text>Nenhum detalhe encontrado</Text>
                        )}
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flexGrow: 1 },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: Colors.accent,
    },
    label: { fontWeight: "bold", marginTop: 20, marginBottom: 6, color: Colors.accent },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: Colors.white,
    },
    selectedText: { marginTop: 10, color: Colors.secondaryDark, fontWeight: "500" },
    button: {
        backgroundColor: Colors.secondaryDark,
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 25,
    },
    buttonText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
    card: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        elevation: 3,
        shadowColor: Colors.secondaryDark,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        borderLeftWidth: 5,
        borderLeftColor: Colors.secondary,
    },
    cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4, color: Colors.accent },
    switchContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
    },
    switchButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: Colors.secondaryDark,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    switchActive: { backgroundColor: Colors.secondaryDark },
    switchText: { color: Colors.secondaryDark, fontWeight: "bold" },
    switchTextActive: { color: Colors.white },
    emptyText: { textAlign: "center", marginTop: 20, color: "#666" },
    responsavelText: {
        marginTop: 6,
        color: Colors.accent,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        width: "90%",
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: Colors.accent,
    },
    detailText: {
        fontSize: 16,
        marginVertical: 4,
        color: Colors.accent,
    },
    bold: {
        fontWeight: "bold",
    },
    closeButton: {
        backgroundColor: Colors.secondaryDark,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
    },
    closeButtonText: {
        color: Colors.white,
        fontWeight: "bold",
    },
    input: {
        borderRadius: 8,
        padding: 10,
        backgroundColor: Colors.white,
        marginBottom: 10,
    },

});
