const STORAGE_KEY = "edaware-app-state";
const SESSION_KEY = "edaware-app-session";

const demoUsers = [
  {
    id: "user-clerk",
    email: "clerk@edaware.app",
    password: "demo123",
    name: "Dana Clerk",
    role: "ED Clerk",
    permissions: ["dashboard.view", "intake.create", "alert.view", "board.view"],
  },
  {
    id: "user-charge",
    email: "charge@edaware.app",
    password: "demo123",
    name: "Morgan Charge",
    role: "Charge Nurse",
    permissions: ["dashboard.view", "intake.create", "alert.view", "alert.launch", "alert.acknowledge", "board.manage"],
  },
  {
    id: "user-admin",
    email: "admin@edaware.app",
    password: "demo123",
    name: "Alex Admin",
    role: "Site Admin",
    permissions: [
      "dashboard.view",
      "intake.create",
      "alert.view",
      "alert.launch",
      "alert.acknowledge",
      "board.manage",
      "template.manage",
      "routing.manage",
      "roles.manage",
    ],
  },
  {
    id: "user-qa",
    email: "qa@edaware.app",
    password: "demo123",
    name: "Riley QA",
    role: "QA Reviewer",
    permissions: ["dashboard.view", "alert.view", "board.view"],
  },
];

const defaultState = {
  selectedPatientId: null,
  templates: [
    { id: crypto.randomUUID(), name: "Trauma Alert", category: "Trauma", destination: "Trauma Team" },
    { id: crypto.randomUUID(), name: "STEMI Alert", category: "Cardiac", destination: "Cath Lab" },
    { id: crypto.randomUUID(), name: "Stroke Alert", category: "Neuro", destination: "Stroke Team" },
  ],
  routes: [
    { id: crypto.randomUUID(), name: "EMS Radio", channel: "Radio", destination: "ED Clerk Desk" },
    { id: crypto.randomUUID(), name: "After Hours Trauma", channel: "Critical", destination: "Charge Nurse" },
  ],
  roles: [
    { id: crypto.randomUUID(), name: "ED Clerk", permissions: ["intake.create", "alert.view", "board.view"] },
    { id: crypto.randomUUID(), name: "Charge Nurse", permissions: ["alert.launch", "routing.override", "board.manage"] },
    { id: crypto.randomUUID(), name: "Site Admin", permissions: ["template.manage", "routing.manage", "roles.manage"] },
  ],
  intakes: [
    {
      id: crypto.randomUUID(),
      unitName: "Medic 12",
      etaMinutes: 7,
      patientAlias: "John D.",
      complaint: "Chest pain",
      acuity: "High",
      alertType: "STEMI Alert",
      notes: "12-lead concerning for STEMI.",
      createdAt: new Date().toISOString(),
    },
  ],
  alerts: [
    {
      id: crypto.randomUUID(),
      type: "Stroke Alert",
      patientAlias: "Jane R.",
      severity: "Critical",
      destination: "Stroke Team",
      notes: "LKW 20 minutes ago.",
      status: "Active",
      createdAt: new Date().toISOString(),
    },
  ],
};

const viewRequirements = {
  home: "dashboard.view",
  dashboard: "dashboard.view",
  intake: "intake.create",
  alerts: "alert.view",
  board: "board.view",
  admin: "template.manage",
};

