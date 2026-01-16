import React, {useState,useContext} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext} from "../context/user.context";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {setUser} = useContext(UserContext)
  const navigate = useNavigate();
  const [error, setError] = useState("");

 function submitHandler(e) {
    e.preventDefault();
    setError("");
    axios.post("/users/register", { email, password })
      .then((res) => {
        console.log(res.data);
        localStorage.setItem("token", res.data.token); // Store the token in local storage
        setUser(res.data.user); // Set the user in context (if needed)
        navigate("/"); // Redirect to home page on successful registration
      }) 
      .catch((error) => {
        setError(error.response?.data?.message || "Registration failed");
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)} //Ye
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
            Register
          </button>
        </form>
        {error && (
          <div className="mt-4 text-red-400 text-center">{error}</div>
        )}

        <p className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
