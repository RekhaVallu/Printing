import { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";

import {
    syncUser
} from "../services/userService";

export const useUserSync =
    () => {

        const { user } =
            useUser();

        useEffect(() => {

            if (!user)
                return;

            (async () => {
                await syncUser({
                    clerkId: user.id,
                    email: user.primaryEmailAddress?.emailAddress || "",
                    name: user.fullName || "User"
                });
            })();

        }, [user]);

    };
