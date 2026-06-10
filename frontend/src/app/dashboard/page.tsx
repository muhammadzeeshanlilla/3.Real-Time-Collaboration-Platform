"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { getCurrentUser } from "@/services/authService";
import {
  getAccessToken,
  removeTokens,
} from "@/services/tokenService";

import {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
} from "@/services/workspaceService";

import {
  getMyNotifications,
  getNotificationWebSocketUrl,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";

import type { User } from "@/types/auth";
import type { Workspace } from "@/types/workspace";
import type { Notification } from "@/types/notification";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastNotification, setToastNotification] =
    useState<Notification | null>(null);

  const notificationSocketRef = useRef<WebSocket | null>(null);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    removeTokens();
    router.push("/login");
  };

  const loadWorkspaces = async () => {
    const response = await getMyWorkspaces();
    setWorkspaces(response.workspaces);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userResponse = await getCurrentUser();
        setUser(userResponse.user);

        const workspaceResponse = await getMyWorkspaces();
        setWorkspaces(workspaceResponse.workspaces);

        const notificationResponse = await getMyNotifications();
        setNotifications(notificationResponse.notifications);
        setUnreadCount(notificationResponse.unread_count);
      } catch (error: unknown) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          removeTokens();
          router.replace("/login");
          return;
        }

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to load dashboard.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    const socketUrl = getNotificationWebSocketUrl(accessToken);
    const socket = new WebSocket(socketUrl);

    notificationSocketRef.current = socket;

    socket.onopen = () => {
      console.log("Notification WebSocket connected.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "notification") {
        setNotifications((previousNotifications) => [
          data.notification,
          ...previousNotifications,
        ]);

        setUnreadCount((previousCount) => previousCount + 1);

        setToastNotification(data.notification);
      }
    };

    socket.onerror = () => {
      // Development mode may briefly interrupt WebSocket during reload.
    };

    socket.onclose = (event) => {
      console.log("Notification WebSocket disconnected.", event.code);
    };

    return () => {
      socket.close(1000);
    };
  }, []);

  useEffect(() => {
  const handleScreenClick = (event: MouseEvent) => {
    const target = event.target as Node;

    setToastNotification(null);

    if (
      notificationDropdownRef.current &&
      !notificationDropdownRef.current.contains(target)
    ) {
      setShowNotifications(false);
    }
  };

  document.addEventListener("mousedown", handleScreenClick);

  return () => {
    document.removeEventListener("mousedown", handleScreenClick);
  };
}, []);

  const handleCreateWorkspace = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!workspaceName.trim()) {
      setErrorMessage("Workspace name is required.");
      return;
    }

    try {
      setIsWorkspaceLoading(true);

      const response = await createWorkspace({
        name: workspaceName,
        description: workspaceDescription,
      });

      setSuccessMessage(response.message);

      setWorkspaceName("");
      setWorkspaceDescription("");

      await loadWorkspaces();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to create workspace."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleJoinWorkspace = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!inviteCode.trim()) {
      setErrorMessage("Invite code is required.");
      return;
    }

    try {
      setIsWorkspaceLoading(true);

      const response = await joinWorkspace({
        invite_code: inviteCode,
      });

      setSuccessMessage(response.message);

      setInviteCode("");

      await loadWorkspaces();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to join workspace."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch {
      setErrorMessage("Unable to mark notifications as read.");
    }
  };

  const handleMarkNotificationRead = async (
    notificationId: number
  ) => {
    try {
      await markNotificationRead(notificationId);

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );

      setUnreadCount((previousCount) =>
        previousCount > 0 ? previousCount - 1 : 0
      );
    } catch {
      setErrorMessage("Unable to mark notification as read.");
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {toastNotification && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed right-6 top-6 z-50 w-96 rounded-xl border border-blue-200 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                {toastNotification.title}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {toastNotification.message}
              </p>

              {toastNotification.workspace_name && (
                <p className="mt-1 text-xs text-gray-500">
                  Workspace: {toastNotification.workspace_name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Collaboration Platform
          </h1>

          {user && (
            <div className="flex items-center gap-4">
              <p className="text-gray-700">
                Welcome,{" "}
                <span className="font-semibold">
                  {user.username}
                </span>
              </p>

              <div ref={notificationDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
  setShowNotifications((previousValue) => !previousValue);
}}
                  className="relative rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
                >
                  Notifications

                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>

                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No notifications yet.
                      </p>
                    ) : (
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              if (!notification.is_read) {
                                handleMarkNotificationRead(notification.id);
                              }
                            }}
                            className={`w-full rounded-lg border p-3 text-left ${
                              notification.is_read
                                ? "border-gray-200 bg-white"
                                : "border-blue-200 bg-blue-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {notification.title}
                                </p>

                                <p className="mt-1 text-sm text-gray-600">
                                  {notification.message}
                                </p>

                                {notification.workspace_name && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Workspace:{" "}
                                    {notification.workspace_name}
                                  </p>
                                )}
                              </div>

                              {!notification.is_read && (
                                <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                                  New
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Manage your workspaces and collaborate with your team.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <form
            onSubmit={handleCreateWorkspace}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-gray-900">
              Create Workspace
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="workspaceName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Workspace Name
                </label>

                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={(event) =>
                    setWorkspaceName(event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="Example: FYP Team"
                />
              </div>

              <div>
                <label
                  htmlFor="workspaceDescription"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="workspaceDescription"
                  value={workspaceDescription}
                  onChange={(event) =>
                    setWorkspaceDescription(event.target.value)
                  }
                  className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="Short description"
                />
              </div>

              <button
                type="submit"
                disabled={isWorkspaceLoading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorkspaceLoading
                  ? "Please wait..."
                  : "Create Workspace"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleJoinWorkspace}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-gray-900">
              Join Workspace
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="inviteCode"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Invite Code
                </label>

                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(event) =>
                    setInviteCode(event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 uppercase text-gray-900 outline-none focus:border-blue-500"
                  placeholder="Enter invite code"
                />
              </div>

              <button
                type="submit"
                disabled={isWorkspaceLoading}
                className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorkspaceLoading
                  ? "Please wait..."
                  : "Join Workspace"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900">
            My Workspaces
          </h3>

          {workspaces.length === 0 ? (
            <p className="mt-4 text-gray-600">
              You have not created or joined any workspace yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {workspaces.map((workspace) => (
                <article
                  key={workspace.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {workspace.name}
                      </h4>

                      <p className="mt-1 text-sm text-gray-600">
                        {workspace.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {workspace.members.length} members
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Created by:</strong>{" "}
                      {workspace.created_by_username}
                    </p>

                    <p>
                      <strong>Invite Code:</strong>{" "}
                      <span className="font-mono">
                        {workspace.invite_code}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/workspaces/${workspace.id}`)
                    }
                    className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Open Workspace
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}