// /Admin/Usuarios.js
const API_BASE = "/api/admin";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  // ✅ (Opcional) añade estilos solo para el resumen de movimientos del Admin
  injectAdminMovementStyles();

  await loadUsers(token);

  const search = document.getElementById("search");
  if (search) search.addEventListener("input", () => filterUsers());
});

let ALL_USERS = [];

async function loadUsers(token) {
  const list = document.getElementById("users-list");
  if (!list) return;

  list.innerHTML = `<div class="info-card"><h2>Cargando...</h2></div>`;

  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: "Bearer " + token },
    });

    const body = await readBody(res);
    if (!res.ok) throw new Error(getMsg(body) || "Error cargando usuarios");

    ALL_USERS = body?.users || [];
    renderUsers(ALL_USERS, token);
  } catch (err) {
    console.error("loadUsers error:", err);
    list.innerHTML = `
      <div class="info-card">
        <h2>Error</h2>
        <div style="opacity:.85">${err.message || "No se pudo cargar."}</div>
      </div>
    `;
  }
}

function filterUsers() {
  const q = (document.getElementById("search")?.value || "")
    .toLowerCase()
    .trim();

  const filtered = ALL_USERS.filter((u) => {
    const name = `${u.name || ""} ${u.surname || ""}`.toLowerCase();
    const email = String(u.email || "").toLowerCase();
    const role = String(u.role || "").toLowerCase();
    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  const token = localStorage.getItem("token") || "";
  renderUsers(filtered, token);
}

function renderUsers(users, token) {
  const list = document.getElementById("users-list");
  if (!list) return;

  list.innerHTML = "";

  if (!users || users.length === 0) {
    list.innerHTML = `<div class="info-card"><h2>Sin usuarios</h2></div>`;
    return;
  }

  users.forEach((u) => {
    const card = document.createElement("section");
    card.className = "info-card";

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
        <div>
          <h2>${escapeHtml(u.name || "")} ${escapeHtml(u.surname || "")}</h2>
          <div class="info-line"><span>Email</span><span class="info-value">${escapeHtml(u.email || "—")}</span></div>
          <div class="info-line"><span>Teléfono</span><span class="info-value">${escapeHtml(u.phone || "—")}</span></div>
          <div class="info-line"><span>Rol</span><span class="info-value">${escapeHtml(u.role || "USER")}</span></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; min-width:150px;">
          <button class="btn secondary" data-action="summary" data-id="${u._id}">Resumen</button>
          <button class="btn primary" data-action="edit" data-id="${u._id}">Editar</button>
        </div>
      </div>

      <div id="summary-${u._id}" style="display:none; margin-top:12px;"></div>
    `;

    card
      .querySelector('[data-action="summary"]')
      .addEventListener("click", () => toggleSummary(u._id, token));
    card
      .querySelector('[data-action="edit"]')
      .addEventListener("click", () => openEditModal(u, token));

    list.appendChild(card);
  });
}

async function toggleSummary(userId, token) {
  const box = document.getElementById(`summary-${userId}`);
  if (!box) return;

  const isOpen = box.style.display !== "none";
  if (isOpen) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }

  box.style.display = "block";
  box.innerHTML = `<div style="opacity:.8">Cargando resumen...</div>`;

  try {
    const res = await fetch(`${API_BASE}/users/${userId}/summary`, {
      headers: { Authorization: "Bearer " + token },
    });

    const body = await readBody(res);
    if (!res.ok) throw new Error(getMsg(body) || "No se pudo cargar el resumen");

    const acc = body?.account;
    const movs = body?.movements || [];

    box.innerHTML = `
      <div class="info-card" style="margin-top:10px;">
        <h2>Cuenta principal</h2>
        ${
          acc
            ? `
              <div class="info-line"><span>IBAN</span><span class="info-value">${escapeHtml(
                acc.iban || "—"
              )}</span></div>
              <div class="info-line"><span>Saldo</span><span class="info-value">${formatMoney(
                acc.balance || 0
              )}</span></div>
              <div class="info-line"><span>Moneda</span><span class="info-value">${escapeHtml(
                acc.currency || "—"
              )}</span></div>
              <div class="info-line"><span>Estado</span><span class="info-value">${escapeHtml(
                acc.status || "—"
              )}</span></div>
            `
            : `<div style="opacity:.8">Este usuario no tiene cuenta principal activa.</div>`
        }
      </div>

      <div class="info-card" style="margin-top:10px;">
        <h2>Últimos movimientos</h2>
        ${renderMovements(movs)}
      </div>
    `;
  } catch (err) {
    console.error("toggleSummary error:", err);
    box.innerHTML = `
      <div class="info-card">
        <h2>Error</h2>
        <div style="opacity:.85">${err.message || "No se pudo cargar."}</div>
      </div>
    `;
  }
}

/**
 * ✅ CORREGIDO:
 * - separa icono/dirección/fecha/importe en spans distintos
 * - usa flex + gap (inyectado por injectAdminMovementStyles)
 * - evita que el emoji “pise” la fecha
 */
function renderMovements(movs) {
  if (!movs || movs.length === 0)
    return `<div style="opacity:.8">Sin movimientos.</div>`;

  return movs
    .map((m) => {
      const d = m.date ? new Date(m.date) : new Date();
      const pretty = isNaN(d.getTime()) ? "—" : d.toLocaleString("es-ES");

      const type = m.type || "MOV";
      const direction =
        m.direction === "IN" ? "IN" : m.direction === "OUT" ? "OUT" : "—";
      const arrow =
        direction === "IN" ? "⬅️" : direction === "OUT" ? "➡️" : "•";

      return `
        <div class="admin-mov-item">
          <div class="admin-mov-top">
            <span class="admin-mov-type">${escapeHtml(type)}</span>
            <span class="admin-mov-dir">${arrow}</span>
            <span class="admin-mov-dirtext">${escapeHtml(direction)}</span>

            <span class="admin-mov-right">
              <span class="admin-mov-date">${escapeHtml(pretty)}</span>
              <span class="admin-mov-sep">·</span>
              <span class="admin-mov-amt">${formatMoney(m.amount || 0)}</span>
            </span>
          </div>

          <div class="admin-mov-concept">${escapeHtml(m.concept || "—")}</div>
        </div>
      `;
    })
    .join("");
}

function openEditModal(u, token) {
  const root = document.getElementById("edit-modal-root");
  if (!root) return;

  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,.55)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  overlay.innerHTML = `
    <div class="info-card" style="width:min(720px, 92vw);">
      <h2>Editar usuario</h2>

      <div class="info-line"><span>Nombre</span><span class="info-value"><input id="ed-name" value="${escapeAttr(
        u.name || ""
      )}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Apellidos</span><span class="info-value"><input id="ed-surname" value="${escapeAttr(
        u.surname || ""
      )}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Email</span><span class="info-value"><input id="ed-email" value="${escapeAttr(
        u.email || ""
      )}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Teléfono</span><span class="info-value"><input id="ed-phone" value="${escapeAttr(
        u.phone || ""
      )}" style="width:260px;" /></span></div>

      <div class="info-line">
        <span>Rol</span>
        <span class="info-value">
          <select id="ed-role">
            <option value="USER" ${
              String(u.role || "USER") === "USER" ? "selected" : ""
            }>USER</option>
            <option value="ADMIN" ${
              String(u.role || "USER") === "ADMIN" ? "selected" : ""
            }>ADMIN</option>
          </select>
        </span>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
        <button class="btn secondary" id="ed-cancel">Cancelar</button>
        <button class="btn primary" id="ed-save">Guardar</button>
      </div>

      <div id="ed-msg" style="margin-top:10px; opacity:.9;"></div>
      <div id="ed-debug" style="margin-top:8px; opacity:.75; font-size:.9em;"></div>
    </div>
  `;

  const close = () => {
    overlay.remove();
    root.innerHTML = "";
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector("#ed-cancel").addEventListener("click", close);

  overlay.querySelector("#ed-save").addEventListener("click", async () => {
    const msg = overlay.querySelector("#ed-msg");
    const dbg = overlay.querySelector("#ed-debug");

    const name = String(overlay.querySelector("#ed-name").value || "").trim();
    const surname = String(
      overlay.querySelector("#ed-surname").value || ""
    ).trim();
    const email = String(overlay.querySelector("#ed-email").value || "")
      .trim()
      .toLowerCase();
    const phone = String(overlay.querySelector("#ed-phone").value || "")
      .trim()
      .replace(/\s+/g, "");
    const role = String(overlay.querySelector("#ed-role").value || "USER");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[67][0-9]{8}$/;

    if (!email) {
      msg.textContent = "El email es obligatorio.";
      return;
    }
    if (!emailRegex.test(email)) {
      msg.textContent = "Formato de email no válido.";
      return;
    }
    if (!phone) {
      msg.textContent = "El teléfono es obligatorio.";
      return;
    }
    if (!phoneRegex.test(phone)) {
      msg.textContent =
        "Teléfono no válido (debe empezar por 6 o 7 y tener 9 dígitos).";
      return;
    }

    const originalEmail = String(u.email || "").trim().toLowerCase();
    const originalPhone = String(u.phone || "").trim().replace(/\s+/g, "");
    const originalName = String(u.name || "").trim();
    const originalSurname = String(u.surname || "").trim();
    const originalRole = String(u.role || "USER");

    const noChanges =
      name === originalName &&
      surname === originalSurname &&
      email === originalEmail &&
      phone === originalPhone &&
      role === originalRole;

    if (noChanges) {
      msg.textContent = "No hay cambios para guardar.";
      return;
    }

    const payload = { name, surname, email, phone, role };

    msg.textContent = "Guardando...";
    dbg.textContent = "";

    try {
      const url = `${API_BASE}/users/${u._id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const body = await readBody(res);

      dbg.textContent = `Status: ${res.status} · ${url}`;

      console.log("PUT user:", res.status, url, body);

      if (!res.ok) {
        throw new Error(getMsg(body) || "No se pudo guardar");
      }

      msg.textContent = "Guardado ✅ (recargando...)";
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error("SAVE ERROR:", err);
      msg.textContent = err.message || "Error guardando";
    }
  });

  root.appendChild(overlay);
}

function formatMoney(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function readBody(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    return await res.json().catch(() => null);
  }

  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getMsg(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body.message) return body.message;
  return "";
}


function injectAdminMovementStyles() {
  if (document.getElementById("admin-mov-styles")) return;

  const style = document.createElement("style");
  style.id = "admin-mov-styles";
  style.textContent = `
    .admin-mov-item{ margin-top:10px; }
    .admin-mov-top{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
    }
    .admin-mov-right{
      margin-left:auto;
      display:flex;
      align-items:center;
      gap:10px;
    }
    .admin-mov-dir{
      width:22px;
      display:inline-flex;
      justify-content:center;
      flex:0 0 auto;
    }
    .admin-mov-type{ opacity:.8; letter-spacing:.02em; }
    .admin-mov-concept{ opacity:.85; margin:6px 0 12px 0; }
    .admin-mov-sep{ opacity:.7; }
  `;
  document.head.appendChild(style);
}
