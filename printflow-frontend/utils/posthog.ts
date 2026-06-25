import PostHog from "posthog-react-native";

let posthogInstance: PostHog | null = null;

export const initPostHog = async () => {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (apiKey) {
    try {
      posthogInstance = new PostHog(apiKey, { host });
      console.log("PostHog initialized successfully.");
    } catch (e) {
      console.error("PostHog initialization failed", e);
    }
  } else {
    console.log("PostHog API Key missing. Running in mock/console mode.");
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log(`[Analytics Tracking]: ${eventName}`, properties);
  if (posthogInstance) {
    posthogInstance.capture(eventName, properties);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  console.log(`[Analytics User Identify]: ${userId}`, properties);
  if (posthogInstance) {
    posthogInstance.identify(userId, properties);
  }
};

export const resetUser = () => {
  console.log("[Analytics Reset]");
  if (posthogInstance) {
    posthogInstance.reset();
  }
};
