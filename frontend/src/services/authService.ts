import api from "@/services/api";
import { getAccessToken } from "@/services/tokenService";

import {
  CurrentUserResponse,
  LoginData,
  RegisterData,
  RegisterResponse,
  TokenResponse,
} from "@/types/auth";

export const registerUser = async (
  userData: RegisterData
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>(
    "auth/register/",
    userData
  );

  return response.data;
};

export const loginUser = async (
  loginData: LoginData
): Promise<TokenResponse> => {
  const response = await api.post<TokenResponse>(
    "auth/login/",
    loginData
  );

  return response.data;
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token is missing.");
  }

  const response = await api.get<CurrentUserResponse>(
    "auth/me/",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};