// panel.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const nombreCuentaEl = document.getElementById("nombre-cuenta");
  const listaMovimientos = document.getElementById("lista-movimientos");
  const noMovements = document.getElementById("no-movements");
  const balanceAmountEl = document.getElementById("balance-amount");
  const balanceIbanEl = document.getElementById("balance-iban");
  const greetingEl = document.getElementById("greeting"); // ⭐ AQUI

  fetch("/auth/dashboard", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const { user, account, movements } = data;

      // 0) Saludo personalizado
      if (user && greetingEl) {
        greetingEl.textContent = `Hola, ${user.name} 👋`;
      }

      // 1) Pintar saldo, iban y alias
      if (account) {
        if (balanceAmountEl) {
          const rawBalance =
            typeof account.balance === "number"
              ? account.balance
              : Number(account.balance || 0);
          const saldo = rawBalance.toFixed(2).replace(".", ",");
          balanceAmountEl.textContent = `${saldo} ${
            account.currency || ""
          }`;
        }

        if (balanceIbanEl) {
          balanceIbanEl.textContent = formatearIban(account.iban);
        }

        if (nombreCuentaEl) {
          const ibanFormateado = formatearIban(account.iban);
          nombreCuentaEl.textContent = `${account.alias} · ${ibanFormateado}`;
        }
      }

      // 2) Pintar movimientos
      if (
        Array.isArray(movements) &&
        movements.length > 0 &&
        listaMovimientos
      ) {
        if (noMovements) noMovements.style.display = "none";

        movements.forEach((mov) => {
          const movDiv = document.createElement("div");
          movDiv.classList.add("widget-movement");

          const leftDiv = document.createElement("div");
          leftDiv.classList.add("movement-left");

          const iconDiv = document.createElement("div");
          iconDiv.classList.add("movement-icon");
          if (mov.direction === "OUT") {
            iconDiv.classList.add("outgoing");
            iconDiv.textContent = "←";
          } else {
            iconDiv.classList.add("incoming");
            iconDiv.textContent = "→";
          }

          const textDiv = document.createElement("div");
          textDiv.classList.add("movement-text");

          const conceptP = document.createElement("p");
          conceptP.classList.add("movement-concept");
          conceptP.textContent = mov.concept;

          const dateP = document.createElement("p");
          dateP.classList.add("movement-date");
          dateP.textContent = formatearFecha(mov.date);

          textDiv.appendChild(conceptP);
          textDiv.appendChild(dateP);
          leftDiv.appendChild(iconDiv);
          leftDiv.appendChild(textDiv);

          const amountNumber =
            typeof mov.amount === "number"
              ? mov.amount
              : Number(mov.amount || 0);

          const amountP = document.createElement("p");
          amountP.classList.add("movement-amount");
          if (mov.direction === "OUT") {
            amountP.classList.add("negativo");
            amountP.textContent = `-${amountNumber.toFixed(2)} €`;
          } else {
            amountP.classList.add("positivo");
            amountP.textContent = `+${amountNumber.toFixed(2)} €`;
          }

          movDiv.appendChild(leftDiv);
          movDiv.appendChild(amountP);
          listaMovimientos.appendChild(movDiv);
        });
      }
    })
    .catch((err) => {
      console.error("Error cargando dashboard:", err);
    });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    });
  }
});

// Helpers

function formatearIban(iban) {
  if (!iban) return "";
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
