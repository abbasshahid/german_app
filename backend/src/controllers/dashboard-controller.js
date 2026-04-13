import { getDashboardOverview } from "../services/dashboard-service.js";

export function getDashboardController(req, res) {
  res.json(getDashboardOverview(req.currentUser));
}
