"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const StravaRedirectHandler = () => {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      router.push(`/profile?stravaCallback=true&code=${code}`);
    }
  }, []);

  return null; // No UI, just logic
};

export default StravaRedirectHandler;
