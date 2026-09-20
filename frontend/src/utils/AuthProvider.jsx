import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../utils/firebase";
import { AuthContext } from "./AuthContext";
import SuspendedDialog from "../component/SuspendPopup";
import { buildApiUrl, getAuthHeaders } from "./api";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [suspended, setSuspended] = useState(false);
  const [suspendMessage, setSuspendMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setSuspended(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(buildApiUrl("/users/me"), {
          headers: {
            ...(await getAuthHeaders()),
          },
        });

        if (res.status === 403) {
          const data = await res.json();

          setSuspendMessage(
            data.message ||
              "Your account has been suspended. Please contact support."
          );
          setSuspended(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error("Profile fetch failed");
        }

        const dbUser = await res.json();

        setUser({
          uid: dbUser.firebaseUid ?? firebaseUser.uid,
          email: dbUser.email ?? firebaseUser.email ?? undefined,
          phoneNumber: dbUser.phoneNumber ?? firebaseUser.phoneNumber ?? undefined,
          displayName:
            dbUser.name ??
            firebaseUser.displayName ??
            firebaseUser.email ??
            firebaseUser.phoneNumber ??
            "User",
          photoURL: firebaseUser.photoURL,
          role: dbUser.role,
          suspended: dbUser.suspended,
        });
      } catch (err) {
        console.error("Failed to load user profile", err);
        setUser(null);
        await signOut(auth);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setSuspended(false);
    setSuspendMessage("");
  };

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}

      <SuspendedDialog
        open={suspended}
        message={suspendMessage}
        onConfirm={handleLogout}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