const homeConfigs = {
  "ED Clerk": {
    headline: "Start with intake, radio traffic, and incoming arrivals.",
    summary: "Your landing view prioritizes the next patient details, incoming communications, and the intake work that keeps the board current.",
    badges: [
      { label: "Open intake", value: "EMS" },
      { label: "Tracked arrivals", value: () => state.intakes.length },
      { label: "Visible alerts", value: () => state.alerts.length },
    ],
    actions: [
      "Capture pre-arrival details for the next incoming unit.",
      "Confirm complaint, ETA, and suggested alert before handoff.",
      "Escalate to operational staff when incoming details change.",
    ],
    focus: [
      "Reduce intake friction and keep arrival data current.",
      "Keep unit, complaint, and ETA visible for the receiving team.",
      "Use the board as the live source of truth for incoming patients.",
    ],
    watch: [
      "Units with rapidly changing ETA or complaint details.",
      "Patients without a suggested alert despite high acuity.",
      "Any intake that may require charge nurse review.",
    ],
  },
  "Charge Nurse": {
    headline: "Start with active alerts, escalations, and the incoming board.",
    summary: "Your landing view surfaces what needs operational attention first so you can coordinate staff, teams, and readiness before arrival.",
    badges: [
      { label: "Active alerts", value: () => state.alerts.filter((alert) => alert.status === "Active").length },
      { label: "Incoming board", value: () => state.intakes.length },
      { label: "Priority role", value: "Ops" },
    ],
    actions: [
      "Review active alerts and acknowledge anything awaiting operational response.",
      "Watch the incoming board for high-acuity patients and staffing needs.",
      "Coordinate downstream team readiness before arrival.",
    ],
    focus: [
      "Manage escalation flow without losing sight of arrivals.",
      "Keep alerts, teams, and arrivals synchronized in real time.",
      "Use the board and alert views as the operational command surface.",
    ],
    watch: [
      "High-acuity arrivals without confirmed team activation.",
      "Alerts that remain active without acknowledgment.",
      "Patients whose intake details suggest workflow escalation.",
    ],
  },
  "Site Admin": {
    headline: "Start with system configuration, routing health, and admin readiness.",
    summary: "Your landing view focuses on the operational controls that keep EDAware safe, consistent, and manageable across the site.",
    badges: [
      { label: "Templates", value: () => state.templates.length },
      { label: "Routes", value: () => state.routes.length },
      { label: "Roles", value: () => state.roles.length },
    ],
    actions: [
      "Review routing, templates, and role coverage before operational changes go live.",
      "Check whether alert logic and destinations still match current workflow.",
      "Use the admin area as the control center for structured flexibility.",
    ],
    focus: [
      "Keep configuration visible, reusable, and safe to change.",
      "Reduce drift between local workflow needs and core platform structure.",
      "Treat admin changes as operationally sensitive actions.",
    ],
    watch: [
      "Template growth that creates duplication instead of reuse.",
      "Routing changes that could affect after-hours behavior.",
      "Permission sets that are broader than they need to be.",
    ],
  },
  "QA Reviewer": {
    headline: "Start with review queues, recordings, and operational follow-up.",
    summary: "Your landing view prioritizes the cases and alerts that need review so you can move quickly from event to audit trail.",
    badges: [
      { label: "Review queue", value: () => state.alerts.length },
      { label: "Acknowledged", value: () => state.alerts.filter((alert) => alert.status === "Acknowledged").length },
      { label: "Role", value: "QA" },
    ],
    actions: [
      "Review alerts and handoff details that may need quality follow-up.",
      "Use patient detail and alert history as the starting point for QA review.",
      "Track issues that suggest workflow gaps or training needs.",
    ],
    focus: [
      "Keep recordings, alerts, and event detail aligned for later review.",
      "Look for repeated friction in intake, routing, and alert acknowledgment.",
      "Turn operational review into usable product and process insight.",
    ],
    watch: [
      "Alerts with unusual timing, escalation, or acknowledgment patterns.",
      "High-acuity arrivals with incomplete notes or unclear handoff detail.",
      "Operational edge cases that should feed back into product design.",
    ],
  },
};

let state = loadState();
let currentUser = loadSession();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    if (!Object.hasOwn(parsed, "selectedPatientId")) {
      parsed.selectedPatientId = null;
    }
    return parsed;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSession() {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved);
    return demoUsers.find((user) => user.id === parsed.id) ?? null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hasPermission(permission) {
  return Boolean(currentUser?.permissions.includes(permission));
}

function canAccessView(viewName) {
  const permission = viewRequirements[viewName];
  return permission ? hasPermission(permission) : false;
}

