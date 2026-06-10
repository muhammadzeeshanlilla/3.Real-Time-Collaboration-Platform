"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getAccessToken,
  removeTokens,
} from "@/services/tokenService";

import { getWorkspaceDetail } from "@/services/workspaceService";

import {
  getChatWebSocketUrl,
  getWorkspaceMessages,
} from "@/services/chatService";

import {
  createNote,
  deleteNote,
  getNotesWebSocketUrl,
  getWorkspaceNotes,
  updateNote,
} from "@/services/noteService";

import type { Workspace } from "@/types/workspace";
import type { ChatMessage } from "@/types/chat";
import type { Note } from "@/types/note";

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const chatSocketRef = useRef<WebSocket | null>(null);
  const notesSocketRef = useRef<WebSocket | null>(null);

  const workspaceId = Number(params.workspaceId);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        if (!workspaceId) {
          setErrorMessage("Invalid workspace id.");
          return;
        }

        const workspaceResponse = await getWorkspaceDetail(workspaceId);
        setWorkspace(workspaceResponse.workspace);

        const messageResponse = await getWorkspaceMessages(workspaceId);
        setMessages(messageResponse.messages);

        const notesResponse = await getWorkspaceNotes(workspaceId);
        setNotes(notesResponse.notes);
      } catch (error: unknown) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          removeTokens();
          router.replace("/login");
          return;
        }

        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.message ||
              "Unable to load workspace."
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

    loadWorkspace();
  }, [router, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const accessToken = getAccessToken();

    if (!accessToken) {
      removeTokens();
      router.replace("/login");
      return;
    }

    const socketUrl = getChatWebSocketUrl(workspaceId, accessToken);
    const socket = new WebSocket(socketUrl);

    chatSocketRef.current = socket;

    socket.onopen = () => {
      console.log("Chat WebSocket connected.");
      setErrorMessage("");
    };

    socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "chat_message") {
    setMessages((previousMessages) => [
      ...previousMessages,
      data.message,
    ]);
  }

  if (data.type === "presence_update") {
    setOnlineUserIds(data.online_users);
  }
};
    socket.onerror = () => {
  // In development mode, WebSocket may briefly fail during page reload.
};

socket.onclose = (event) => {
  console.log("Chat WebSocket disconnected.", event.code);

  setTimeout(() => {
    if (
      chatSocketRef.current &&
      chatSocketRef.current.readyState !== WebSocket.OPEN
    ) {
      setErrorMessage("Chat WebSocket disconnected. Please refresh page.");
    }
  }, 1500);
};

return () => {
  socket.close(1000);
};

  }, [router, workspaceId]);

