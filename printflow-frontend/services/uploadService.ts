import { api } from "./api";

export const uploadFile =
    async (formData: FormData) => {

        const response =
            await api.post(
                "/upload",
                formData,
                {
                    timeout: 60000,
                }
            );

        return response.data;
    };
