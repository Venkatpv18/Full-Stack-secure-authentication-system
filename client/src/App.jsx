import { useState } from "react";
import axios from "axios";

export default function App() {

  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // LOGIN
      if (isLogin) {

        const res = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        localStorage.setItem(
          "token",
          res.data.token
        );

        setToken(res.data.token);

        alert("Login Successful");
      }

      // REGISTER
      else {

        const res = await axios.post(
          "http://localhost:5000/api/auth/register",
          formData
        );

        alert("Registration Successful");

        setIsLogin(true);
      }

    } catch (error) {

      console.log(error);

      alert("Something went wrong");
    }
  };

  // LOGOUT
  const handleLogout = () => {

    localStorage.removeItem("token");

    setToken(null);

    alert("Logged Out");
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-indigo-700 text-white text-center py-5">

          <h1 className="text-2xl font-bold">
            Authentication System
          </h1>

        </div>

        {/* SUCCESS MESSAGE */}
        {token && (

          <div className="bg-green-100 text-green-700 text-center py-3 font-semibold">

            Login Successful

          </div>
        )}

        {/* TABS */}
        <div className="flex">

          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-4 font-semibold ${
              isLogin
                ? "bg-indigo-700 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-4 font-semibold ${
              !isLogin
                ? "bg-indigo-700 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Register
          </button>

        </div>

        {/* FORM */}
        <div className="p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}
            {!isLogin && (

              <div>

                <label className="block mb-2 font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl"
                />

              </div>
            )}

            {/* EMAIL */}
            <div>

              <label className="block mb-2 font-medium">
                Email
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-xl"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block mb-2 font-medium">
                Password
              </label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
                minLength="6"
                className="w-full px-4 py-3 border rounded-xl"
              />

            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-xl font-semibold"
            >
              {isLogin ? "Login" : "Register"}
            </button>

          </form>

          {/* LOGOUT */}
          {token && (

            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold"
            >
              Logout
            </button>
          )}

          {/* TOGGLE */}
          <div className="mt-6 text-center text-sm">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-indigo-700 font-semibold"
            >
              {isLogin ? "Register" : "Login"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}