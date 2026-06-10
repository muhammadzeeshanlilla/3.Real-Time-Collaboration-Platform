export interface WorkspaceMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: "OWNER" | "MEMBER";
  joined_at: string;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_by_username: string;
  invite_code: string;
  members: WorkspaceMember[];
  created_at: string;
}

export interface WorkspaceListResponse {
  workspaces: Workspace[];
}

export interface WorkspaceCreateData {
  name: string;
  description: string;
}

export interface WorkspaceCreateResponse {
  message: string;
  workspace: Workspace;
}

export interface JoinWorkspaceData {
  invite_code: string;
}

export interface JoinWorkspaceResponse {
  message: string;
  workspace: Workspace;
}

export interface WorkspaceDetailResponse {
  workspace: Workspace;
}