useEffect(() => {
  if (!workspaceId) return;

  const accessToken = getAccessToken();

  if (!accessToken) {
    removeTokens();
    router.replace("/login");
    return;
  }

  const socketUrl = getNotesWebSocketUrl(workspaceId, accessToken);
  const socket = new WebSocket(socketUrl);

  notesSocketRef.current = socket;

  socket.onopen = () => {
    console.log("Notes WebSocket connected.");
    setErrorMessage("");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "note_created") {
      setNotes((previousNotes) => {
        const alreadyExists = previousNotes.some(
          (note) => note.id === data.note.id
        );

        if (alreadyExists) {
          return previousNotes;
        }

        return [data.note, ...previousNotes];
      });
    }

    if (data.type === "note_updated") {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === data.note.id ? data.note : note
        )
      );

      setSelectedNote((previousSelectedNote) => {
        if (previousSelectedNote?.id === data.note.id) {
          setNoteTitle(data.note.title);
          setNoteContent(data.note.content);

          return data.note;
        }

        return previousSelectedNote;
      });
    }

    if (data.type === "note_deleted") {
      setNotes((previousNotes) =>
        previousNotes.filter((note) => note.id !== data.note_id)
      );

      setSelectedNote((previousSelectedNote) => {
        if (previousSelectedNote?.id === data.note_id) {
          setNoteTitle("");
          setNoteContent("");

          return null;
        }

        return previousSelectedNote;
      });
    }
  };

  socket.onerror = () => {
  // In development mode, WebSocket may briefly fail during page reload.
};

  socket.onclose = (event) => {
  console.log("Notes WebSocket disconnected.", event.code);

  setTimeout(() => {
    if (
      notesSocketRef.current &&
      notesSocketRef.current.readyState !== WebSocket.OPEN
    ) {
      setErrorMessage("Notes WebSocket disconnected. Please refresh page.");
    }
  }, 1500);
};

  return () => {
    socket.close(1000);
  };
}, [router, workspaceId]);

  const handleSendMessage = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    if (!newMessage.trim()) {
      setErrorMessage("Message cannot be empty.");
      return;
    }

    if (
      !chatSocketRef.current ||
      chatSocketRef.current.readyState !== WebSocket.OPEN
    ) {
      setErrorMessage("Chat connection is not ready.");
      return;
    }

    chatSocketRef.current.send(
      JSON.stringify({
        content: newMessage,
      })
    );

    setNewMessage("");
  };

  const handleCreateNote = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    if (!noteTitle.trim()) {
      setErrorMessage("Note title is required.");
      return;
    }

    try {
      setIsNoteSaving(true);

      const response = await createNote(workspaceId, {
        title: noteTitle,
        content: noteContent,
      });

      notesSocketRef.current?.send(
        JSON.stringify({
          type: "note_created",
          note: response.note,
        })
      );

      setNoteTitle("");
      setNoteContent("");
      setSelectedNote(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to create note."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) {
      setErrorMessage("Select a note first.");
      return;
    }

    if (!noteTitle.trim()) {
      setErrorMessage("Note title is required.");
      return;
    }

    try {
      setIsNoteSaving(true);
      setErrorMessage("");

      const response = await updateNote(selectedNote.id, {
        title: noteTitle,
        content: noteContent,
      });

      notesSocketRef.current?.send(
        JSON.stringify({
          type: "note_updated",
          note: response.note,
        })
      );

      setSelectedNote(response.note);
      setNoteTitle(response.note.title);
      setNoteContent(response.note.content);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to update note."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) {
      setErrorMessage("Select a note first.");
      return;
    }

    try {
      setIsNoteSaving(true);
      setErrorMessage("");

      const deletedNoteId = selectedNote.id;

      await deleteNote(deletedNoteId);

      notesSocketRef.current?.send(
        JSON.stringify({
          type: "note_deleted",
          note_id: deletedNoteId,
        })
      );

      setSelectedNote(null);
      setNoteTitle("");
      setNoteContent("");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to delete note."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteTitle("");
    setNoteContent("");
    setErrorMessage("");
  };

  const formatMessageTime = (dateValue: string) => {
    return new Date(dateValue).toLocaleString();
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">
          Loading workspace...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {workspace ? workspace.name : "Workspace"}
            </h1>

            {workspace && (
              <p className="mt-1 text-sm text-gray-600">
                Created by {workspace.created_by_username}
              </p>
            )}
          </div>

          <Link
            href="/dashboard"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {workspace && (
          <>
            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-bold text-gray-900">
                {workspace.name}
              </h2>

              <p className="mt-3 text-gray-600">
                {workspace.description || "No description provided."}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">
                    Workspace ID
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {workspace.id}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">
                    Invite Code
                  </p>
                  <p className="mt-1 font-mono font-semibold text-gray-900">
                    {workspace.invite_code}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">
                    Total Members
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {workspace.members.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chat
                </h3>

                <div className="mt-4 h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No messages yet. Start the conversation.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-lg bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900">
                              {message.sender_username}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>

                          <p className="mt-2 text-gray-700">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="mt-4 flex gap-3"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(event) =>
                      setNewMessage(event.target.value)
                    }
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                    placeholder="Type your message..."
                  />

                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Send
                  </button>
                </form>
              </section>

              <section className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  Members
                </h3>

                <div className="mt-4 space-y-3">
                  {workspace.members.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {member.username}
                        </p>

                        <div className="flex items-center gap-2">
  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
    {member.role}
  </span>

  {onlineUserIds.includes(member.user_id) ? (
    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
      Online
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
      Offline
    </span>
  )}
</div>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        {member.email}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Shared Notes
                </h3>

                <button
                  type="button"
                  onClick={handleNewNote}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  New Note
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900">
                    Notes List
                  </h4>

                  {notes.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">
                      No notes yet.
                    </p>
                  ) : (
                    <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-2">
                      {notes.map((note) => (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => handleSelectNote(note)}
                          className={`w-full rounded-md border p-3 text-left ${
                            selectedNote?.id === note.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <p className="font-medium text-gray-900">
                            {note.title}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {note.content || "No content"}
                          </p>

                          <p className="mt-2 text-xs text-gray-400">
                            Updated by{" "}
                            {note.updated_by_username || "Unknown"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 p-4 lg:col-span-2">
                  <h4 className="font-semibold text-gray-900">
                    {selectedNote ? "Edit Note" : "Create Note"}
                  </h4>

                  <form
                    onSubmit={handleCreateNote}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="noteTitle"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Note Title
                      </label>

                      <input
                        id="noteTitle"
                        type="text"
                        value={noteTitle}
                        onChange={(event) =>
                          setNoteTitle(event.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                        placeholder="Example: Meeting Notes"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="noteContent"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Note Content
                      </label>

                      <textarea
                        id="noteContent"
                        value={noteContent}
                        onChange={(event) =>
                          setNoteContent(event.target.value)
                        }
                        className="min-h-64 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                        placeholder="Write shared note content here..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!selectedNote && (
                        <button
                          type="submit"
                          disabled={isNoteSaving}
                          className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isNoteSaving ? "Saving..." : "Create Note"}
                        </button>
                      )}

                      {selectedNote && (
                        <>
                          <button
                            type="button"
                            onClick={handleUpdateNote}
                            disabled={isNoteSaving}
                            className="rounded-md bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isNoteSaving ? "Saving..." : "Update Note"}
                          </button>

                          <button
                            type="button"
                            onClick={handleDeleteNote}
                            disabled={isNoteSaving}
                            className="rounded-md bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete Note
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}