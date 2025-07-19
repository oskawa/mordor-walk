"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const GoogleFitCallback = () => {
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
            router.push(`/profile?error=googlefit_auth_failed`);
            return;
        }

        if (code) {
            router.push(`/profile?googlefitCallback=true&code=${code}`);
        } else {
            router.push('/profile');
        }
    }, [router]);

    return (
        <div style={ {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        } }>
            <div>📱</div>
            <p>Connexion à Google Fit en cours...</p>
        </div>
    );
};

export default GoogleFitCallback;