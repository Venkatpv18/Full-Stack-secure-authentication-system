import { useState, useEffect } from "react";
import api from "./services/api";

export default function App() {
  const [authMode, setAuthMode] = useState("login"); // "login", "register", "forgot", "reset"
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "admin"

  // Password Visibility Toggles
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

  // Notification Toast State
  const [toast, setToast] = useState(null);

  // Admin Dashboard States
  const [adminStats, setAdminStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");

  const showToast = (type, text) => {
    setToast({ type, text, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Session check on mount
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

  // Fetch admin stats when admin tab is selected
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

  const isPasswordStrong = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(pwd);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: "", color: "bg-slate-700", width: "0%" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    if (score <= 2) return { label: "Weak", color: "bg-rose-500", width: "33%" };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  // Auth Submissions
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
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
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
        showToast("success", "Successfully logged in.");
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
        showToast("success", res.data.message || "Account created successfully.");
      }
    } catch (error) {
      console.error("Auth Error:", error);
      const errorMsg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Cannot connect to server. Ensure backend process is running."
          : error.message) ||
        "Authentication failed";
      showToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong(resetData.password)) {
      showToast(
        "error",
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.put("/api/users/me", profileData);
      setUser(res.data.user);
      showToast("success", "Profile updated.");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }
    if (!isPasswordStrong(passwordData.newPassword)) {
      showToast(
        "error",
        "New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
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

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "deactivated" : "active";
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      showToast("success", `User status updated to ${newStatus}`);
      fetchAdminData();
    } catch (error) {
      showToast("error", error.response?.data?.message || "Action failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      showToast("success", "User deleted.");
      fetchAdminData();
    } catch (error) {
      showToast("error", error.response?.data?.message || "Action failed");
    }
  };

  const handleLogout = async (showMessage = true) => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/api/auth/logout", { refreshToken });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setActiveTab("profile");
      if (showMessage) {
        showToast("success", "Logged out.");
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-200 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  const regStrength = getPasswordStrength(formData.password);
  const changeStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans p-4 md:p-8">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full">
          <div
            className={`p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between shadow-lg ${
              toast.type === "success"
                ? "bg-[#064e3b] border-emerald-600/50 text-emerald-200"
                : "bg-[#7f1d1d] border-rose-600/50 text-rose-200"
            }`}
          >
            <span>{toast.text}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* LOGGED IN USER INTERFACE */}
        {user ? (
          <div className="space-y-6">
            
            {/* HEADER / NAVIGATION BAR */}
            <header className="bg-[#151c2c] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-semibold text-slate-200 text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-semibold text-slate-100">{user.name}</h1>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${
                        user.role === "admin"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-700/60"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    activeTab === "profile"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  Profile Settings
                </button>

                {user.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      activeTab === "admin"
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => handleLogout(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* TAB 1: PROFILE & SETTINGS */}
            {activeTab === "profile" && (
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* EDIT PROFILE CARD */}
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-semibold text-slate-100">Account Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Update your basic profile information.</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-lg transition-colors border border-indigo-500/30"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>

                {/* CHANGE PASSWORD CARD */}
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-semibold text-slate-100">Security & Password</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Ensure a strong, unique password.</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          required
                          className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200"
                        >
                          {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          required
                          minLength={8}
                          className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200"
                        >
                          {showNewPassword ? "Hide" : "Show"}
                        </button>
                      </div>

                      {passwordData.newPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Password strength:</span>
                            <span className="font-medium text-slate-300">{changeStrength.label}</span>
                          </div>
                          <div className="w-full bg-[#0b0f19] h-1 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${changeStrength.color}`}
                              style={{ width: changeStrength.width }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        required
                        minLength={8}
                        className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 font-medium text-xs text-slate-200 rounded-lg border border-slate-700 transition-colors"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: ADMIN DASHBOARD */}
            {activeTab === "admin" && user.role === "admin" && (
              <div className="space-y-6">
                
                {/* SYSTEM STATS */}
                {adminStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#151c2c] border border-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
                      <p className="text-xl font-bold text-slate-100 mt-1">{adminStats.totalUsers}</p>
                    </div>
                    <div className="bg-[#151c2c] border border-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Users</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">{adminStats.activeUsers}</p>
                    </div>
                    <div className="bg-[#151c2c] border border-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Deactivated</p>
                      <p className="text-xl font-bold text-rose-400 mt-1">{adminStats.deactivatedUsers}</p>
                    </div>
                    <div className="bg-[#151c2c] border border-slate-800 p-4 rounded-xl">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admins</p>
                      <p className="text-xl font-bold text-indigo-400 mt-1">{adminStats.adminCount}</p>
                    </div>
                  </div>
                )}

                {/* USER MANAGEMENT TABLE */}
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-100">User Management</h2>
                      <p className="text-xs text-slate-400">View and manage user access permissions.</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 max-w-xs"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[550px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          <th className="pb-2 px-2">User Details</th>
                          <th className="pb-2 px-2">Role</th>
                          <th className="pb-2 px-2">Status</th>
                          <th className="pb-2 px-2">Joined</th>
                          <th className="pb-2 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {usersList
                          .filter(
                            (u) =>
                              u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(adminSearch.toLowerCase())
                          )
                          .map((u) => (
                            <tr key={u._id} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-2">
                                <p className="font-medium text-slate-200">{u.name}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium ${
                                    u.role === "admin"
                                      ? "bg-indigo-950 text-indigo-300 border-indigo-800/60"
                                      : "bg-slate-800 text-slate-300 border-slate-700"
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium ${
                                    u.status === "active"
                                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                                      : "bg-rose-950/60 text-rose-300 border-rose-800/60"
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-2 text-right space-x-2">
                                {u._id !== user._id && (
                                  <>
                                    <button
                                      onClick={() => handleToggleUserStatus(u._id, u.status)}
                                      className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                    >
                                      {u.status === "active" ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u._id)}
                                      className="px-2.5 py-1 text-[11px] font-medium rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors"
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
          <div className="max-w-sm mx-auto bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            
            {/* HEADER */}
            <div className="p-5 text-center border-b border-slate-800">
              <h1 className="text-lg font-semibold text-slate-100">Auth System</h1>
              <p className="text-xs text-slate-400 mt-0.5">Secure JWT Authentication & Authorization</p>
            </div>

            {/* TAB SELECTOR */}
            {authMode !== "forgot" && authMode !== "reset" && (
              <div className="grid grid-cols-2 bg-[#0b0f19] p-1 border-b border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`py-2 text-center rounded transition-colors ${
                    authMode === "login"
                      ? "bg-[#151c2c] text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`py-2 text-center rounded transition-colors ${
                    authMode === "register"
                      ? "bg-[#151c2c] text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            <div className="p-5">
              
              {/* LOGIN / REGISTER FORM */}
              {(authMode === "login" || authMode === "register") && (
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="John Doe"
                        required
                        className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => setAuthMode("forgot")}
                          className="text-[11px] text-indigo-400 hover:underline"
                        >
                          Forgot password?
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
                        className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {authMode === "register" && formData.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Strength:</span>
                          <span className="font-medium text-slate-300">{regStrength.label}</span>
                        </div>
                        <div className="w-full bg-[#0b0f19] h-1 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${regStrength.color}`}
                            style={{ width: regStrength.width }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {authMode === "register" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
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
                            className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200"
                          >
                            {showConfirmPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#0b0f19] rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                        <p className="font-medium text-slate-300">Password rules:</p>
                        <p>• Min 8 chars with uppercase, lowercase, number & symbol</p>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-lg transition-colors border border-indigo-500/30 flex items-center justify-center mt-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>{authMode === "login" ? "Sign In" : "Register Account"}</span>
                    )}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5">
                  <h2 className="text-sm font-semibold text-slate-100 text-center">Reset Password</h2>
                  <p className="text-xs text-slate-400 text-center">
                    Enter your email address to receive reset instructions.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-lg transition-colors border border-indigo-500/30"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="w-full py-1 text-xs text-slate-400 hover:text-slate-200 text-center block"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}

              {/* RESET PASSWORD FORM */}
              {authMode === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <h2 className="text-sm font-semibold text-slate-100 text-center">Set New Password</h2>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={resetData.token}
                      onChange={(e) => setResetData({ ...resetData, token: e.target.value })}
                      placeholder="Enter token"
                      required
                      className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={resetData.password}
                      onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-lg transition-colors border border-indigo-500/30"
                  >
                    Update Password
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