import axiosInstance from '@/api/axiosInstance';

export const fetchVolunteers = async () => {
  try {
    const response = await axiosInstance.get(
      'user/volunteer?pageIndex=1&pageSize=10',
    );
    return response.data.data;
  } catch {
    console.log('Failed to fetch volunteer data');
  }
};