function firstAllowedView() {
  const preferredOrder = ["home", "dashboard", "intake", "alerts", "board", "admin"];
  return preferredOrder.find((viewName) => canAccessView(viewName)) ?? "dashboard";
}

function renderList(containerId, items, renderer) {
  const container = document.getElementById(containerId);
  if (!items.length) {
    container.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
    return;
  }

  container.innerHTML = items.map(renderer).join("");
}

function refreshSelectOptions() {
  const templateNames = state.templates.map((template) => template.name);
  const destinations = Array.from(
    new Set([
      ...state.templates.map((template) => template.destination),
      ...state.routes.map((route) => route.destination),
    ]),
  );

  const intakeAlertSelect = document.querySelector('#intakeForm select[name="alertType"]');
  const alertTypeSelect = document.querySelector('#alertForm select[name="type"]');
  const destinationSelect = document.querySelector('#alertForm select[name="destination"]');

  intakeAlertSelect.innerHTML = templateNames
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");

  alertTypeSelect.innerHTML = templateNames
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");

  destinationSelect.innerHTML = destinations
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
}

function renderSnapshot() {
  const snapshot = document.getElementById("siteSnapshot");
  snapshot.innerHTML = `
    <div>
      <dt>Alerts</dt>
      <dd>${state.alerts.length}</dd>
    </div>
    <div>
      <dt>Patients</dt>
      <dd>${state.intakes.length}</dd>
    </div>
    <div>
      <dt>Templates</dt>
      <dd>${state.templates.length}</dd>
    </div>
    <div>
      <dt>Routes</dt>
      <dd>${state.routes.length}</dd>
    </div>
  `;

  document.getElementById("dashboardBadges").innerHTML = `
    <div class="badge"><span class="eyebrow">Active alerts</span><strong>${state.alerts.filter((a) => a.status === "Active").length}</strong></div>
    <div class="badge"><span class="eyebrow">Incoming ETA</span><strong>${Math.min(...state.intakes.map((i) => Number(i.etaMinutes)), 0) || 0}m</strong></div>
    <div class="badge"><span class="eyebrow">Signed in role</span><strong>${escapeHtml(currentUser?.role ?? "None")}</strong></div>
  `;
}

function renderDashboard() {
  renderList("recentAlerts", [...state.alerts].reverse().slice(0, 3), (alert) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(alert.type)}</h4>
        <span class="chip danger">${escapeHtml(alert.status)}</span>
      </header>
      <p>${escapeHtml(alert.patientAlias)}</p>
      <div class="meta-row">
        <span class="chip">${escapeHtml(alert.destination)}</span>
        <span class="chip warn">${escapeHtml(alert.severity)}</span>
      </div>
    </article>
  `);

  renderList("recentPatients", [...state.intakes].reverse().slice(0, 3), (intake) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(intake.patientAlias)}</h4>
        <span class="chip">${escapeHtml(intake.etaMinutes)}m ETA</span>
      </header>
      <p>${escapeHtml(intake.complaint)}</p>
      <div class="meta-row">
        <span class="chip">${escapeHtml(intake.unitName)}</span>
        <span class="chip warn">${escapeHtml(intake.acuity)}</span>
      </div>
    </article>
  `);

  renderList("routingSummary", state.routes, (route) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(route.name)}</h4>
        <span class="chip">${escapeHtml(route.channel)}</span>
      </header>
      <p>${escapeHtml(route.destination)}</p>
    </article>
  `);
}

function renderHome() {
  const config = homeConfigs[currentUser?.role] ?? homeConfigs["Charge Nurse"];

  document.getElementById("homeHeadline").textContent = config.headline;
  document.getElementById("homeSummary").textContent = config.summary;

  document.getElementById("homeBadges").innerHTML = config.badges
    .map((badge) => {
      const value = typeof badge.value === "function" ? badge.value() : badge.value;
      return `<div class="badge"><span class="eyebrow">${escapeHtml(badge.label)}</span><strong>${escapeHtml(value)}</strong></div>`;
    })
    .join("");

  renderList("homeActions", config.actions, (item) => `
    <article class="list-item action-card">
      <p>${escapeHtml(item)}</p>
    </article>
  `);

  renderList("homeFocus", config.focus, (item) => `
    <article class="list-item">
      <p>${escapeHtml(item)}</p>
    </article>
  `);

  renderList("homeWatch", config.watch, (item) => `
    <article class="list-item">
      <p>${escapeHtml(item)}</p>
    </article>
  `);
}

function renderIntakes() {
  renderList("intakeList", [...state.intakes].reverse(), (intake) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(intake.patientAlias)}</h4>
        <span class="chip">${escapeHtml(intake.etaMinutes)}m ETA</span>
      </header>
      <p>${escapeHtml(intake.complaint)}</p>
      <div class="meta-row">
        <span class="chip">${escapeHtml(intake.unitName)}</span>
        <span class="chip warn">${escapeHtml(intake.alertType)}</span>
        <span class="chip">${formatTime(intake.createdAt)}</span>
      </div>
    </article>
  `);
}

