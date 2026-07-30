"use client";
import { Button } from "@mui/material";
import { auth } from "@/libs/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

type LoginGoogleButtonProps = {
    disabled?: boolean;
    onBeforeLogin?: () => void;
    onAfterLogin?: () => void;
};

export default function LoginGoogleButton({ disabled, onBeforeLogin, onAfterLogin }: LoginGoogleButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleLoginWithGoogle = async () => {
        try {
            setLoading(true);
            if (onBeforeLogin) {
                onBeforeLogin();
            }
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;
            const user = result.user;
            console.log("User Info:", user);
            console.log("Access Token:", token);

        } catch (error) {
            console.error("Error logging in with Google:", error);
            enqueueSnackbar("Error logging in with Google. Please try again.", { variant: "error" });
        } finally {
            setLoading(false);
            if (onAfterLogin) {
                onAfterLogin();
            }
        }
    }

    return (
        <Button
            variant="outlined"
            color="primary"
            onClick={handleLoginWithGoogle}
            disabled={disabled}
            loading={loading}
            sx={{ py: 1 }}
            fullWidth>
            Login with Google
        </Button>
    );
}
