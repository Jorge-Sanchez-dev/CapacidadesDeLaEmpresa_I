document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  await Promise.all([loadDashboard(token), loadUsers(token)]);
});

async function loadDashboard(token) {
  const kpisEl = document.getElementById("kpis");
  const recentEl = document.getElementById("recent-movements");

  if (!kpisEl || !recentEl) return;

  try {
    const res = await fetch("/admin/dashboard", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error cargando dashboard");

    const k = data.kpis || {};

    // KPIs
    kpisEl.innerHTML = `
      <section class="info-card">
        <h2>Usuarios</h2>
        <div class="info-line"><span>Total</span><span class="info-value">${k.usersTotal ?? "—"}</span></div>
        <div class="info-line"><span>Nuevos (7d)</span><span class="info-value">${k.usersLast7d ?? "—"}</span></div>
      </section>

      <section class="info-card">
        <h2>Cuentas</h2>
        <div class="info-line"><span>Total</span><span class="info-value">${k.accountsTotal ?? "—"}</span></div>
        <div class="info-line"><span>Activas</span><span class="info-value">${k.accountsActive ?? "—"}</span></div>
      </section>

      <section class="info-card">
        <h2>Movimientos (7d)</h2>
        <div class="info-line"><span>Transfers</span><span class="info-value">${k.transfersLast7d ?? "—"}</span></div>
        <div class="info-line"><span>Bizums</span><span class="info-value">${k.bizumsLast7d ?? "—"}</span></div>
      </section>

      <section class="info-card">
        <h2>Balance total</h2>
        <div class="info-line">
          <span>Activas</span>
          <span class="info-value">${formatMoney(k.totalBalance ?? 0)}</span>
        </div>
      </section>
    `;

    // Actividad reciente
    const movements = data.recentMovements || [];
    if (movements.length === 0) {
      recentEl.innerHTML = `<div class="info-card"><h2>Sin actividad</h2></div>`;
      return;
    }

    recentEl.innerHTML = "";
    movements.forEach((m) => {
      const card = document.createElement("section");
      card.className = "info-card";

      const date = m.date ? new Date(m.date) : new Date();
      const prettyDate = isNaN(date.getTime()) ? "—" : date.toLocaleString("es-ES");

      const fromName = m.from?.name || "—";
      const toName = m.to?.name || "—";

      // si quieres mostrar IBAN cuando exista
      const fromIban = m.from?.iban ? ` (${m.from.iban})` : "";
      const toIban = m.to?.iban ? ` (${m.to.iban})` : "";

      card.innerHTML = `
        <h2>${escapeHtml(m.type || "MOV")} · ${formatMoney(m.amount || 0)}</h2>

        <div class="info-line">
          <span>Fecha</span>
          <span class="info-value">${prettyDate}</span>
        </div>

        <div class="info-line">
          <span>De</span>
          <span class="info-value">${escapeHtml(fromName)}${escapeHtml(fromIban)}</span>
        </div>

        <div class="info-line">
          <span>A</span>
          <span class="info-value">${escapeHtml(toName)}${escapeHtml(toIban)}</span>
        </div>

        <div class="info-line">
          <span>Concepto</span>
          <span class="info-value">${escapeHtml(m.concept || "—")}</span>
        </div>
      `;
      recentEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    kpisEl.innerHTML = `
      <div class="info-card">
        <h2>Error Dashboard</h2>
        <div style="opacity:.85">${err.message || "No se pudo cargar."}</div>
      </div>
    `;
    recentEl.innerHTML = "";
  }
}

async function loadUsers(token) {
  const list = document.getElementById("users-list");
  if (!list) return;

  try {
    const res = await fetch("/admin/users", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error cargando usuarios");

    const users = data.users || [];
    list.innerHTML = "";

    if (users.length === 0) {
      list.innerHTML = `<div class="info-card"><h2>Sin usuarios</h2></div>`;
      return;
    }

    users.forEach((u) => {
      const card = document.createElement("section");
      card.className = "info-card";
      card.innerHTML = `
        <h2>${escapeHtml(u.name || "")} ${escapeHtml(u.surname || "")}</h2>
        <div class="info-line"><span>Email</span><span class="info-value">${escapeHtml(u.email || "—")}</span></div>
        <div class="info-line"><span>Teléfono</span><span class="info-value">${escapeHtml(u.phone || "—")}</span></div>
        <div class="info-line"><span>Rol</span><span class="info-value">${escapeHtml(u.role || "USER")}</span></div>
      `;
      list.appendChild(card);
    });
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
