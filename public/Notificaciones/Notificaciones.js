document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("btn-refresh")?.addEventListener("click", () => loadNotifications(token));
  document.getElementById("btn-mark-all")?.addEventListener("click", () => markAllRead(token));

  await loadNotifications(token);
});

async function loadNotifications(token) {
  const list = document.getElementById("notifications-list");
  if (!list) return;

  list.innerHTML = `<div class="info-card"><h2>Cargando...</h2></div>`;

  try {
    const res = await fetch("/notifications/mine", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las notificaciones");

    const notifs = data.notifications || [];
    if (notifs.length === 0) {
      list.innerHTML = `<div class="info-card"><h2>Sin notificaciones</h2><div style="opacity:.8">Todo tranquilo por aquí 😄</div></div>`;
      return;
    }

    list.innerHTML = "";
    notifs.forEach((n) => {
      const card = document.createElement("section");
      card.className = "info-card";

      const d = n.createdAt ? new Date(n.createdAt) : new Date();
      const pretty = isNaN(d.getTime()) ? "—" : d.toLocaleString("es-ES");

      const badge = n.read ? "LEÍDA" : "NUEVA";
      const badgeStyle = n.read
        ? "opacity:.7"
        : "font-weight:700;";

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
          <div>
            <h2 style="margin-bottom:6px;">${escapeHtml(n.title || "Notificación")}</h2>
            <div style="opacity:.85; margin-bottom:8px;">${escapeHtml(n.message || "")}</div>
            <div style="opacity:.65; font-size:.92rem;">${pretty} </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end; min-width:120px;">
            <div style="${badgeStyle}">${badge}</div>
            ${
              n.read
                ? ""
                : `<button class="btn secondary" data-id="${n._id}">Marcar leído</button>`
            }
          </div>
        </div>
      `;

      card.querySelector("button[data-id]")?.addEventListener("click", () => markRead(token, n._id));

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

async function markRead(token, id) {
  try {
    const res = await fetch(`/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo marcar como leído");

    await loadNotifications(token);
  } catch (err) {
    console.error(err);
    alert(err.message || "Error");
  }
}

async function markAllRead(token) {
  // Si no tienes endpoint “mark all”, lo hacemos a lo bruto: leer y marcar uno a uno
  try {
    const res = await fetch("/notifications/mine", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudieron cargar");

    const pending = (data.notifications || []).filter((n) => !n.read);
    for (const n of pending) {
      await fetch(`/notifications/${n._id}/read`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
    }

    await loadNotifications(token);
  } catch (err) {
    console.error(err);
    alert(err.message || "Error");
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
