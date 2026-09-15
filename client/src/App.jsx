import { useState, useEffect } from "react";
import api from "./services/api";

export default function App() {
  const [authMode, setAuthMode] = useState("login"); // "login", "register", "forgot", "reset"
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "admin"

  // Show/Hide Password Toggle States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({ token: "", password: "" });

  // App Auth States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Floating Toast State
  const [toast, setToast] = useState(null);

  // Admin Dashboard States
  const [adminStats, setAdminStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");

  const showToast = (type, text) => {
    setToast({ type, text, id: Date.now() });
  };

  // Auto dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check auth session on mount
  useEffect(() => {
    const fetchSession = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await api.get("/api/users/me");
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          setProfileData({ name: res.data.user.name, email: res.data.user.email });
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        handleLogout(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    fetchSession();
  }, []);

  // Fetch admin dashboard data when admin tab is selected
  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "admin") {
      fetchAdminData();
    }
  }, [user, activeTab]);

  const fetchAdminData = async () => {
    try {
      const statsRes = await api.get("/api/admin/stats");
      setAdminStats(statsRes.data.stats);

      const usersRes = await api.get("/api/admin/users");
      setUsersList(usersRes.data.users);
    } catch (err) {
      console.error("Fetch Admin Data Error:", err);
      showToast("error", err.response?.data?.message || "Failed to load admin data");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "bg-slate-700", percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", percent: 33 };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500", percent: 66 };
    return { score, label: "Strong", color: "bg-emerald-500", percent: 100 };
  };

  const isPasswordStrong = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(pwd);
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (authMode === "register") {
      if (formData.password !== formData.confirmPassword) {
        showToast("error", "Passwords do not match.");
        return;
      }
      if (!isPasswordStrong(formData.password)) {
        showToast(
          "error",
          "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character."
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === "login") {
        const res = await api.post("/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        setUser(res.data.user);
        setProfileData({ name: res.data.user.name, email: res.data.user.email });
        showToast("success", "Successfully logged in!");
      } else if (authMode === "register") {
        const res = await api.post("/api/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        setUser(res.data.user);
        setProfileData({ name: res.data.user.name, email: res.data.user.email });
        showToast("success", res.data.message || "Account created successfully!");
      }
    } catch (error) {
      console.error("Auth Error:", error);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Cannot connect to backend server. Make sure node server.js is running."
          : error.message) ||
        "Authentication failed";
      showToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/auth/forgot-password", { email: forgotEmail });
      showToast("success", res.data.message);
      if (res.data.demoResetToken) {
        setResetData({ ...resetData, token: res.data.demoResetToken });
        setAuthMode("reset");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Submit Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong(resetData.password)) {
      showToast(
        "error",
        "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/reset-password", resetData);
      showToast("success", res.data.message);
      setAuthMode("login");
      setResetData({ token: "", password: "" });
    } catch (error) {
      showToast("error", error.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.put("/api/users/me", profileData);
      setUser(res.data.user);
      showToast("success", "Profile updated successfully!");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }
    if (!isPasswordStrong(passwordData.newPassword)) {
      showToast(
        "error",
        "New password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.put("/api/users/me/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast("success", res.data.message);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showToast("error", error.response?.data?.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "deactivated" : "active";
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      showToast("success", `User status changed to ${newStatus}`);
      fetchAdminData();
    } catch (error) {
      showToast("error", error.response?.data?.message || "Status update failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      showToast("success", "User deleted successfully");
      fetchAdminData();
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to delete user");
    }
  };

  // Logout Handler
  const handleLogout = async (showMessage = true) => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/api/auth/logout", { refreshToken });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setActiveTab("profile");
      if (showMessage) {
        showToast("success", "Logged out successfully");
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  const regStrength = getPasswordStrength(formData.password);
  const changeStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans p-4 md:p-8 relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-5 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === "success" ? (
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{toast.text}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-slate-400 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* LOGGED IN USER INTERFACE */}
        {user ? (
          <div className="space-y-6">
            {/* HEADER BAR */}
            <header className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-600/30 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl uppercase">
                  {user.name ? user.name.charAt(0) : "U"}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold text-white">{user.name}</h1>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>

              {/* NAVIGATION TABS & LOGOUT */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                    activeTab === "profile"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  My Profile
                </button>

                {user.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                      activeTab === "admin"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => handleLogout(true)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* TAB 1: PROFILE & SETTINGS */}
            {activeTab === "profile" && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* EDIT PROFILE CARD */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                    Edit Profile
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/20 transition"
                    >
                      Update Profile
                    </button>
                  </form>
                </div>

                {/* CHANGE PASSWORD CARD */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                    Change Password
                  </h2>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showCurrentPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? "🙈" : "👁️"}
                        </button>
                      </div>

                      {/* LIVE STRENGTH METER */}
                      {passwordData.newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">Strength:</span>
                            <span className={`font-semibold ${changeStrength.color.replace('bg-', 'text-')}`}>
                              {changeStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${changeStrength.color}`}
                              style={{ width: `${changeStrength.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                        minLength={8}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-white border border-slate-700 rounded-xl transition"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: ADMIN DASHBOARD */}
            {activeTab === "admin" && user.role === "admin" && (
              <div className="space-y-6">
                {/* SYSTEM STATS METRICS */}
                {adminStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Total Users</p>
                      <p className="text-2xl font-bold text-white mt-1">{adminStats.totalUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Active Users</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{adminStats.activeUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Deactivated Users</p>
                      <p className="text-2xl font-bold text-rose-400 mt-1">{adminStats.deactivatedUsers}</p>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Admin Count</p>
                      <p className="text-2xl font-bold text-purple-400 mt-1">{adminStats.adminCount}</p>
                    </div>
                  </div>
                )}

                {/* USER MANAGEMENT TABLE */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">User Management</h2>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-xs"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                          <th className="pb-3 px-2">User</th>
                          <th className="pb-3 px-2">Role</th>
                          <th className="pb-3 px-2">Status</th>
                          <th className="pb-3 px-2">Joined</th>
                          <th className="pb-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-sm">
                        {usersList
                          .filter(
                            (u) =>
                              u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(adminSearch.toLowerCase())
                          )
                          .map((u) => (
                            <tr key={u._id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-2">
                                <p className="font-semibold text-white">{u.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                                    u.role === "admin"
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                      : "bg-slate-800 text-slate-300"
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                                    u.status === "active"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-xs text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-2 text-right space-x-2">
                                {u._id !== user._id && (
                                  <>
                                    <button
                                      onClick={() => handleToggleUserStatus(u._id, u.status)}
                                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                                        u.status === "active"
                                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                      }`}
                                    >
                                      {u.status === "active" ? "Deactivate" : "Reactivate"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u._id)}
                                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* AUTHENTICATION CONTAINER (LOGIN / REGISTER / FORGOT / RESET) */
          <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* AUTH HEADER */}
            <div className="p-6 text-center border-b border-slate-800">
              <h1 className="text-2xl font-bold text-white">Auth & RBAC System</h1>
              <p className="text-xs text-slate-400 mt-1">Enterprise JWT Authentication</p>
            </div>

            {/* MODE SELECTOR */}
            {authMode !== "forgot" && authMode !== "reset" && (
              <div className="grid grid-cols-2 bg-slate-950/60 p-1 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`py-3 text-sm font-semibold rounded-xl transition ${
                    authMode === "login"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`py-3 text-sm font-semibold rounded-xl transition ${
                    authMode === "register"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            <div className="p-6">
              {/* LOGIN / REGISTER FORM */}
              {(authMode === "login" || authMode === "register") && (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase">
                        Password
                      </label>
                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => setAuthMode("forgot")}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="••••••••"
                        required
                        minLength={authMode === "register" ? 8 : 6}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {/* LIVE PASSWORD STRENGTH METER (REGISTER MODE) */}
                    {authMode === "register" && formData.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Strength:</span>
                          <span className={`font-semibold ${regStrength.color.replace('bg-', 'text-')}`}>
                            {regStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${regStrength.color}`}
                            style={{ width: `${regStrength.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {authMode === "register" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleFormChange}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white"
                          >
                            {showConfirmPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>

                      {/* PASSWORD REQUIREMENTS GUIDE */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-300">Password Requirements:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>At least 8 characters long</li>
                          <li>Uppercase & lowercase letter</li>
                          <li>Number & special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>{authMode === "login" ? "Sign In" : "Create Account"}</span>
                    )}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <h2 className="text-lg font-bold text-white text-center">Forgot Password</h2>
                  <p className="text-xs text-slate-400 text-center">
                    Enter your email address to receive password reset instructions.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}

              {/* RESET PASSWORD FORM */}
              {authMode === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <h2 className="text-lg font-bold text-white text-center">Reset Password</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={resetData.token}
                      onChange={(e) => setResetData({ ...resetData, token: e.target.value })}
                      placeholder="Enter reset token"
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={resetData.password}
                      onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-xl shadow-lg shadow-emerald-600/30 transition"
                  >
                    Set New Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}