import client from "../client.js";

// GET /dashboard/stats
// Response shape: { success, message, data: { totalAssets, inStockCount,
// allocatedCount, underRepairCount, disposedCount, totalAssetValue,
// warrantyExpiring, recentActivity: [...], distribution: [...] } }
export const getDashboardStats = async() => await client.get("/dashboard/stats");