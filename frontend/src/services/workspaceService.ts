import api from "@/services/api";
import { getAccessToken } from "@/services/tokenService";

import type {
  JoinWorkspaceData,
  JoinWorkspaceResponse,
  WorkspaceCreateData,
  WorkspaceCreateResponse,
  WorkspaceDetailResponse,
  WorkspaceListResponse,
} from "@/types/workspace";

const getAuthHeaders = () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token is missing.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const getMyWorkspaces = async (): Promise<WorkspaceListResponse> => {
  const response = await api.get<WorkspaceListResponse>("workspaces/", {
    headers: getAuthHeaders(),
  });

  return response.data;
};

export const createWorkspace = async (
  workspaceData: WorkspaceCreateData
): Promise<WorkspaceCreateResponse> => {
  const response = await api.post<WorkspaceCreateResponse>(
    "workspaces/",
    workspaceData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const joinWorkspace = async (
  joinData: JoinWorkspaceData
): Promise<JoinWorkspaceResponse> => {
  const response = await api.post<JoinWorkspaceResponse>(
    "workspaces/join/",
    joinData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const getWorkspaceDetail = async (
  workspaceId: number
): Promise<WorkspaceDetailResponse> => {
  const response = await api.get<WorkspaceDetailResponse>(
    `workspaces/${workspaceId}/`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};