function renderAlerts() {
  renderList("alertList", [...state.alerts].reverse(), (alert) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(alert.type)}</h4>
        <span class="chip danger">${escapeHtml(alert.status)}</span>
      </header>
      <p>${escapeHtml(alert.patientAlias)} routed to ${escapeHtml(alert.destination)}</p>
      <div class="meta-row">
        <span class="chip warn">${escapeHtml(alert.severity)}</span>
        <span class="chip">${formatTime(alert.createdAt)}</span>
        ${
          alert.status === "Active" && hasPermission("alert.acknowledge")
            ? `<button class="ghost-button js-ack-alert" data-alert-id="${escapeHtml(alert.id)}">Acknowledge</button>`
            : ""
        }
      </div>
    </article>
  `);

  const alertForm = document.getElementById("alertForm");
  const lockedNote = document.getElementById("alertLockedNote") ?? document.createElement("p");
  lockedNote.id = "alertLockedNote";
  lockedNote.className = "locked-note";

  if (!hasPermission("alert.launch")) {
    Array.from(alertForm.elements).forEach((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) {
        element.disabled = true;
      }
    });
    lockedNote.textContent = "Your current role can review alerts but cannot launch new ones.";
    alertForm.appendChild(lockedNote);
  } else {
    Array.from(alertForm.elements).forEach((element) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) {
        element.disabled = false;
      }
    });
    lockedNote.remove();
  }
}

function renderBoard() {
  const boardEntries = [...state.intakes]
    .sort((left, right) => Number(left.etaMinutes) - Number(right.etaMinutes))
    .map((intake) => {
      const linkedAlert = state.alerts.find((alert) => alert.patientAlias === intake.patientAlias);
      return { intake, linkedAlert };
    });

  const container = document.getElementById("boardList");
  if (!boardEntries.length) {
    container.innerHTML = '<p class="empty-state">No incoming patients on the board.</p>';
    document.getElementById("patientDetail").innerHTML =
      '<p class="empty-state">Select a patient from the board to view detail.</p>';
    return;
  }

  container.innerHTML = boardEntries
    .map(({ intake, linkedAlert }) => `
      <article class="board-card ${state.selectedPatientId === intake.id ? "is-selected" : ""}" data-patient-id="${escapeHtml(
        intake.id,
      )}">
        <header>
          <h4>${escapeHtml(intake.patientAlias)}</h4>
          <span class="chip">${escapeHtml(intake.etaMinutes)}m</span>
        </header>
        <p>${escapeHtml(intake.complaint)}</p>
        <div class="meta-row">
          <span class="chip">${escapeHtml(intake.unitName)}</span>
          <span class="chip warn">${escapeHtml(intake.acuity)}</span>
          ${linkedAlert ? `<span class="chip danger">${escapeHtml(linkedAlert.type)}</span>` : ""}
        </div>
      </article>
    `)
    .join("");

  if (!state.selectedPatientId || !state.intakes.some((intake) => intake.id === state.selectedPatientId)) {
    state.selectedPatientId = state.intakes[0]?.id ?? null;
  }

  renderPatientDetail();
}

function renderPatientDetail() {
  const container = document.getElementById("patientDetail");
  const intake = state.intakes.find((entry) => entry.id === state.selectedPatientId);

  if (!intake) {
    container.innerHTML = '<p class="empty-state">Select a patient from the board to view detail.</p>';
    return;
  }

  const relatedAlerts = state.alerts.filter((alert) => alert.patientAlias === intake.patientAlias);

  container.innerHTML = `
    <section class="detail-section">
      <div class="detail-block">
        <p class="eyebrow">Patient</p>
        <h4>${escapeHtml(intake.patientAlias)}</h4>
        <p>${escapeHtml(intake.complaint)}</p>
        <div class="meta-row">
          <span class="chip">${escapeHtml(intake.unitName)}</span>
          <span class="chip">${escapeHtml(intake.etaMinutes)}m ETA</span>
          <span class="chip warn">${escapeHtml(intake.acuity)}</span>
        </div>
      </div>

      <div class="detail-block">
        <p class="eyebrow">Intake Notes</p>
        <p>${escapeHtml(intake.notes || "No intake notes recorded yet.")}</p>
        <p class="eyebrow">Suggested Alert</p>
        <p>${escapeHtml(intake.alertType || "None")}</p>
      </div>

      <div class="detail-block">
        <p class="eyebrow">Related Alerts</p>
        ${
          relatedAlerts.length
            ? relatedAlerts
                .map(
                  (alert) => `
                  <div class="meta-row">
                    <span class="chip danger">${escapeHtml(alert.type)}</span>
                    <span class="chip">${escapeHtml(alert.status)}</span>
                    <span class="chip warn">${escapeHtml(alert.destination)}</span>
                  </div>
                  <p>${escapeHtml(alert.notes || "No alert notes.")}</p>
                  ${
                    alert.status === "Active" && hasPermission("alert.acknowledge")
                      ? `<div class="detail-actions"><button class="ghost-button js-ack-alert" data-alert-id="${escapeHtml(
                          alert.id,
                        )}">Acknowledge Alert</button></div>`
                      : ""
                  }
                `,
                )
                .join("")
            : '<p class="empty-state">No active or past alerts linked to this patient yet.</p>'
        }
      </div>
    </section>
  `;
}

