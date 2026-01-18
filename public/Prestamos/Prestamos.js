// /Prestamos/Prestamos.js

function formatEUR(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

// Cálculo cuota: sistema francés
function monthlyPayment(principal, months, annualRate) {
  const r = annualRate / 100 / 12; // tasa mensual
  if (r === 0) return principal / months;
  return (
    (principal * (r * Math.pow(1 + r, months))) /
    (Math.pow(1 + r, months) - 1)
  );
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setMessage(text, type = "info") {
  const el = document.getElementById("loan-message");
  if (!el) return;

  el.textContent = text || "";
  el.classList.remove("is-error", "is-success", "is-info");
  if (type === "error") el.classList.add("is-error");
  else if (type === "success") el.classList.add("is-success");
  else el.classList.add("is-info");
}

function isoDate(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

function renderLoans(loans) {
  const list = document.getElementById("loans-list");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(loans) || loans.length === 0) {
    list.innerHTML = `
      <div class="movement">
        <div>
          <p class="movement-concept"><b>No tienes préstamos activos</b></p>
          <p class="movement-date">Cuando te aprueben uno, aparecerá aquí.</p>
        </div>
      </div>
    `;
    return;
  }

  loans.forEach((l) => {
    const start = l.startDate ? isoDate(l.startDate) : isoDate(l.createdAt);
    const concept = (l.concept || "Préstamo").trim();
    const months = Number(l.months || 0);
    const fee = Number(l.monthlyFee || 0);
    const remaining = Number(l.remaining ?? l.totalToPay ?? 0);

    list.innerHTML += `
      <div class="movement">
        <div>
          <p class="movement-concept">
            <b>${l.status === "ACTIVE" ? "Préstamo activo" : "Préstamo"}</b> · ${concept}
          </p>
          <p class="movement-date">
            Inicio: ${start} · Plazo: ${months} meses
          </p>
        </div>

        <div style="text-align:right;">
          <div class="movement-amount">${formatEUR(fee)}/mes</div>
          <div class="movement-date">Pendiente: ${formatEUR(remaining)}</div>
        </div>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const form = document.getElementById("loan-sim-form");
  const btnApply = document.getElementById("open-apply");
  const btnCopy = document.getElementById("copy-simulation");

  // ===== MODAL SOLICITUD (BONITO) =====
  const loanOverlay = document.getElementById("loan-overlay");
  const loanForm = document.getElementById("loan-form");
  const loanCancel = document.getElementById("loan-cancel");
  const loanConceptInput = document.getElementById("loan-concept");

  function openLoanModal() {
    if (!loanOverlay) return;
    loanOverlay.classList.remove("hidden");
    setTimeout(() => loanConceptInput?.focus(), 0);
  }

  function closeLoanModal() {
    loanOverlay?.classList.add("hidden");
    if (loanForm) loanForm.reset();
  }

  loanCancel?.addEventListener("click", closeLoanModal);

  loanOverlay?.addEventListener("click", (e) => {
    if (e.target === loanOverlay) closeLoanModal();
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      loanOverlay &&
      !loanOverlay.classList.contains("hidden")
    ) {
      closeLoanModal();
    }
  });

  // ===== BACKEND calls =====
  async function requestLoan({ amount, months, apr, concept }) {
    const res = await fetch("/loans/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ amount, months, apr, concept }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Error solicitando préstamo");
    }
    return data;
  }

  async function loadMyLoans() {
    const res = await fetch("/loans/my", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Error cargando préstamos");
    }
    return data.loans || [];
  }

  async function refreshLoans() {
    try {
      const loans = await loadMyLoans();
      renderLoans(loans);
    } catch (e) {
      console.error(e);
      setMessage(e.message || "No se pudieron cargar tus préstamos.", "error");
    }
  }

  // ===== SIMULADOR =====
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const principal = Number(document.getElementById("loan-amount")?.value);
      const months = Number(document.getElementById("loan-months")?.value);
      const apr = Number(document.getElementById("loan-apr")?.value);

      if (
        !Number.isFinite(principal) ||
        principal <= 0 ||
        !Number.isFinite(months) ||
        months <= 0 ||
        !Number.isFinite(apr) ||
        apr < 0
      ) {
        setMessage("Revisa los datos del simulador.", "error");
        return;
      }

      const fee = monthlyPayment(principal, months, apr);
      const total = fee * months;
      const interest = total - principal;

      setText("result-fee", formatEUR(fee));
      setText("result-total", formatEUR(total));
      setText("result-interest", formatEUR(interest));

      // (si existen en tu HTML)
      setText("quick-fee", formatEUR(fee));
      setText("quick-total", formatEUR(total));

      setMessage("Simulación calculada ✅", "success");
    });
  }

  // ===== PEDIR PRÉSTAMO =====
  // 1) botón abre modal si simulación es válida
  if (btnApply) {
    btnApply.addEventListener("click", () => {
      const amount = Number(document.getElementById("loan-amount")?.value);
      const months = Number(document.getElementById("loan-months")?.value);
      const apr = Number(document.getElementById("loan-apr")?.value);

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isFinite(months) ||
        months <= 0 ||
        !Number.isFinite(apr) ||
        apr < 0
      ) {
        setMessage(
          "Primero completa una simulación válida (importe, meses, interés).",
          "error"
        );
        return;
      }

      openLoanModal();
    });
  }

  // 2) submit del modal envía solicitud
  loanForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const concept = (loanConceptInput?.value || "").trim();
    if (!concept) {
      setMessage("Introduce un concepto para el préstamo.", "error");
      return;
    }

    const amount = Number(document.getElementById("loan-amount")?.value);
    const months = Number(document.getElementById("loan-months")?.value);
    const apr = Number(document.getElementById("loan-apr")?.value);

    try {
      setMessage("Enviando solicitud...", "info");
      await requestLoan({ amount, months, apr, concept });

      closeLoanModal();
      setMessage("Solicitud enviada ✅ (pendiente de aprobación)", "success");
      await refreshLoans();
    } catch (e) {
      console.error(e);
      closeLoanModal();
      setMessage(e.message || "Error solicitando préstamo", "error");
    }
  });

  // ===== COPIAR SIMULACIÓN =====
  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      const fee = document.getElementById("result-fee")?.textContent || "—";
      const total = document.getElementById("result-total")?.textContent || "—";
      const text = `Simulación Banco Sánchez\nCuota: ${fee}\nCoste total: ${total}`;

      navigator.clipboard
        .writeText(text)
        .then(() => setMessage("Simulación copiada ✅", "success"))
        .catch(() => setMessage("No se pudo copiar la simulación.", "error"));
    });
  }

  // ===== INIT =====
  setMessage("");
  refreshLoans();
});
