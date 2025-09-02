"use client";

import { useEffect , useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; 

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, router, allowedRoles]);

   if (loading || !authorized) {
    return null; 
  } 

  return children;
}
