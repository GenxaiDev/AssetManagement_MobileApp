import client from "../client.js";

// GET /api/Notification/user
export const getUserNotifications = async () =>
  await client.get("/Notification/user");

// POST /api/Notification/read-all
export const markAllNotificationsAsRead = async () =>
  await client.post("/Notification/read-all");

// GET /api/Notification/unread-count
export const getUnreadNotificationCount = async () =>
  await client.get("/Notification/unread-count");

// POST /api/Notification/{id}/read
export const markNotificationAsRead = async (id) =>
  await client.post(`/Notification/${id}/read`);

// POST /api/Notification/register-device
export const registerDevice = async (deviceToken, platform) =>
  await client.post("/Notification/register-device", {
    deviceToken,
    platform,
  });
