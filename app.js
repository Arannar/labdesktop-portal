"use strict";

const POLL_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 3_500;
const grid = document.querySelector("#app-grid");
const statusElements = new Map();
let applications = [];
let pollTimer;

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderCard(application) {
  const card = document.createElement("a");
  card.className = "app-card";
  card.href = application.path;
  card.setAttribute("aria-label", `Open ${application.name}`);

  const top = document.createElement("div");
  top.className = "card-top";
  const icon = textElement("span", "app-icon", "Z");
  icon.setAttribute("aria-hidden", "true");
  const status = textElement("span", "status checking", "Checking");
  status.dataset.applicationId = application.id;
  statusElements.set(application.id, status);
  top.append(icon, status);

  const category = textElement("p", "category", application.category);
  const name = textElement("h3", "app-name", application.name);
  const description = textElement("p", "app-description", application.description);
  const action = document.createElement("div");
  action.className = "card-action";
  action.append(textElement("span", "", "Open application"), textElement("span", "arrow", "→"));

  card.append(top, category, name, description, action);
  return card;
}

function isValidApplication(application) {
  const requiredFields = ["id", "name", "description", "category", "path", "healthUrl"];
  return requiredFields.every((field) => typeof application[field] === "string" && application[field].length > 0)
    && application.path.startsWith("/")
    && application.path.endsWith("/")
    && application.healthUrl.startsWith("/");
}

function updateStatus(id, state) {
  const status = statusElements.get(id);
  if (!status) return;
  status.className = `status ${state}`;
  status.textContent = state === "available" ? "Available" : state === "unavailable" ? "Unavailable" : "Checking";
}

async function checkApplication(application) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(application.healthUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    updateStatus(application.id, payload.status === "ok" ? "available" : "unavailable");
  } catch {
    updateStatus(application.id, "unavailable");
  } finally {
    window.clearTimeout(timeout);
  }
}

async function pollStatuses() {
  if (document.hidden) return;
  await Promise.allSettled(applications.map(checkApplication));
}

function schedulePolling() {
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(pollStatuses, POLL_INTERVAL_MS);
}

async function initialize() {
  try {
    const response = await fetch("apps.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const configuredApplications = await response.json();
    if (!Array.isArray(configuredApplications) || !configuredApplications.every(isValidApplication)) {
      throw new Error("Invalid application directory");
    }
    applications = configuredApplications;
    grid.replaceChildren(...applications.map(renderCard));
    grid.setAttribute("aria-busy", "false");
    await pollStatuses();
    schedulePolling();
  } catch (error) {
    const notice = textElement("p", "notice notice-error", "The application directory could not be loaded. Please contact the server administrator.");
    grid.replaceChildren(notice);
    grid.setAttribute("aria-busy", "false");
    console.error(error);
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) pollStatuses();
});

initialize();
