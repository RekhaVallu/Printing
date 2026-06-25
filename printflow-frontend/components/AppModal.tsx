import React from "react";
import { Modal, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({ visible, onClose, children }) => {
  const { tw, colors } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw("flex-1 justify-center items-center bg-slate-950/60 px-6")}>
        <Pressable style={tw("absolute top-0 bottom-0 left-0 right-0")} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw("w-full max-w-[440px]")}
        >
          <View style={tw("bg-card rounded-2xl border border-border overflow-hidden shadow-lg w-full relative p-6")}>
            <Pressable
              onPress={onClose}
              style={tw("absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center z-10")}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Feather name="x" size={16} color={colors.text} />
            </Pressable>

            <ScrollView contentContainerStyle={tw("pt-2")} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
