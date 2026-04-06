const STORAGE_KEY = "gd-carepoint-app-state";

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

let state = loadState();

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

function formatTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    <div class="badge"><span class="eyebrow">Admin roles</span><strong>${state.roles.length}</strong></div>
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
          alert.status === "Active"
            ? `<button class="ghost-button js-ack-alert" data-alert-id="${escapeHtml(alert.id)}">Acknowledge</button>`
            : ""
        }
      </div>
    </article>
  `);
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
                    alert.status === "Active"
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

function renderAll() {
  refreshSelectOptions();
  renderSnapshot();
  renderDashboard();
  renderIntakes();
  renderAlerts();
  renderBoard();
  renderAdmin();
}

function activateView(viewName) {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-visible", view.id === `view-${viewName}`);
  });

  document.getElementById("viewTitle").textContent =
    document.querySelector(`.nav-link[data-view="${viewName}"]`)?.textContent ?? "Dashboard";
}

function attachNav() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.view));
  });
}

function acknowledgeAlert(alertId) {
  const alert = state.alerts.find((entry) => entry.id === alertId);
  if (!alert) return;

  alert.status = "Acknowledged";
  alert.acknowledgedAt = new Date().toISOString();
  saveState();
  renderAll();
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

function collectFormEntries(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function attachForms() {
  document.getElementById("intakeForm").addEventListener("submit", (event) => {
    event.preventDefault();
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
    const entry = collectFormEntries(event.currentTarget);
    state.templates.push({ id: crypto.randomUUID(), ...entry });
    saveState();
    renderAll();
    event.currentTarget.reset();
  });

  document.getElementById("routingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const entry = collectFormEntries(event.currentTarget);
    state.routes.push({ id: crypto.randomUUID(), ...entry });
    saveState();
    renderAll();
    event.currentTarget.reset();
  });

  document.getElementById("roleForm").addEventListener("submit", (event) => {
    event.preventDefault();
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

function attachUtilityActions() {
  document.getElementById("seedDemoData").addEventListener("click", () => {
    state = structuredClone(defaultState);
    saveState();
    renderAll();
  });

  document.getElementById("clearData").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    renderAll();
  });
}

attachNav();
attachForms();
attachUtilityActions();
attachInteractiveLists();
renderAll();
activateView("dashboard");
