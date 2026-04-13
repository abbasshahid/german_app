export function ensureToastRoot() {
  let root = document.querySelector(".toast-stack");

  if (!root) {
    root = document.createElement("div");
    root.className = "toast-stack";
    document.body.append(root);
  }

  return root;
}

export function showToast(message, tone = "info") {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  root.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

export function setBusy(element, busy, busyText = "Working...") {
  if (!element) {
    return;
  }

  if (!element.dataset.originalText) {
    element.dataset.originalText = element.innerHTML;
  }

  element.dataset.busy = busy ? "true" : "false";
  element.innerHTML = busy ? busyText : element.dataset.originalText;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatNumber(value) {
  return new Intl.NumberFormat().format(value ?? 0);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
