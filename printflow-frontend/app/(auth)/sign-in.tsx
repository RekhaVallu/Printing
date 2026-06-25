import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppInput } from "../../components/AppInput";
import { AppButton } from "../../components/AppButton";
import { trackEvent } from "../../utils/posthog";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { tw, colors } = useTheme();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSendCodePress = async () => {
    if (!isLoaded) return;
    if (!emailAddress) {
      setError("Please enter your email address.");
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
      // Initialize sign-in session
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
      });

      // Find the email_code factor to get the emailAddressId
      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === "email_code"
      );

      if (!emailCodeFactor) {
        throw new Error("Email verification code strategy is not supported for this user.");
      }

      // Send the verification code
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: (emailCodeFactor as any).emailAddressId,
      });

      setPendingVerification(true);
      trackEvent("auth_sign_in_code_sent");
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Failed to send verification code. Please check your email.");
      trackEvent("auth_sign_in_start_failed", { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        trackEvent("auth_sign_in_completed", { success: true });
      } else {
        console.warn("Sign in status is not complete:", result.status);
        setError("Sign-in process did not complete. Status: " + result.status);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Incorrect verification code.");
      trackEvent("auth_sign_in_verify_failed", { error: err.message });
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
        {/* Branding header */}
        <View style={tw("items-center mb-10")}>
          <View style={tw("h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center border border-emerald-500/20 mb-4")}>
            <Feather name="printer" size={32} color={colors.accent} />
          </View>
          <Text style={tw("text-3xl font-space-bold text-primary mb-2")}>
            {pendingVerification ? "Verify Email" : "Welcome Back"}
          </Text>
          <Text style={tw("text-sm font-inter text-secondary text-center px-4")}>
            {pendingVerification
              ? `We sent a 6-digit verification code to ${emailAddress}.`
              : "Sign in with a passwordless verification code sent to your email."}
          </Text>
        </View>

        {/* Login Form card */}
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
              <AppInput
                label="Email Address"
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="email@college.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Feather name="mail" size={18} color={colors.textSecondary} />}
              />

              <AppButton
                title="Send Verification Code"
                onPress={onSendCodePress}
                loading={loading}
                variant="primary"
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
                title="Verify & Sign In"
                onPress={onVerifyPress}
                loading={loading}
                variant="primary"
              />

              <Pressable
                onPress={() => setPendingVerification(false)}
                style={tw("items-center mt-4")}
              >
                <Text style={tw("text-xs font-inter-semibold text-emerald-500 font-bold")}>
                  Change Email Address
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Navigation to sign up */}
        <View style={tw("flex-row justify-center items-center gap-1.5")}>
          <Text style={tw("text-sm font-inter text-secondary")}>
            Don't have an account?
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={tw("text-sm font-inter-semibold text-emerald-500 font-bold")}>
                Sign Up
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}