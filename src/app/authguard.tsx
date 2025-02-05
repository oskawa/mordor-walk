'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  // const router = useRouter();

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   const userId = localStorage.getItem("userId");
  //   const username = localStorage.getItem("username");

  //   if (!token || !userId || !username) {
  //     router.push("/"); // Redirect to homepage
  //   }
  // }, [router]);

  return <>{children}</>;
}
