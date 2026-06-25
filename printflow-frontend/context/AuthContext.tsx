import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { syncUser } from "../services/userService";
import { setTokenFetcher } from "../services/api";
import { identifyUser, resetUser, trackEvent } from "../utils/posthog";

export interface DBUser {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "operator" | "admin";
  rollNo?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextProps {
  dbUser: DBUser | null;
  isLoadingDbUser: boolean;
  isProfileCompleted: boolean;
  refetchDbUser: () => Promise<void>;
  syncProfile: (rollNo: string, department: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  const userId = user?.id;
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";
  const name = user?.fullName || user?.username || user?.firstName || "User";
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isLoadingDbUser, setIsLoadingDbUser] = useState<boolean>(true);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Set the token fetcher in our api service
  useEffect(() => {
    if (isSignedIn) {
      setTokenFetcher(async () => {
        try {
          return await getTokenRef.current();
        } catch (e) {
          console.error("AuthContext: Failed to fetch token", e);
          return null;
        }
      });
    } else {
      setTokenFetcher(() => Promise.resolve(null));
      setDbUser(null);
      setIsLoadingDbUser(false);
      resetUser();
    }
  }, [isSignedIn]);

  const performSync = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setDbUser(null);
      setIsLoadingDbUser(false);
      return;
    }

    try {
      setIsLoadingDbUser(true);

      const response = await syncUser({
        clerkId: userId,
        email,
        name,
      });

      if (response && response.success && response.data) {
        const userData: DBUser = response.data;
        setDbUser(userData);
        identifyUser(userData.clerkId, {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          rollNo: userData.rollNo,
          department: userData.department,
        });
      }
    } catch (error) {
      console.error("AuthContext: failed to sync user with backend DB", error);
    } finally {
      setIsLoadingDbUser(false);
    }
  }, [email, isSignedIn, name, userId]);

  useEffect(() => {
    if (isSignedIn && userId) {
      performSync();
    }
  }, [isSignedIn, performSync, userId]);

  const syncProfile = async (rollNo: string, department: string) => {
    if (!isSignedIn || !userId) return;
    try {
      setIsLoadingDbUser(true);

      const response = await syncUser({
        clerkId: userId,
        email,
        name,
        rollNo,
        department,
      });

      if (response && response.success && response.data) {
        const userData: DBUser = response.data;
        setDbUser(userData);
        trackEvent("profile_completed", {
          rollNo,
          department,
          role: userData.role,
        });
      }
    } catch (e) {
      console.error("AuthContext: failed to complete profile", e);
      throw e;
    } finally {
      setIsLoadingDbUser(false);
    }
  };

  const isProfileCompleted = React.useMemo(() => {
    if (!dbUser) return false;
    // Admins and Operators don't need to complete roll number/department details.
    if (dbUser.role === "admin" || dbUser.role === "operator") {
      return true;
    }
    return !!(dbUser.rollNo && dbUser.department);
  }, [dbUser]);

  return (
    <AuthContext.Provider
      value={{
        dbUser,
        isLoadingDbUser,
        isProfileCompleted,
        refetchDbUser: performSync,
        syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
};
