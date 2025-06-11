import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";

export default function QuizScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Écran Quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, color: colors.primary },
}); 