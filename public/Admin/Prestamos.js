// public/Admin/Prestamos.js

// ✅ Prefijos de API (cambia aquí y se arregla todo)
const API_ADMIN = "/api/admin"; // <- admin API nueva
const API_LOANS = "/loans";     // <- tus loans están montados en /loans (si los pasas a /api/loans, cambia aquí)

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const statusSel = document.getElementById("status");
  const refreshBtn = document.getElementById("btn-refresh");

  statusSel?.addEventListener("change", () => loadLoans(token));
  refreshBtn?.addEventListener("click", () => loadLoans(token));

  await loadLoans(token);
});

async function loadLoans(token) {
  const list = document.getElementById("loans-list");
  const statusSel = document.getElementById("status");
  if (!list || !statusSel) return;

  const status = statusSel.value || "PENDING";
  list.innerHTML = `<div class="info-card"><h2>Cargando...</h2></div>`;

  try {
    // ✅ LISTADO: ahora en /api/admin/loans (evita conflicto con /Admin/Admin.html)
    const res = await fetch(
      `${API_ADMIN}/loans?status=${encodeURIComponent(status)}`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.log("LIST LOANS response:", res.status, data || text);
      throw new Error(data?.message || `Error ${res.status} cargando préstamos`);
    }

    const loans = data?.loans || [];
    if (loans.length === 0) {
      list.innerHTML = `
        <div class="info-card">
          <h2>Sin solicitudes</h2>
          <div style="opacity:.8">No hay préstamos en este estado.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = "";
    loans.forEach((l) => {
      const card = document.createElement("section");
      card.className = "info-card";

      const applicant = l.applicant || {};
      const fullName =
        `${applicant.name || ""} ${applicant.surname || ""}`.trim() || "—";

      const created = l.createdAt ? new Date(l.createdAt) : null;
      const prettyDate =
        created && !isNaN(created.getTime())
          ? created.toLocaleString("es-ES")
          : "—";

      const amount = Number(l.amount || 0);
      const months = Number(l.months || 0);
      const purpose = l.purpose || l.concept || "";
      const loanStatus = String(l.status || "PENDING");

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:14px; align-items:flex-start; flex-wrap:wrap;">
          <div style="min-width:280px; flex:1;">
            <h2 style="margin-bottom:6px;">${escapeHtml(fullName)}</h2>

            <div class="info-line">
              <span>Importe</span>
              <span class="info-value">${formatMoney(amount)}</span>
            </div>

            <div class="info-line">
              <span>Plazo</span>
              <span class="info-value">${months ? months + " meses" : "—"}</span>
            </div>

            <div class="info-line">
              <span>Email</span>
              <span class="info-value">${escapeHtml(applicant.email || "—")}</span>
            </div>

            <div class="info-line">
              <span>Fecha</span>
              <span class="info-value">${escapeHtml(prettyDate)}</span>
            </div>

            ${
              purpose
                ? `<div style="margin-top:10px; opacity:.85;">📝 ${escapeHtml(
                    purpose
                  )}</div>`
                : ""
            }

            <div style="margin-top:10px; opacity:.75;">
              Estado: <b>${escapeHtml(loanStatus)}</b>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; min-width:170px; align-items:flex-end;">
            ${
              loanStatus === "PENDING"
                ? `
                  <button class="btn primary" data-action="approve" data-id="${l._id}">Aceptar</button>
                  <button class="btn secondary" data-action="reject" data-id="${l._id}">Denegar</button>
                `
                : `<div style="opacity:.7; margin-top:8px;">Sin acciones</div>`
            }
          </div>
        </div>
      `;

      card
        .querySelector('[data-action="approve"]')
        ?.addEventListener("click", () =>
          openDecisionModal(token, l._id, "approve")
        );

      card
        .querySelector('[data-action="reject"]')
        ?.addEventListener("click", () =>
          openDecisionModal(token, l._id, "reject")
        );

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

function openDecisionModal(token, loanId, action) {
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
  root.innerHTML = "";

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,.55)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  const isApprove = action === "approve";

  overlay.innerHTML = `
    <div class="info-card" style="width:min(720px, 92vw);">
      <h2>${isApprove ? "Aceptar préstamo" : "Denegar préstamo"}</h2>

      ${
        isApprove
          ? `
            <div class="info-line">
              <span>APR (%)</span>
              <span class="info-value">
                <input id="apr" type="number" step="0.1" value="6" style="width:140px;" />
              </span>
            </div>
          `
          : `
            <div style="margin-top:8px; opacity:.9;">Motivo (opcional)</div>
            <textarea id="reason" rows="3" style="width:100%; margin-top:8px; border-radius:12px; padding:10px;"></textarea>
          `
      }

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
        <button class="btn secondary" id="cancel">Cancelar</button>
        <button class="btn primary" id="confirm">${isApprove ? "Aceptar" : "Denegar"}</button>
      </div>

      <div id="msg" style="margin-top:10px; opacity:.85;"></div>
    </div>
  `;

  const close = () => {
    overlay.remove();
    root.innerHTML = "";
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector("#cancel")?.addEventListener("click", close);

  overlay.querySelector("#confirm")?.addEventListener("click", async () => {
    const msg = overlay.querySelector("#msg");
    msg.textContent = "Procesando...";

    try {
      if (isApprove) {
        const apr = Number(overlay.querySelector("#apr")?.value || 6);

        // ✅ DECIDIR: tu endpoint actual está en /loans/:id/decide
        const res = await fetch(`${API_LOANS}/${loanId}/decide`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ action: "APPROVE", apr }),
        });

        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch {}

        console.log("APPROVE response:", res.status, data || text);

        if (!res.ok) {
          throw new Error(data?.message || `Error ${res.status} aprobando préstamo`);
        }
      } else {
        const reason = String(overlay.querySelector("#reason")?.value || "");

        // ✅ DECIDIR: tu endpoint actual está en /loans/:id/decide
        const res = await fetch(`${API_LOANS}/${loanId}/decide`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ action: "REJECT", reason }),
        });

        const text = await res.text();
        let data = null;
        try { data = JSON.parse(text); } catch {}

        console.log("REJECT response:", res.status, data || text);

        if (!res.ok) {
          throw new Error(data?.message || `Error ${res.status} denegando préstamo`);
        }
      }

      msg.textContent = "Hecho ✅";
      setTimeout(async () => {
        close();
        await loadLoans(token);
      }, 400);
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || "Error";
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
