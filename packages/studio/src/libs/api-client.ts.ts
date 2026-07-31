import axios, { AxiosRequestConfig } from 'axios';

export const clientApi = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: () => true,
} as AxiosRequestConfig);