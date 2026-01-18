document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  // Carga usuarios
  await loadUsers(token);

  // Buscador
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", () => filterUsers());
  }
});

let ALL_USERS = [];

async function loadUsers(token) {
  const list = document.getElementById("users-list");
  if (!list) return;

  list.innerHTML = `<div class="info-card"><h2>Cargando...</h2></div>`;

  try {
    const res = await fetch("/admin/users", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error cargando usuarios");

    ALL_USERS = data.users || [];
    renderUsers(ALL_USERS, token);
  } catch (err) {
    console.error(err);
    list.innerHTML = `
      <div class="info-card">
        <h2>Error</h2>
        <div style="opacity:.85">${err.message || "No se pudo cargar."}</div>
      </div>
    `;
  }
}

function filterUsers() {
  const q = (document.getElementById("search")?.value || "").toLowerCase().trim();

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

    card.querySelector('[data-action="summary"]').addEventListener("click", () =>
      toggleSummary(u._id, token)
    );
    card.querySelector('[data-action="edit"]').addEventListener("click", () =>
      openEditModal(u, token)
    );

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
    const res = await fetch(`/admin/users/${userId}/summary`, {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo cargar el resumen");

    const acc = data.account;
    const movs = data.movements || [];

    box.innerHTML = `
      <div class="info-card" style="margin-top:10px;">
        <h2>Cuenta principal</h2>
        ${
          acc
            ? `
              <div class="info-line"><span>IBAN</span><span class="info-value">${escapeHtml(acc.iban || "—")}</span></div>
              <div class="info-line"><span>Saldo</span><span class="info-value">${formatMoney(acc.balance || 0)}</span></div>
              <div class="info-line"><span>Moneda</span><span class="info-value">${escapeHtml(acc.currency || "—")}</span></div>
              <div class="info-line"><span>Estado</span><span class="info-value">${escapeHtml(acc.status || "—")}</span></div>
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
    console.error(err);
    box.innerHTML = `
      <div class="info-card">
        <h2>Error</h2>
        <div style="opacity:.85">${err.message || "No se pudo cargar."}</div>
      </div>
    `;
  }
}

function renderMovements(movs) {
  if (!movs || movs.length === 0) return `<div style="opacity:.8">Sin movimientos.</div>`;

  return movs
    .map((m) => {
      const d = m.date ? new Date(m.date) : new Date();
      const pretty = isNaN(d.getTime()) ? "—" : d.toLocaleString("es-ES");
      const dir = m.direction === "IN" ? "⬅️ IN" : m.direction === "OUT" ? "➡️ OUT" : "—";

      return `
        <div class="info-line">
          <span>${escapeHtml(m.type || "MOV")} · ${dir}</span>
          <span class="info-value">${pretty} · ${formatMoney(m.amount || 0)}</span>
        </div>
        <div style="opacity:.85; margin: 6px 0 12px 0;">${escapeHtml(m.concept || "—")}</div>
      `;
    })
    .join("");
}

function openEditModal(u, token) {
  const root = document.getElementById("edit-modal-root");
  if (!root) return;

  root.innerHTML = ""; // limpia si había uno

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

      <div class="info-line"><span>Nombre</span><span class="info-value"><input id="ed-name" value="${escapeAttr(u.name || "")}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Apellidos</span><span class="info-value"><input id="ed-surname" value="${escapeAttr(u.surname || "")}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Email</span><span class="info-value"><input id="ed-email" value="${escapeAttr(u.email || "")}" style="width:260px;" /></span></div>
      <div class="info-line"><span>Teléfono</span><span class="info-value"><input id="ed-phone" value="${escapeAttr(u.phone || "")}" style="width:260px;" /></span></div>

      <div class="info-line">
        <span>Rol</span>
        <span class="info-value">
          <select id="ed-role">
            <option value="USER" ${String(u.role || "USER") === "USER" ? "selected" : ""}>USER</option>
            <option value="ADMIN" ${String(u.role || "USER") === "ADMIN" ? "selected" : ""}>ADMIN</option>
          </select>
        </span>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
        <button class="btn secondary" id="ed-cancel">Cancelar</button>
        <button class="btn primary" id="ed-save">Guardar</button>
      </div>

      <div id="ed-msg" style="margin-top:10px; opacity:.9;"></div>
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
    const payload = {
      name: overlay.querySelector("#ed-name").value,
      surname: overlay.querySelector("#ed-surname").value,
      email: overlay.querySelector("#ed-email").value,
      phone: overlay.querySelector("#ed-phone").value,
      role: overlay.querySelector("#ed-role").value,
    };

    const msg = overlay.querySelector("#ed-msg");
    msg.textContent = "Guardando...";

    try {
      const res = await fetch(`/admin/users/${u._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "No se pudo guardar");

      msg.textContent = "Guardado ✅ (recargando...)";
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || "Error guardando";
    }
  });

  root.appendChild(overlay);
}

function formatMoney(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
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
