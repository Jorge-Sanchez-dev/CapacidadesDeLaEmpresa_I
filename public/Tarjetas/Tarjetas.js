// /Tarjetas.js

/* =========================
   MODAL MENSAJES (ERRORES)
   ========================= */
function showModal(message, title = "Aviso") {
  const overlay = document.getElementById("modal-overlay");
  const titleEl = document.getElementById("modal-title");
  const textEl = document.getElementById("modal-text");
  const okBtn = document.getElementById("modal-ok");

  if (!overlay || !titleEl || !textEl || !okBtn) {
    alert(message);
    return;
  }

  titleEl.textContent = title;
  textEl.textContent = message;
  overlay.classList.remove("hidden");

  const close = () => overlay.classList.add("hidden");
  okBtn.onclick = close;

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  document.onkeydown = (e) => {
    if (e.key === "Escape") close();
  };
}

/* =========================
   DOM READY
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  /* ---------- DOM ---------- */
  const greetingEl = document.getElementById("greeting");
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("cards-count");

  // ✅ saldo real de la cuenta del usuario (del dashboard)
  let dashboardBalance = 0;

  /* ---------- HELPERS ---------- */
  function authHeaders(extra = {}) {
    return { Authorization: "Bearer " + token, ...extra };
  }

  function formatEUR(n) {
    const num = typeof n === "number" ? n : Number(n || 0);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  }

  function formatExpiry(m, y) {
    return `${String(m).padStart(2, "0")}/${String(y).padStart(2, "0")}`;
  }

  /* ---------- FETCH DASHBOARD (para saludo + saldo real) ---------- */
  async function fetchDashboard() {
    const res = await fetch("/auth/dashboard", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error usuario");
    return data;
  }

  /* ---------- FETCH CARDS ---------- */
  async function fetchCards() {
    const res = await fetch("/cards", { headers: authHeaders() });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error tarjetas");
    return data.cards || [];
  }

  /* ---------- RENDER ---------- */
  function renderCards(cards) {
    if (!grid) return;
    grid.innerHTML = "";
    if (count) count.textContent = cards.length;

    cards.forEach((c) => {
      const el = document.createElement("section");
      el.className = "info-card";

      // ✅ CLAVE: para DEBIT mostramos el balance REAL del dashboard
      const shownMoney =
        c.cardType === "DEBIT" ? dashboardBalance : (c.creditLimit ?? 0);

      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <div>
            <h2>${c.alias}</h2>
            <div>Tipo: <b>${c.cardType === "DEBIT" ? "Débito" : "Crédito"}</b> · ${c.brand}</div>
            <div>${c.cardType === "DEBIT" ? "Saldo:" : "Límite:"}
              <b>${formatEUR(shownMoney)}</b>
            </div>
          </div>
          <button class="ghost-btn" data-remove="${c._id}"> Borrar </button>
        </div>

        <div style="margin-top:12px;">
          <div class="info-line">
            <span>Número</span>
            <span class="info-value">**** **** **** ${c.numberLast4}</span>
          </div>
          <div class="info-line">
            <span>Caducidad</span>
            <span class="info-value">${formatExpiry(c.expiryMonth, c.expiryYear)}</span>
          </div>
          <div class="info-line">
            <span>CVV</span>
            <span class="info-value" id="cvv-${c._id}">•••</span>
          </div>
          <button class="ghost-btn" data-toggle="${c._id}">👁️ Ver/ocultar CVV</button>
        </div>
      `;

      grid.appendChild(el);
    });

    // Toggle CVV
    document.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.toggle;
        const cvvEl = document.getElementById(`cvv-${id}`);
        const card = cards.find((c) => c._id === id);
        if (!cvvEl || !card) return;
        cvvEl.textContent = cvvEl.textContent === "•••" ? card.cvv : "•••";
      };
    });

    // Eliminar
    document.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.onclick = async () => {
        try {
          const res = await fetch(`/cards/${btn.dataset.remove}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.message || "Error eliminando");
          await loadAndRender();
        } catch (err) {
          showModal(err.message || "Error eliminando tarjeta", "Tarjetas");
        }
      };
    });
  }

  async function loadAndRender() {
    const cards = await fetchCards();
    renderCards(cards);
  }

  /* =========================
     CREAR TARJETA (2 “pantallas” en modales)
     ========================= */

  // Modal 1: elegir tipo
  const typeOverlay = document.getElementById("card-type-overlay");
  const typeForm = document.getElementById("card-type-form");
  const nextStepBtn = document.getElementById("next-step");

  // Modal 2: crear crédito
  const creditOverlay = document.getElementById("credit-overlay");
  const creditForm = document.getElementById("credit-form");
  const creditAliasInput = document.getElementById("credit-alias");
  const creditLimitInput = document.getElementById("credit-limit");
  const creditCancelBtn = document.getElementById("credit-cancel");

  function openTypeModal() {
    typeOverlay?.classList.remove("hidden");
    typeForm?.reset();
  }

  function closeTypeModal() {
    typeOverlay?.classList.add("hidden");
    typeForm?.reset();
  }

  function openCreditModal() {
    creditOverlay?.classList.remove("hidden");
    creditForm?.reset();
    creditAliasInput?.focus();
  }

  function closeCreditModal() {
    creditOverlay?.classList.add("hidden");
    creditForm?.reset();
  }

  async function createCard({ alias, cardType, creditLimit }) {
    try {
      const res = await fetch("/cards", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          alias,
          cardType,
          brand: "VISA",
          creditLimit,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Error creando tarjeta");

      await loadAndRender();
    } catch (err) {
      showModal(err.message || "Error creando tarjeta", "Tarjetas");
    }
  }

  // Abrir modal 1
  document.getElementById("add-card")?.addEventListener("click", () => {
    openTypeModal();
  });

  // Aceptar en modal 1
  nextStepBtn?.addEventListener("click", async () => {
    const selected = typeForm?.querySelector("input[name='cardType']:checked");
    if (!selected) {
      showModal("Debes seleccionar un tipo de tarjeta", "⚠️ Atención");
      return;
    }

    const cardType = selected.value;

    if (cardType === "DEBIT") {
      closeTypeModal();
      await createCard({ alias: "Débito Pro", cardType: "DEBIT" });
    } else {
      closeTypeModal();
      openCreditModal();
    }
  });

  // Cancelar modal crédito
  creditCancelBtn?.addEventListener("click", () => {
    closeCreditModal();
  });

  // Crear crédito desde modal 2
  creditForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const alias = (creditAliasInput?.value || "").trim();
    const limit = Number(creditLimitInput?.value);

    if (!alias) {
      showModal("Introduce un nombre para la tarjeta (ej. Viajes)", "Atención");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      showModal("Introduce un límite válido (ej. 1500)", "Atención");
      return;
    }

    closeCreditModal();
    await createCard({
      alias,
      cardType: "CREDIT",
      creditLimit: limit,
    });
  });

  /* =========================
     ✅ INIT (orden correcto)
     ========================= */
  (async () => {
    try {
      const data = await fetchDashboard();

      // saludo
      if (data?.user?.name && greetingEl) {
        greetingEl.textContent = `Hola, ${data.user.name} 👋`;
      }

      // saldo real: data.account.balance (en tu BD es "balance")
      const rawBal = data?.account?.balance;
      dashboardBalance =
        typeof rawBal === "number" ? rawBal : Number(rawBal || 0);

      // ahora sí, render tarjetas (ya con saldo cargado)
      await loadAndRender();
    } catch (err) {
      console.error(err);
      showModal(err.message || "Error cargando tarjetas", "Tarjetas");
    }
  })();
});
