import axiosInstance from '../lib/axios';

export const notificationService = {
  getNotifications: async (params) => {
    const res = await axiosInstance.get('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await axiosInstance.patch('/notifications/read-all');
    return res.data;
  }
};
