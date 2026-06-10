export interface Note {
  id: number;
  workspace: number;
  title: string;
  content: string;
  created_by: number;
  created_by_username: string;
  updated_by: number | null;
  updated_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteListResponse {
  notes: Note[];
}

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface CreateNoteResponse {
  message: string;
  note: Note;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface UpdateNoteResponse {
  message: string;
  note: Note;
}

export interface DeleteNoteResponse {
  message: string;
}