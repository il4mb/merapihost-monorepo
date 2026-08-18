import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAAv0LgJGPvNQPw3xL4XVMRxKuF9fnPCuA",
    authDomain: "merapihost-56b89.firebaseapp.com",
    projectId: "merapihost-56b89",
    storageBucket: "merapihost-56b89.firebasestorage.app",
    messagingSenderId: "375650045032",
    appId: "1:375650045032:web:f17a4abe611cc74f84bfdd",
    measurementId: "G-2P5DJC0D4R"
};

// Initialize Firebase
const app = typeof window !== 'undefined' ? initializeApp(firebaseConfig) : null;
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = typeof window !== 'undefined' ? getAuth(app) : null;

export { app, analytics, auth };