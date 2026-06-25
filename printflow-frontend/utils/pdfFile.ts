import { Alert, Linking, Platform } from "react-native";

const safeFileName = (fileName?: string) => {
  const fallback = "printflow-document.pdf";
  const name = (fileName || fallback).trim() || fallback;
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
};

const fetchPdfBlob = async (fileUrl: string) => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Could not fetch the PDF file.");
  }

  const blob = await response.blob();
  return new Blob([blob], { type: "application/pdf" });
};

export const openPdfFile = async (fileUrl?: string, fileName?: string) => {
  if (!fileUrl) {
    Alert.alert("PDF unavailable", "This order does not have a PDF link.");
    return;
  }

  try {
    if (Platform.OS === "web") {
      const pdfBlob = await fetchPdfBlob(fileUrl);
      const objectUrl = URL.createObjectURL(pdfBlob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      return;
    }

    const supported = await Linking.canOpenURL(fileUrl);
    if (!supported) {
      Alert.alert("PDF unavailable", "This PDF link cannot be opened on this device.");
      return;
    }

    await Linking.openURL(fileUrl);
  } catch (error: any) {
    Alert.alert("PDF unavailable", error?.message || "Could not open this PDF.");
  }
};

export const downloadPdfFile = async (fileUrl?: string, fileName?: string) => {
  if (!fileUrl) {
    Alert.alert("PDF unavailable", "This order does not have a PDF link.");
    return;
  }

  try {
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = safeFileName(fileName);
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    await openPdfFile(fileUrl, fileName);
  } catch (error: any) {
    Alert.alert("Download failed", error?.message || "Could not download this PDF.");
  }
};
