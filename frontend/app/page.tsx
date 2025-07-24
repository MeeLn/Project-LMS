'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    try {
    const response = await fetch("http://localhost:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, email, password }),
    });

    const text = await response.text(); //raw response
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned invalid JSON:\n" + text); //actual response
    }

  if (response.ok) {
    localStorage.setItem("user", JSON.stringify({ role, email, userId: data.user_id }));
    if (role === "student") {
      window.location.href = "/student";
    } else if (role === "teacher") {
      window.location.href = "/teacher";
    } else if (role === "admin") {
      window.location.href = "/admin";
    }
  }
 else {
      alert("Login failed: " + data.error);
    }
  } catch (error) {
    alert("An error occurred: " + error);
  }

};



  const inputClasses =
    'w-full p-2 border rounded text-gray-800 placeholder-gray-500'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-gray-900">
      {/* Logo */}
      <img src="/logo.png" alt="Logo" className="w-32 mb-6" />

      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClasses}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClasses} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm text-gray-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        {/* Link to register */}
        <p className="mt-4 text-center text-sm text-gray-700">
          Don’t have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
