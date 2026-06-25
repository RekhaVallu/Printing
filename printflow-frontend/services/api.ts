import axios, { AxiosHeaders } from "axios";
import { API_BASE_URL } from "./config";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
});

let tokenFetcher: (() => Promise<string | null>) | null = null;

export const setTokenFetcher = (fetcher: () => Promise<string | null>) => {
    tokenFetcher = fetcher;
};

api.interceptors.request.use(
    async (config) => {
        if (tokenFetcher) {
            try {
                const token = await tokenFetcher();
                if (token) {
                    config.headers = AxiosHeaders.from(config.headers);
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error("Axios interceptor: failed to get token", error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
