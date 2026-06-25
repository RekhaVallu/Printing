import { api } from "./api";

export const getPrinters = async () => {
    const response =
        await api.get("/printers");

    return response.data;
};

export const createPrinter = async (data: any) => {
    const response = await api.post("/printers", data);
    return response.data;
};

export const updatePrinter = async (id: string, data: any) => {
    const response = await api.patch(`/printers/${id}`, data);
    return response.data;
};

export const deletePrinter = async (id: string) => {
    const response = await api.delete(`/printers/${id}`);
    return response.data;
};

export const getRecommendations =
    async (
        pages: number,
        copies: number,
        priorityLevel: string
    ) => {

        const response =
            await api.get(
                "/printers/recommendations",
                {
                    params: {
                        pages,
                        copies,
                        priorityLevel
                    }
                }
            );

        return response.data;
    };
