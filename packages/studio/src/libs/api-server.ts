import axios, { AxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';

export const serverApi = axios.create({
    baseURL: process.env.API_URL,
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