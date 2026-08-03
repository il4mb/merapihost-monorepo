import 'server-only';
import axios, { AxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';

const endpoint = String(process.env.API_URL).startsWith("http") ? process.env.API_URL : `http://${process.env.API_URL}`;

export const serverApi = axios.create({
    baseURL: endpoint,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: () => true
} as AxiosRequestConfig);

serverApi.interceptors.request.use(async (config) => {
    const cookieJar = await cookies();
    const token = cookieJar.get("token")?.value;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});