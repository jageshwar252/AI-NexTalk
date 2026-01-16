import React, { useState,useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext} from "../context/user.context";

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {setUser} = useContext(UserContext)
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function submitHandler(e) {
    e.preventDefault();
    setError("");
    // Add login logic here
    axios.post("/users/login", { email, password })
      .then((response) => {
        localStorage.setItem("token", response.data.token); // Store the token in local storage
        setUser(response.data.user); // Set the user in context
        navigate("/"); // Redirect to home page on successful login
      })
      .catch((error) => {
        setError(error.response?.data?.message || "Login failed");
      })
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}  //Ye
              type="email"
              id="email"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)} //Ye
              type="password"
              id="password"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition duration-200"
          >
            Login
          </button>
        </form>
        {error && (
          <div className="mt-4 text-red-400 text-center">{error}</div>
        )}

        <p className="mt-6 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