function renderAdmin() {
  renderList("templateList", state.templates, (template) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(template.name)}</h4>
        <span class="chip">${escapeHtml(template.category)}</span>
      </header>
      <p>${escapeHtml(template.destination)}</p>
    </article>
  `);

  renderList("routeList", state.routes, (route) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(route.name)}</h4>
        <span class="chip">${escapeHtml(route.channel)}</span>
      </header>
      <p>${escapeHtml(route.destination)}</p>
    </article>
  `);

  renderList("roleList", state.roles, (role) => `
    <article class="list-item">
      <header>
        <h4>${escapeHtml(role.name)}</h4>
      </header>
      <p>${escapeHtml(role.permissions.join(", "))}</p>
    </article>
  `);
}

function renderCurrentUser() {
  const card = document.getElementById("currentUserCard");
  if (!currentUser) {
    card.innerHTML = "";
    return;
  }

  card.innerHTML = `
    <p><strong>${escapeHtml(currentUser.name)}</strong></p>
    <p>${escapeHtml(currentUser.role)}</p>
  `;
}

function renderNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    const allowed = canAccessView(button.dataset.view);
    button.hidden = !allowed;
    button.disabled = !allowed;
  });
}

function renderAll() {
  if (!currentUser) return;
  refreshSelectOptions();
  renderCurrentUser();
  renderNavigation();
  renderHome();
  renderSnapshot();
  renderDashboard();
  renderIntakes();
  renderAlerts();
  renderBoard();
  renderAdmin();
}

function activateView(viewName) {
  if (!canAccessView(viewName)) {
    viewName = firstAllowedView();
  }

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-visible", view.id === `view-${viewName}`);
  });

  document.getElementById("viewTitle").textContent =
    document.querySelector(`.nav-link[data-view="${viewName}"]`)?.textContent ?? "Dashboard";
}

