import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppInput } from "../../components/AppInput";
import { AppButton } from "../../components/AppButton";
import { trackEvent } from "../../utils/posthog";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { tw, colors } = useTheme();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!firstName || !lastName || !emailAddress) {
      setError("Please fill in all fields.");
      return;
    }

    // Domain validation check
    const emailLower = emailAddress.toLowerCase().trim();
    const allowedDomains = ["@pvpsit.ac.in", "@siddhartha.edu.in", "@pvpsiddhartha.ac.in"];
    const isAllowed = allowedDomains.some((domain) => emailLower.endsWith(domain));
    if (!isAllowed) {
      setError("Only college email addresses (@pvpsit.ac.in, @siddhartha.edu.in) are allowed.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      trackEvent("auth_sign_up_started");
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Sign up failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      trackEvent("auth_sign_up", { success: true });
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Incorrect verification code.");
      trackEvent("auth_sign_up", { success: false, error: err.message });
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
            <Feather name="user-plus" size={32} color={colors.accent} />
          </View>
          <Text style={tw("text-3xl font-space-bold text-primary mb-2")}>
            {pendingVerification ? "Verify Email" : "Create Account"}
          </Text>
          <Text style={tw("text-sm font-inter text-secondary text-center px-4")}>
            {pendingVerification
              ? `We sent a verification code to your email ${emailAddress}.`
              : "Register to submit and track print jobs instantly."}
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

          {!pendingVerification ? (
            <>
              <View style={tw("flex-row gap-4 w-full justify-between")}>
                <View style={tw("flex-1")}>
                  <AppInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                  />
                </View>
                <View style={tw("flex-1")}>
                  <AppInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                  />
                </View>
              </View>

              <AppInput
                label="Email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="email@college.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={18} color={colors.textSecondary} />}
              />

              <AppButton
                title="Create Account"
                onPress={onSignUpPress}
                loading={loading}
                variant="primary"
                style={tw("mt-2")}
              />
            </>
          ) : (
            <>
              <AppInput
                label="Verification Code"
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                leftIcon={<Feather name="shield" size={18} color={colors.textSecondary} />}
              />

              <AppButton
                title="Verify & Continue"
                onPress={onPressVerify}
                loading={loading}
                variant="primary"
                style={tw("mt-2")}
              />

              <Pressable
                onPress={() => setPendingVerification(false)}
                style={tw("align-self-center mt-6")}
              >
                <Text style={tw("text-xs font-inter-semibold text-emerald-500 font-bold")}>
                  Back to Registration
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={tw("flex-row justify-center items-center gap-1.5")}>
          <Text style={tw("text-sm font-inter text-secondary")}>
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text style={tw("text-sm font-inter-semibold text-emerald-500 font-bold")}>
                Sign In
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}