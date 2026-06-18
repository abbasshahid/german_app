import app from "./backend/src/app.js";
import { initDatabase } from "./backend/src/database/db.js";

initDatabase();

export default app;
