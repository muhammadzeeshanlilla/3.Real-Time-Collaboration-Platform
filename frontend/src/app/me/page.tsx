"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/services/authService";
import type { User } from "@/types/auth";

export default function CurrentUserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser();

        setUser(response.user);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.detail ||
              "Unable to load the current user."
          );
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Loading user...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Current User
        </h1>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            {errorMessage}
          </div>
        )}

        {user && (
          <div className="space-y-3 text-gray-800">
            <p>
              <strong>ID:</strong> {user.id}
            </p>

            <p>
              <strong>Username:</strong> {user.username}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center font-medium text-blue-600 hover:underline"
        >
          Back to Login
        </Link>
      </section>
    </main>
  );
}