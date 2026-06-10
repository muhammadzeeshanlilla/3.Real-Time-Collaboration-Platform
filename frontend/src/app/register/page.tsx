"use client";

import { FormEvent, useState } from "react";
import axios from "axios";

import { registerUser } from "@/services/authService";
import { RegisterData } from "@/types/auth";

import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (formData.password !== formData.confirm_password) {
      setErrorMessage("Password and confirm password do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await registerUser(formData);

      setSuccessMessage(response.message);

      setFormData({
        username: "",
        email: "",
        password: "",
        confirm_password: "",
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const backendErrors = error.response?.data;

        if (backendErrors) {
          const firstError = Object.values(backendErrors)[0];

          if (Array.isArray(firstError)) {
            setErrorMessage(String(firstError[0]));
          } else if (typeof firstError === "string") {
            setErrorMessage(firstError);
          } else {
            setErrorMessage("Registration failed. Check your information.");
          }
        } else {
          setErrorMessage(
            "Cannot connect to the backend server."
          );
        }
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Create Account
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Register to start collaborating with your team.
        </p>

        {successMessage && (
          <div className="mb-4 rounded-md bg-green-100 p-3 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>

            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
        <Link
         href="/login"
         className="font-medium text-blue-600 hover:underline"
        >
         Login
        </Link>
      </p>

      </section>
    </main>
  );
}

