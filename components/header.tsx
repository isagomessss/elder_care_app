import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/api/base";
import { useUser } from "@/context/UserContext";

export default function Header() {
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const fetchNotifications = async () => {
    if (!user?.id) return; // 👈 só busca se houver usuário logado
    try {
      setLoading(true);
      // 🔹 busca notificações do usuário
      const res = await api.get(`/notificacoes/usuario/${user.id}`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchNotifications();
}, [user?.id])

  useEffect(() => {
    if (modalVisible) fetchNotifications();
  }, [modalVisible]);

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/notificacoes/${id}`, { lida: !currentStatus });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, lida: !currentStatus } : n
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar status da notificação:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.lida).length;

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="heart-outline" size={24} color="#4B0082" />
          <Text style={styles.title}>Elder Care</Text>
        </View>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="notifications-outline" size={26} color="#4B0082" />
          {unreadCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      {/* Modal de Notificações */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notificações</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#A770EF" />
            ) : notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => toggleReadStatus(item.id, item.lida)}
                    style={[
                      styles.notificationItem,
                      !item.lida && { backgroundColor: "#F3E8FF" },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>
                        {item.titulo || "Sem título"}
                      </Text>
                      <Text style={styles.notificationText}>
                        {item.mensagem || "—"}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {new Date(item.dataEnvio._seconds * 1000).toLocaleString(
                          "pt-BR"
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        item.lida
                          ? "checkmark-done-circle-outline"
                          : "ellipse-outline"
                      }
                      size={22}
                      color={item.lida ? "#4CAF50" : "#C77DFF"}
                      style={styles.statusIcon}
                    />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ textAlign: "center", color: "#666" }}>
                Nenhuma notificação ainda
              </Text>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#E5CCFF",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D3B3FF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#4B0082",
    fontSize: 22,
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "#FF4D4D",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#4B0082",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  notificationTitle: {
    fontWeight: "600",
    color: "#333",
  },
  notificationText: {
    fontSize: 14,
    color: "#555",
  },
  notificationDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  statusIcon: {
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#A770EF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
