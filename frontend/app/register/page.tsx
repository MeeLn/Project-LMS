'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)

  const [form, setForm] = useState({
    rollNo: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    faculty: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputClasses =
    'w-full p-2 border rounded text-gray-800 placeholder-gray-500'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.firstName.trim()) {
      newErrors.firstName = '* First name is required'
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = '* Last name is required'
    }

    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = '* Enter a valid email address'
    }

    if (!form.phone || !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = '* Enter a valid 10-digit phone number'
    }

    if (role === 'student' && (!form.rollNo || form.rollNo.length !== 6)) {
      newErrors.rollNo = '* Roll number must be exactly 6 characters'
    }

    if (!form.password || form.password.length < 8 ) {
      newErrors.password = '* Password is required( Minimum length of 8)'
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = '* Passwords do not match'
    }

    return newErrors
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' }) // Clear error on change
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const endpoint =
      role === 'student'
        ? 'http://localhost:8000/api/register/student/'
        : 'http://localhost:8000/api/register/teacher/'

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value)
    })

    if (role === 'student' && profilePicture) {
      formData.append('profile_picture', profilePicture)
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = '/'
      } else {
        setErrors({ form: '* Registration failed. Please try again.' })
      }
    } catch (error) {
      setErrors({ form: '* Network error. Please try again later.' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-gray-900">
      <img src="/logo.png" alt="Logo" className="w-32 mb-6" />

      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClasses}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          {role === 'student' && (
            <>
              <p>Profile Picture</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={inputClasses}
              />
              <select
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                required
                className={inputClasses}
              >
                <option value="">Select Faculty</option>
                <option value="BEIT">BEIT</option>
                <option value="Computer">Computer</option>
                <option value="Software">Software</option>
                <option value="Civil">Civil</option>
              </select>
            </>
          )}

          {role === 'student' && (
            <>
              <input
                type="text"
                name="rollNo"
                placeholder="Roll Number"
                value={form.rollNo}
                onChange={handleChange}
                className={inputClasses}
              />
              {errors.rollNo && <p className="text-red-600 text-sm">{errors.rollNo}</p>}
            </>
          )}

          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            className={inputClasses}
          />
          {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName}</p>}

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            className={inputClasses}
          />
          {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className={inputClasses}
          />
          {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className={inputClasses}
          />
          {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className={inputClasses}
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
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
          {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`${inputClasses} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-2 text-sm text-gray-600"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
          )}

          {errors.form && <p className="text-red-600 text-sm text-center">{errors.form}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-700">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}