function setAuthenticatedShell() {
  document.body.classList.toggle("auth-required", !currentUser);
  document.body.classList.toggle("app-ready", Boolean(currentUser));
}

function login(email, password) {
  const matchedUser = demoUsers.find((user) => user.email === email.trim().toLowerCase() && user.password === password);
  if (!matchedUser) return false;

  currentUser = matchedUser;
  saveSession(currentUser);
  setAuthenticatedShell();
  renderAll();
  activateView(firstAllowedView());
  return true;
}

function logout() {
  currentUser = null;
  saveSession(null);
  setAuthenticatedShell();
  document.getElementById("loginForm").reset();
  document.getElementById("loginError").hidden = true;
}

function acknowledgeAlert(alertId) {
  if (!hasPermission("alert.acknowledge")) return;

  const alert = state.alerts.find((entry) => entry.id === alertId);
  if (!alert) return;

  alert.status = "Acknowledged";
  alert.acknowledgedAt = new Date().toISOString();
  saveState();
  renderAll();
}

function collectFormEntries(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function attachNav() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.view));
  });
}

function attachForms() {
  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const entry = collectFormEntries(event.currentTarget);
    const ok = login(entry.email, entry.password);
    document.getElementById("loginError").hidden = ok;
  });

  document.getElementById("intakeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission("intake.create")) return;

    const entry = collectFormEntries(event.currentTarget);
    state.intakes.push({
      id: crypto.randomUUID(),
      ...entry,
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderAll();
    event.currentTarget.reset();
    refreshSelectOptions();
  });

  document.getElementById("alertForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission("alert.launch")) return;

    const entry = collectFormEntries(event.currentTarget);
    state.alerts.push({
      id: crypto.randomUUID(),
      ...entry,
      status: "Active",
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderAll();
    event.currentTarget.reset();
    refreshSelectOptions();
  });

  document.getElementById("templateForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission("template.manage")) return;

    const entry = collectFormEntries(event.currentTarget);
    state.templates.push({ id: crypto.randomUUID(), ...entry });
    saveState();
    renderAll();
    event.currentTarget.reset();
  });

  document.getElementById("routingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission("routing.manage")) return;

    const entry = collectFormEntries(event.currentTarget);
    state.routes.push({ id: crypto.randomUUID(), ...entry });
    saveState();
    renderAll();
    event.currentTarget.reset();
  });

  document.getElementById("roleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission("roles.manage")) return;

    const entry = collectFormEntries(event.currentTarget);
    state.roles.push({
      id: crypto.randomUUID(),
      name: entry.name,
      permissions: entry.permissions.split(",").map((permission) => permission.trim()).filter(Boolean),
    });
    saveState();
    renderAll();
    event.currentTarget.reset();
  });
}

function attachInteractiveLists() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const alertButton = target.closest(".js-ack-alert");
    if (alertButton instanceof HTMLElement) {
      acknowledgeAlert(alertButton.dataset.alertId);
      return;
    }

    const boardCard = target.closest(".board-card");
    if (boardCard instanceof HTMLElement && boardCard.dataset.patientId) {
      state.selectedPatientId = boardCard.dataset.patientId;
      saveState();
      renderAll();
    }
  });
}

function attachUtilityActions() {
  document.getElementById("seedDemoData").addEventListener("click", () => {
    state = structuredClone(defaultState);
    saveState();
    renderAll();
    activateView(firstAllowedView());
  });

  document.getElementById("clearData").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    saveState();
    renderAll();
    activateView(firstAllowedView());
  });

  document.getElementById("logoutButton").addEventListener("click", logout);
}

function bootstrap() {
  attachNav();
  attachForms();
  attachInteractiveLists();
  attachUtilityActions();
  setAuthenticatedShell();

  if (currentUser) {
    renderAll();
    activateView(firstAllowedView());
  }
}

bootstrap();
