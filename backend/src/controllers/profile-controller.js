import { getProfile, updateProfile } from "../services/profile-service.js";

export function getProfileController(req, res) {
  res.json(getProfile(req.currentUser.id));
}

export function updateProfileController(req, res) {
  res.json(updateProfile(req.currentUser.id, req.body));
}
