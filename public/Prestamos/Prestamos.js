
console.log("✅ Prestamos.js cargado");

function formatEUR(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n || 0));
}

function monthlyPayment(principal, months, annualRate) {
  const P = Number(principal || 0);
  const M = Number(months || 0);
  const R = Number(annualRate || 0);

  if (!M) return 0;

  const r = R / 100 / 12;
  if (r === 0) return P / M;
  return (P * (r * Math.pow(1 + r, M))) / (Math.pow(1 + r, M) - 1);
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

  const safe = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const statusLabel = (s) => {
    const st = String(s || "");
    if (st === "APPROVED") return "Aprobado ✅";
    if (st === "PENDING") return "Pendiente ⏳";
    if (st === "REJECTED") return "Denegado ❌";
    if (st === "CANCELLED") return "Cancelado";
    if (st === "ACTIVE") return "Activo ✅";
    if (st === "CLOSED") return "Cerrado";
    return st || "—";
  };

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

  console.log("LOANS (API) ->", loans);

  loans.forEach((l) => {
    const start = l.startedAt ? isoDate(l.startedAt) : isoDate(l.createdAt);

    const concept =
      String(l.purpose ?? l.concept ?? l.title ?? l.name ?? "").trim() ||
      "Préstamo";

    const months = Number(l.months ?? 0);

    let fee = Number(l.monthlyPayment ?? l.monthlyFee ?? 0);
    const apr = Number(l.interestAPR ?? l.apr ?? l.interestRate ?? 0);
    const amount = Number(l.amount ?? l.principal ?? 0);

    if ((!fee || fee === 0) && amount > 0 && months > 0) {
      fee = monthlyPayment(amount, months, apr);
    }

    const remaining = Number(
      l.remainingToPay ?? l.remaining ?? l.totalToPay ?? l.total ?? amount ?? 0
    );

    list.innerHTML += `
      <div class="movement">
        <div>
          <p class="movement-concept">
            <b>${safe(concept)}</b>
            <span style="opacity:.75"> · ${safe(statusLabel(l.status))}</span>
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

  if (btnApply) btnApply.setAttribute("type", "button");

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

  async function requestLoan({ amount, months, apr, purpose }) {
    const res = await fetch("/loans/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ amount, months, apr, purpose }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error solicitando préstamo");
    return data;
  }

  async function loadMyLoans() {
    const res = await fetch("/loans/mine", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Error cargando préstamos");
    return data?.loans || [];
  }

  async function refreshLoans() {
    try {
      const loans = await loadMyLoans();

      const activeLoans = loans.filter(
        (l) => l?.status === "APPROVED" || l?.status === "ACTIVE"
      );

      renderLoans(activeLoans);
    } catch (e) {
      console.error(e);
      setMessage(e.message || "No se pudieron cargar tus préstamos.", "error");
      renderLoans([]);
    }
  }

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

      setText("quick-fee", formatEUR(fee));
      setText("quick-total", formatEUR(total));

      setMessage("Simulación calculada ✅", "success");
    });
  }

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

  loanForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const purpose = (loanConceptInput?.value || "").trim();
    if (!purpose) {
      setMessage("Introduce un concepto para el préstamo.", "error");
      return;
    }

    const amount = Number(document.getElementById("loan-amount")?.value);
    const months = Number(document.getElementById("loan-months")?.value);
    const apr = Number(document.getElementById("loan-apr")?.value);

    try {
      setMessage("Enviando solicitud...", "info");

      await requestLoan({ amount, months, apr, purpose });

      closeLoanModal();
      setMessage("Solicitud enviada ✅ (pendiente de aprobación)", "success");
      await refreshLoans();
    } catch (e) {
      console.error(e);
      closeLoanModal();
      setMessage(e.message || "Error solicitando préstamo", "error");
    }
  });

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

  setMessage("");
  refreshLoans();
});
