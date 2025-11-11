import React, { memo } from "react";
import { Colors } from "@/constants/theme";
import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  sortOption: string;
  setSortOption: (value: string) => void;
};

const PickerFiltroComponent = ({ sortOption, setSortOption }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ordenar por:</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={sortOption}
          onValueChange={(value) => setSortOption(value)}
          dropdownIconColor={Colors.primaryDark}
        >
          <Picker.Item label="Visitas mais próximas" value="proximas" />
          <Picker.Item label="Visitas mais distantes" value="distantes" />
          <Picker.Item label="Nome (A–Z)" value="az" />
          <Picker.Item label="Nome (Z–A)" value="za" />
        </Picker>
      </View>
    </View>
  );
};

// 👇 só re-renderiza se a prop realmente mudar
export const PickerFiltro = memo(PickerFiltroComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontWeight: "bold",
    color: Colors.accent,
    marginBottom: 5,
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
