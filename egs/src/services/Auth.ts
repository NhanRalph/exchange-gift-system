import axiosInstance from '@/api/axiosInstance';
import { LoginResponse } from '@/types/types';

export const login = async (username: string, password: string) => {
  const response = await axiosInstance.post<LoginResponse>(
    'authentication/account/login',
    {
      username,
      password,
    },
  );
  return response.data;
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await axiosInstance.post('authentication/logout', {
    refreshToken,
  });
  return response.data;
};
