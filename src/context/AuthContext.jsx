import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [myBusiness, setMyBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async (authenticatedUser) => {
    if (!authenticatedUser) {
      setUserData(null);
      setIsSuperAdmin(false);
      setMyBusiness(null);
      return;
    }

    try {
      // 1. Check super admin status
      const superAdminDoc = await getDoc(doc(db, "super_admins", authenticatedUser.uid));
      const legacyAdminDoc = await getDoc(doc(db, "admins", authenticatedUser.uid));
      const isSuper = superAdminDoc.exists() || legacyAdminDoc.exists();
      setIsSuperAdmin(isSuper);

      // 2. Fetch or create user record
      const userRef = doc(db, "users", authenticatedUser.uid);
      const userSnap = await getDoc(userRef);
      let profile = null;

      if (!userSnap.exists()) {
        profile = {
          name: authenticatedUser.displayName || authenticatedUser.email || "User",
          email: authenticatedUser.email || "",
          role: isSuper ? "super_admin" : "customer",
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        };
        await setDoc(userRef, profile, { merge: true });
      } else {
        profile = userSnap.data();
        await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
      }
      setUserData(profile);

      // 3. Check if user owns or manages any business
      const q = query(collection(db, "businesses"), where("ownerId", "==", authenticatedUser.uid));
      const bizSnap = await getDocs(q);
      if (!bizSnap.empty) {
        const bizDoc = bizSnap.docs[0];
        setMyBusiness({ id: bizDoc.id, ...bizDoc.data() });
      } else if (profile?.businessId) {
        const assignedBiz = await getDoc(doc(db, "businesses", profile.businessId));
        if (assignedBiz.exists()) {
          setMyBusiness({ id: assignedBiz.id, ...assignedBiz.data() });
        } else {
          setMyBusiness(null);
        }
      } else {
        setMyBusiness(null);
      }
    } catch (err) {
      console.error("Error loading user context:", err);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      await refreshUserData(authenticatedUser);
      setLoading(false);
    });
  }, [refreshUserData]);

  const login = useCallback((email, password) => signInWithEmailAndPassword(auth, email, password), []);
  const google = useCallback(() => signInWithPopup(auth, googleProvider), []);
  const logout = useCallback(() => signOut(auth), []);
  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

  // Send email verification to current user
  const sendVerificationEmail = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  // Reload the Firebase user and return fresh emailVerified status
  const reloadAndCheckVerified = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setUser({ ...auth.currentUser });
      return auth.currentUser.emailVerified;
    }
    return false;
  }, []);

  const signup = useCallback(async (name, email, password, role = "customer") => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const userRef = doc(db, "users", cred.user.uid);
    const profile = {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    };
    await setDoc(userRef, profile, { merge: true });
    setUserData(profile);
    return cred.user;
  }, []);

  const isBusinessOwner = useCallback((businessId) => {
    if (!user) return false;
    // Super admin is strictly restricted from tenant business ownership
    if (isSuperAdmin) return false;
    if (myBusiness?.id === businessId || myBusiness?.slug === businessId) return true;
    return false;
  }, [user, isSuperAdmin, myBusiness]);

  const value = useMemo(() => ({
    user,
    userData,
    isSuperAdmin,
    isAdmin: isSuperAdmin, // backwards compatibility alias
    myBusiness,
    myBusinessSlug: myBusiness?.slug,
    isBusinessOwner,
    loading,
    login,
    signup,
    google,
    logout,
    resetPassword,
    sendVerificationEmail,
    reloadAndCheckVerified,
    refreshUserData: () => refreshUserData(user),
  }), [user, userData, isSuperAdmin, myBusiness, isBusinessOwner, loading, login, signup, google, logout, resetPassword, sendVerificationEmail, reloadAndCheckVerified, refreshUserData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
