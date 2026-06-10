import api from "@/services/api";
import { getAccessToken } from "@/services/tokenService";

import type {
  CreateNoteData,
  CreateNoteResponse,
  DeleteNoteResponse,
  NoteListResponse,
  UpdateNoteData,
  UpdateNoteResponse,
} from "@/types/note";

const getAuthHeaders = () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token is missing.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const getWorkspaceNotes = async (
  workspaceId: number
): Promise<NoteListResponse> => {
  const response = await api.get<NoteListResponse>(
    `notes/workspaces/${workspaceId}/notes/`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const createNote = async (
  workspaceId: number,
  noteData: CreateNoteData
): Promise<CreateNoteResponse> => {
  const response = await api.post<CreateNoteResponse>(
    `notes/workspaces/${workspaceId}/notes/`,
    noteData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const updateNote = async (
  noteId: number,
  noteData: UpdateNoteData
): Promise<UpdateNoteResponse> => {
  const response = await api.put<UpdateNoteResponse>(
    `notes/notes/${noteId}/`,
    noteData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const deleteNote = async (
  noteId: number
): Promise<DeleteNoteResponse> => {
  const response = await api.delete<DeleteNoteResponse>(
    `notes/notes/${noteId}/`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const getNotesWebSocketUrl = (
  workspaceId: number,
  accessToken: string
): string => {
  return `ws://127.0.0.1:8000/ws/notes/${workspaceId}/?token=${accessToken}`;
};