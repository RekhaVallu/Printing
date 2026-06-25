import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useAppAuth } from "../context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { AppInput } from "../components/AppInput";
import { AppButton } from "../components/AppButton";

export default function ProfileCompletion() {
  const { syncProfile, dbUser } = useAppAuth();
  const { tw, colors } = useTheme();

  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (!rollNo.trim() || !department.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await syncProfile(rollNo.trim(), department.trim());
      // The _layout NavigationGuard automatically redirects to Home when isProfileCompleted is true.
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || "Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw("flex-1 bg-background")}
    >
      <ScrollView contentContainerStyle={tw("flex-grow justify-center px-6 py-12")} showsVerticalScrollIndicator={false}>
        <View style={tw("items-center mb-8")}>
          <View style={tw("h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center border border-emerald-500/20 mb-4")}>
            <Feather name="clipboard" size={32} color={colors.accent} />
          </View>
          <Text style={tw("text-3xl font-space-bold text-primary mb-2")}>
            Complete Profile
          </Text>
          <Text style={tw("text-sm font-inter text-secondary text-center px-4")}>
            Hi {dbUser?.name || "Student"}, please complete your student details to start submitting print requests.
          </Text>
        </View>

        <View style={tw("bg-card rounded-2xl border border-border p-6 shadow-sm mb-6")}>
          {error ? (
            <View style={tw("flex flex-row items-center bg-red-50 dark:bg-red-950/20 border border-red-500/20 rounded-xl p-4 mb-4 gap-3")}>
              <Feather name="alert-circle" size={18} color={colors.danger} />
              <Text style={tw("flex-1 text-xs font-inter text-red-500")}>
                {error}
              </Text>
            </View>
          ) : null}

          <AppInput
            label="Roll Number"
            value={rollNo}
            onChangeText={setRollNo}
            placeholder="e.g. 245A1A05A2"
            autoCapitalize="characters"
            leftIcon={<Feather name="user" size={18} color={colors.textSecondary} />}
          />

          <AppInput
            label="Department"
            value={department}
            onChangeText={setDepartment}
            placeholder="e.g. CSE-AIML, IT, ECE"
            autoCapitalize="characters"
            leftIcon={<Feather name="book" size={18} color={colors.textSecondary} />}
          />

          <AppButton
            title="Complete Onboarding"
            onPress={onSubmit}
            loading={loading}
            variant="primary"
            style={tw("mt-2")}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
