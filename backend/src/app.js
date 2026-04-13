import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import helmet from "helmet";

import { attachCurrentUser } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";
import apiRouter from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "../../frontend");
const pagesDirectory = path.join(frontendRoot, "pages");
const assetsDirectory = path.join(frontendRoot, "assets");

function sendPage(name) {
  return (_req, res) => {
    res.sendFile(path.join(pagesDirectory, name));
  };
}

function requirePageAuth(req, res, next) {
  if (!req.currentUser) {
    res.redirect("/auth");
    return;
  }

  next();
}

function requirePageAdmin(req, res, next) {
  if (!req.currentUser) {
    res.redirect("/auth");
    return;
  }

  if (req.currentUser.role !== "admin") {
    res.redirect("/dashboard");
    return;
  }

  next();
}

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestContext);
app.use(attachCurrentUser);

app.use("/assets", express.static(assetsDirectory));

app.get("/", (req, res) => {
  res.redirect(req.currentUser ? "/dashboard" : "/auth");
});

app.get("/auth", (req, res) => {
  if (req.currentUser) {
    res.redirect("/dashboard");
    return;
  }

  res.sendFile(path.join(pagesDirectory, "auth.html"));
});

app.get("/dashboard", requirePageAuth, sendPage("dashboard.html"));
app.get("/library", requirePageAuth, sendPage("library.html"));
app.get("/read/:slug", requirePageAuth, sendPage("reading.html"));
app.get("/vocabulary", requirePageAuth, sendPage("vocabulary.html"));
app.get("/flashcards", requirePageAuth, sendPage("flashcards.html"));
app.get("/admin", requirePageAdmin, sendPage("admin.html"));

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
