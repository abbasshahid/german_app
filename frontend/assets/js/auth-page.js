import { api } from "./api.js";
import { setBusy, showToast } from "./ui.js";

const loginTab = document.querySelector("[data-tab='login']");
const signupTab = document.querySelector("[data-tab='signup']");
const loginPanel = document.querySelector("[data-panel='login']");
const signupPanel = document.querySelector("[data-panel='signup']");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");

function activateTab(tabName) {
  const isLogin = tabName === "login";
  loginTab.classList.toggle("chip-active", isLogin);
  signupTab.classList.toggle("chip-active", !isLogin);
  loginPanel.classList.toggle("hidden", !isLogin);
  signupPanel.classList.toggle("hidden", isLogin);
}

loginTab.addEventListener("click", () => activateTab("login"));
signupTab.addEventListener("click", () => activateTab("signup"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button[type='submit']");

  setBusy(button, true, "Signing in...");

  try {
    const formData = new FormData(loginForm);
    await api.post("/api/auth/login", {
      email: formData.get("email"),
      password: formData.get("password")
    });

    window.location.href = "/dashboard";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = signupForm.querySelector("button[type='submit']");

  setBusy(button, true, "Creating account...");

  try {
    const formData = new FormData(signupForm);
    await api.post("/api/auth/signup", {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      cefrLevel: formData.get("cefrLevel")
    });

    window.location.href = "/dashboard";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
});

activateTab("login");
