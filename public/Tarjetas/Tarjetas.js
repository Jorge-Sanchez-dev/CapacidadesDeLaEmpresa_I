// =====================
// TARJETAS - Banco Sánchez
// =====================

// 1) Nombre usuario
const stored = localStorage.getItem("userName");
const userNameEl = document.getElementById("user-name");
if (userNameEl) userNameEl.textContent = stored || "Jorge";

// 2) Datos demo (luego backend)
let cards = [
  {
    type: "Débito Pro",
    salary: 1850.75,
    number: "5123 45** **** 9821",
    cvv: "482",
    expiry: "08/27",
  },
  {
    type: "Crédito Plus",
    salary: 320.0,
    number: "4111 22** **** 1044",
    cvv: "931",
    expiry: "02/29",
  },
  {
    type: "Joven",
    salary: 75.5,
    number: "5399 88** **** 7730",
    cvv: "120",
    expiry: "11/26",
  },
];

// 3) Utils
function formatEUR(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

// 4) Render
function renderCards() {
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("cards-count");

  if (!grid) return;

  grid.innerHTML = "";
  if (count) count.textContent = cards.length;

  cards.forEach((c, idx) => {
    const el = document.createElement("section");
    el.className = "info-card";

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div style="min-width:0;">
          <h2 style="margin:0 0 6px;">${c.type}</h2>
          <div style="opacity:0.85; font-size:0.92rem;">
            Sueldo / saldo: <b>${formatEUR(c.salary)}</b>
          </div>
        </div>

        <button class="ghost-btn" data-remove="${idx}" style="padding:6px 10px;">
          🗑️
        </button>
      </div>

      <div style="margin-top:12px;">
        <div class="info-line">
          <span>Número</span>
          <span class="info-value" style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
            ${c.number}
          </span>
        </div>

        <div class="info-line">
          <span>Caducidad</span>
          <span class="info-value">${c.expiry}</span>
        </div>

        <div class="info-line">
          <span>CVV</span>
          <span class="info-value" id="cvv-${idx}">•••</span>
        </div>

        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="ghost-btn" data-toggle="${idx}">
            👁️ Ver/ocultar CVV
          </button>
        </div>
      </div>
    `;

    grid.appendChild(el);
  });

  // eventos toggle CVV
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-toggle");
      const cvvEl = document.getElementById(`cvv-${idx}`);
      cvvEl.textContent = cvvEl.textContent === "•••" ? cards[idx].cvv : "•••";
    });
  });

  // eventos eliminar
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-remove"));
      cards.splice(idx, 1);
      renderCards();
    });
  });
}

// 5) Añadir tarjeta preguntando tipo
document.getElementById("add-card")?.addEventListener("click", () => {
  const type = prompt(
    "¿Qué tipo de tarjeta quieres crear?\n\n- Débito\n- Crédito\n- Joven",
    "Débito"
  );
  if (!type) return;

  const t = type.toLowerCase().trim();

  let cardType;
  let initialSalary = 0;

  if (t === "débito" || t === "debito") {
    cardType = "Débito Pro";
    initialSalary = 1200;
  } else if (t === "crédito" || t === "credito") {
    cardType = "Crédito Plus";
    initialSalary = 300;
  } else if (t === "joven") {
    cardType = "Joven";
    initialSalary = 50;
  } else {
    alert("Tipo no válido. Usa: Débito, Crédito o Joven.");
    return;
  }

  cards.unshift({
    type: cardType,
    salary: initialSalary,
    number: "4000 00** **** " + Math.floor(1000 + Math.random() * 9000),
    cvv: String(Math.floor(100 + Math.random() * 900)),
    expiry: "12/28",
  });

  renderCards();
});

// 6) init
renderCards();
