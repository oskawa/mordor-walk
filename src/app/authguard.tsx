"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");

      if (!token || !userId || !username) {
        router.push("/"); // Redirect to homepage
      } else {
        setIsAuthenticated(true); // Allow rendering of children
      }
    }
  }, [router]);

  if (!isAuthenticated) {
    return null; // Prevents flickering before redirecting
  }

  return <>{children}</>;
}
