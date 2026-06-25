import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Switch, Pressable, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { AppHeader } from "../components/AppHeader";
import { AppCard } from "../components/AppCard";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useAppAuth } from "../context/AuthContext";
import { getPrinters } from "../services/printerService";
import { uploadFile } from "../services/uploadService";
import { createOrder } from "../services/orderService";
import { trackEvent } from "../utils/posthog";

interface Printer {
  _id: string;
  name: string;
  location: string;
  printerType: "bw" | "color";
  status: "online" | "offline" | "maintenance";
  pagesPerMinute: number;
  currentQueueLength: number;
}

export default function CreateOrder() {
  const { tw, colors } = useTheme();
  const { dbUser } = useAppAuth();
  const router = useRouter();

  // Document states
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "failed">("idle");
  
  // Form states
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [copies, setCopies] = useState("1");
  const [printSides, setPrintSides] = useState<"single" | "double">("single");
  const [priority, setPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  const [confidential, setConfidential] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Reanimated values for success animation
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  // Fetch printers on mount
  useEffect(() => {
    if (dbUser?.role === "operator" || dbUser?.role === "admin") {
      router.replace("/(tabs)/orders");
      return;
    }

    const fetchPrinters = async () => {
      try {
        const response = await getPrinters();
        if (response && response.success && response.data) {
          // Filter online printers
          const onlinePrinters = response.data.filter((p: Printer) => p.status === "online");
          setPrinters(onlinePrinters);
          if (onlinePrinters.length > 0) {
            setSelectedPrinterId(onlinePrinters[0]._id);
          }
        } else {
          loadMockPrinters();
        }
      } catch (e) {
        console.warn("Failed to fetch printers, loading mock printers (Demo Mode)");
        loadMockPrinters();
      }
    };
    fetchPrinters();
    trackEvent("screen_viewed", { screenName: "create_order" });
  }, [dbUser?.role]);

  const loadMockPrinters = () => {
    const mock = [
      { _id: "p_1", name: "Library Printer A", location: "Library Floor 1", printerType: "bw", status: "online", pagesPerMinute: 15, currentQueueLength: 1 },
      { _id: "p_2", name: "CSE Lab Printer B", location: "CSE Block B", printerType: "color", status: "online", pagesPerMinute: 12, currentQueueLength: 3 },
      { _id: "p_3", name: "Admin Block C", location: "Ground Floor", printerType: "bw", status: "online", pagesPerMinute: 20, currentQueueLength: 5 },
    ] as Printer[];
    setPrinters(mock);
    setSelectedPrinterId(mock[0]._id);
  };

  const selectedPrinter = printers.find((p) => p._id === selectedPrinterId);

  // Dynamic cost calculation
  const calculatedCost = React.useMemo(() => {
    const pagesCount = parseInt(totalPages) || 0;
    const copiesCount = parseInt(copies) || 0;
    if (pagesCount <= 0 || copiesCount <= 0 || !selectedPrinter) return 0;

    const rate = selectedPrinter.printerType === "color" ? 5 : 2;
    let cost = pagesCount * copiesCount * rate;
    if (priority) {
      cost = cost * 1.5;
    }
    return Math.ceil(cost);
  }, [totalPages, copies, selectedPrinter, priority]);

  // Pick Document
  const pickPdf = async () => {
    setFormError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setUploadState("uploading");
        trackEvent("pdf_upload_started", { fileName: file.name });

        const formData = new FormData();
        if (Platform.OS === "web" && file.file) {
          formData.append("file", file.file, file.name);
        } else {
          formData.append("file", {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || "application/pdf",
          } as any);
        }

        const uploadResponse = await uploadFile(formData);
        
        if (uploadResponse && uploadResponse.success && uploadResponse.fileUrl) {
          setFileUrl(uploadResponse.fileUrl);
          setUploadState("success");
          trackEvent("pdf_upload_completed", { fileName: file.name });
        } else {
          setUploadState("failed");
          setFormError("File upload to server failed. Please try again.");
          trackEvent("pdf_upload_failed", { error: "Server response error" });
        }
      }
    } catch (e: any) {
      console.error(e);
      setUploadState("failed");
      const message = e.response?.data?.message || "Failed to select or upload file.";
      setFormError(message);
      trackEvent("pdf_upload_failed", { error: message });
    }
  };

  // Submit Order
  const onSubmit = async () => {
    setFormError("");
    if (!selectedPrinterId) {
      setFormError("Please select a printer.");
      return;
    }
    if (!selectedFile || !fileUrl) {
      setFormError("Please upload a PDF document.");
      return;
    }
    const pagesCount = parseInt(totalPages);
    if (!totalPages || isNaN(pagesCount) || pagesCount <= 0) {
      setFormError("Please enter a valid page count.");
      return;
    }
    const copiesCount = parseInt(copies);
    if (!copies || isNaN(copiesCount) || copiesCount <= 0) {
      setFormError("Please enter a valid number of copies.");
      return;
    }
    if (priority && !priorityReason.trim()) {
      setFormError("Please describe why this print job needs emergency priority.");
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        printerId: selectedPrinterId,
        fileName: selectedFile.name,
        fileUrl,
        totalPages: pagesCount,
        copies: copiesCount,
        printSides,
        priorityLevel: priority ? "priority" : "normal",
        priorityReason: priority ? priorityReason.trim() : "",
        confidential,
      };

      const response = await createOrder(orderPayload);
      if (response && response.success) {
        trackEvent("order_created", {
          printerId: selectedPrinterId,
          printerName: selectedPrinter?.name,
          totalPages: pagesCount,
          copies: copiesCount,
          printSides,
          priorityLevel: priority ? "priority" : "normal",
          priorityReason: priority ? priorityReason.trim() : undefined,
          confidential,
          estimatedCost: calculatedCost,
        });

        // Trigger Success Checkmark animation
        setOrderSuccess(true);
        successScale.value = withSpring(1, { damping: 10 });
        successOpacity.value = withTiming(1, { duration: 200 });

        setTimeout(() => {
          router.replace("/(tabs)/orders");
        }, 1500);
      } else {
        setFormError("Failed to submit order to the server.");
      }
    } catch (e: any) {
      console.error(e);
      setFormError(e.response?.data?.message || "An error occurred during order submission.");
    } finally {
      setLoading(false);
    }
  };

  const animatedSuccessStyle = useAnimatedStyle(() => {
    return {
      opacity: successOpacity.value,
      transform: [{ scale: successScale.value }],
    };
  });

  const isDark = colors.background === "#020617";

  return (
    <View style={tw("flex-1 bg-background")}>
      <AppHeader title="New Print Job" showBack />

      <ScrollView contentContainerStyle={tw("p-5 pb-16")} showsVerticalScrollIndicator={false}>
        {formError ? (
          <View style={tw("flex flex-row items-center bg-red-50 dark:bg-red-950/20 border border-red-500/20 rounded-xl p-4 mb-4 gap-3")}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <Text style={tw("flex-1 text-xs font-inter text-red-500")}>{formError}</Text>
          </View>
        ) : null}

        {/* STEP 1: Upload PDF */}
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Step 1: Upload Document
        </Text>
        <AppCard style={tw("mb-6 justify-center items-center py-8 bg-card")}>
          {uploadState === "idle" && (
            <Pressable onPress={pickPdf} style={tw("items-center justify-center w-full")}>
              <View style={tw("h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center mb-3")}>
                <Feather name="upload-cloud" size={24} color={colors.accent} />
              </View>
              <Text style={tw("text-sm font-inter-semibold text-primary font-bold mb-1")}>
                Select PDF Document
              </Text>
              <Text style={tw("text-xs font-inter text-secondary")}>
                PDF files up to 20MB supported
              </Text>
            </Pressable>
          )}

          {uploadState === "uploading" && (
            <View style={tw("items-center justify-center w-full")}>
              <ActivityIndicator color={colors.accent} size="large" style={tw("mb-3")} />
              <Text style={tw("text-sm font-inter text-primary mb-1")}>
                Uploading document to server...
              </Text>
              <View style={tw("w-2/3 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3")}>
                <View style={[tw("h-full bg-emerald-500"), { width: "70%" }]} />
              </View>
            </View>
          )}

          {uploadState === "success" && selectedFile && (
            <View style={tw("items-center justify-center w-full")}>
              <View style={tw("h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center mb-3")}>
                <Feather name="check-circle" size={26} color={colors.accent} />
              </View>
              <Text style={tw("text-sm font-inter-bold text-primary font-bold text-center px-4 mb-1")} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={tw("text-xs font-inter text-secondary mb-4")}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded
              </Text>
              <AppButton
                title="Change File"
                onPress={pickPdf}
                variant="outline"
                style={tw("py-2 px-4 h-10")}
              />
            </View>
          )}

          {uploadState === "failed" && (
            <Pressable onPress={pickPdf} style={tw("items-center justify-center w-full")}>
              <View style={tw("h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/20 items-center justify-center mb-3")}>
                <Feather name="alert-circle" size={24} color={colors.danger} />
              </View>
              <Text style={tw("text-sm font-inter-semibold text-red-500 font-bold mb-1")}>
                Upload Failed
              </Text>
              <Text style={tw("text-xs font-inter text-secondary")}>
                Tap here to retry document picker.
              </Text>
            </Pressable>
          )}
        </AppCard>

        {/* STEP 2: Select Printer */}
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Step 2: Select Printer
        </Text>
        <View style={tw("mb-6 gap-3")}>
          {printers.length === 0 ? (
            <Text style={tw("text-xs font-inter text-secondary italic")}>
              No online printers available. Using Demo mock.
            </Text>
          ) : (
            printers.map((printer) => (
              <Pressable
                key={printer._id}
                onPress={() => setSelectedPrinterId(printer._id)}
                style={[
                  tw(`flex flex-row items-center justify-between p-4 bg-card rounded-2xl border ${selectedPrinterId === printer._id ? "border-emerald-500" : "border-border"}`),
                  selectedPrinterId === printer._id ? { borderWidth: 2 } : {},
                ]}
              >
                <View style={tw("flex-1 mr-3")}>
                  <View style={tw("flex-row items-center gap-2 mb-1")}>
                    <Feather name="printer" size={16} color={selectedPrinterId === printer._id ? colors.accent : colors.textSecondary} />
                    <Text style={tw(`text-sm font-inter-semibold font-bold ${selectedPrinterId === printer._id ? "text-emerald-500" : "text-primary"}`)}>
                      {printer.name}
                    </Text>
                  </View>
                  <Text style={tw("text-xs font-inter text-secondary")}>
                    {printer.location} • {printer.printerType === "color" ? "Color (₹5/pg)" : "B&W (₹2/pg)"}
                  </Text>
                </View>

                <View style={tw("items-end")}>
                  <Text style={tw("text-[9px] font-inter text-secondary uppercase tracking-wider")}>
                    Queue
                  </Text>
                  <Text style={tw("text-xs font-space-bold text-primary font-bold mt-0.5")}>
                    {printer.currentQueueLength} jobs
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* STEP 3: Print Options */}
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Step 3: Printing Options
        </Text>
        <AppCard style={tw("mb-6 bg-card")}>
          <View style={tw("flex-row justify-between gap-4 mb-4")}>
            <View style={tw("flex-1")}>
              <AppInput
                label="Total Pages"
                value={totalPages}
                onChangeText={setTotalPages}
                placeholder="e.g. 5"
                keyboardType="numeric"
              />
            </View>
            <View style={tw("flex-1")}>
              <AppInput
                label="Copies"
                value={copies}
                onChangeText={setCopies}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={tw("py-3 border-b border-border")}>
            <Text style={tw("text-sm font-inter-semibold text-primary font-bold mb-2")}>
              Print Sides
            </Text>
            <View style={tw("flex-row gap-2")}>
              <Pressable
                onPress={() => setPrintSides("single")}
                style={tw(
                  `flex-1 rounded-xl border px-3 py-3 items-center ${
                    printSides === "single"
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-card border-border"
                  }`
                )}
                accessibilityRole="button"
              >
                <Text
                  style={tw(
                    `text-xs font-inter-semibold font-bold text-center ${
                      printSides === "single" ? "text-white" : "text-primary"
                    }`
                  )}
                >
                  One-sided
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPrintSides("double")}
                style={tw(
                  `flex-1 rounded-xl border px-3 py-3 items-center ${
                    printSides === "double"
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-card border-border"
                  }`
                )}
                accessibilityRole="button"
              >
                <Text
                  style={tw(
                    `text-xs font-inter-semibold font-bold text-center ${
                      printSides === "double" ? "text-white" : "text-primary"
                    }`
                  )}
                >
                  Double-sided
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Priority switch */}
          <View style={tw("flex flex-row items-center justify-between py-3 border-b border-border")}>
            <View style={tw("flex-1 mr-2")}>
              <Text style={tw("text-sm font-inter-semibold text-primary font-bold mb-0.5")}>
                Emergency Priority Surcharge
              </Text>
              <Text style={tw("text-xs font-inter text-secondary")}>
                Places job at top of queue (+1.5x rate multiplier)
              </Text>
            </View>
            <Switch
              value={priority}
              onValueChange={setPriority}
              trackColor={{ false: "#CBD5E1", true: "#10B981" }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : ""}
            />
          </View>

          {priority && (
            <View style={tw("mt-4")}>
              <AppInput
                label="Emergency Reason"
                value={priorityReason}
                onChangeText={setPriorityReason}
                placeholder="e.g. exam hall ticket, urgent submission, medical document"
                autoCapitalize="sentences"
              />
            </View>
          )}

          {/* Confidential switch */}
          <View style={tw("flex flex-row items-center justify-between py-3")}>
            <View style={tw("flex-1 mr-2")}>
              <Text style={tw("text-sm font-inter-semibold text-primary font-bold mb-0.5")}>
                Confidential Printing
              </Text>
              <Text style={tw("text-xs font-inter text-secondary")}>
                Requires OTP confirmation at the printer to release
              </Text>
            </View>
            <Switch
              value={confidential}
              onValueChange={setConfidential}
              trackColor={{ false: "#CBD5E1", true: "#10B981" }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : ""}
            />
          </View>
        </AppCard>

        {/* STEP 4: Review and Pricing */}
        <Text style={tw("text-sm font-space-bold text-primary mb-3 uppercase tracking-wider font-bold")}>
          Step 4: Pricing & Queue Review
        </Text>
        <AppCard style={tw("mb-8 bg-card")}>
          <View style={tw("flex flex-row justify-between mb-2")}>
            <Text style={tw("text-sm font-inter text-secondary")}>Pages per copy</Text>
            <Text style={tw("text-sm font-inter text-primary")}>{totalPages || "0"} pages</Text>
          </View>
          <View style={tw("flex flex-row justify-between mb-2")}>
            <Text style={tw("text-sm font-inter text-secondary")}>Number of copies</Text>
            <Text style={tw("text-sm font-inter text-primary")}>{copies || "1"} copies</Text>
          </View>
          <View style={tw("flex flex-row justify-between mb-2")}>
            <Text style={tw("text-sm font-inter text-secondary")}>Print sides</Text>
            <Text style={tw("text-sm font-inter text-primary")}>
              {printSides === "double" ? "Double-sided" : "One-sided"}
            </Text>
          </View>
          <View style={tw("flex flex-row justify-between mb-2")}>
            <Text style={tw("text-sm font-inter text-secondary")}>Printer Type</Text>
            <Text style={tw("text-sm font-inter text-primary")}>
              {selectedPrinter?.printerType === "color" ? "Color Print (₹5/pg)" : "Black & White (₹2/pg)"}
            </Text>
          </View>
          <View style={tw("flex flex-row justify-between mb-4 pb-4 border-b border-border")}>
            <Text style={tw("text-sm font-inter text-secondary")}>Priority multiplier</Text>
            <Text style={tw("text-sm font-inter text-primary")}>{priority ? "1.5x" : "1.0x"}</Text>
          </View>

          <View style={tw("flex flex-row justify-between items-center")}>
            <Text style={tw("text-base font-inter-bold text-primary font-bold")}>Estimated Cost</Text>
            <Text style={tw("text-2xl font-space-bold text-emerald-500 font-bold")}>₹{calculatedCost.toFixed(2)}</Text>
          </View>
        </AppCard>

        {/* Submit button */}
        <AppButton
          title="Submit Print Job"
          onPress={onSubmit}
          loading={loading}
          disabled={uploadState !== "success"}
          variant="primary"
          style={tw("w-full py-4.5")}
        />
      </ScrollView>

      {/* Reanimated Success Checkmark Overlay */}
      {orderSuccess && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            tw("bg-slate-950/90 justify-center items-center z-[999]"),
            animatedSuccessStyle,
          ]}
        >
          <View style={tw("h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-950/30 items-center justify-center mb-6 border-2 border-emerald-500")}>
            <Feather name="check" size={48} color={colors.accent} />
          </View>
          <Text style={tw("text-2xl font-space-bold text-white mb-2")}>
            Order Submitted!
          </Text>
          <Text style={tw("text-sm font-inter text-slate-400 text-center px-10")}>
            Redirecting to queue tracker dashboard...
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
