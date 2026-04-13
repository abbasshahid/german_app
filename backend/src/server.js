import { env } from "./config/env.js";
import { initDatabase } from "./database/db.js";
import { logger } from "./utils/logger.js";
import app from "./app.js";

initDatabase();

app.listen(env.port, () => {
  logger.info("server_started", {
    port: env.port,
    appBaseUrl: env.appBaseUrl
  });
});
