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
  const greetingEl = document.getElementById("greeting");
  const transferForm = document.getElementById("transfer-form");
  const transferMsg = document.getElementById("transfer-message");

  // ----- FORMULARIO DE TRANSFERENCIA -----
  if (transferForm) {
    transferForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (transferMsg) transferMsg.textContent = "";

      const toIbanInput = document.getElementById("to-iban");
      const amountInput = document.getElementById("amount");
      const conceptInput = document.getElementById("concept");

      if (!toIbanInput || !amountInput || !conceptInput) return;

      const toIban = toIbanInput.value.trim();
      const amount = parseFloat(amountInput.value);
      const concept = conceptInput.value.trim();

      if (!toIban || isNaN(amount) || amount <= 0) {
        if (transferMsg) {
          transferMsg.textContent =
            "Introduce un IBAN válido y una cantidad positiva.";
        }
        return;
      }

      fetch("/auth/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ toIban, amount, concept }),
      })
        .then(async (res) => {
          // leemos el cuerpo siempre
          const data = await res.json().catch(() => null);

          // si el backend responde con error (400/401/404/500...)
          if (!res.ok) {
            const msg =
              (data && data.message) ||
              "Error al hacer la transferencia";
            throw new Error(msg);
          }

          return data;
        })
        .then((data) => {
          if (transferMsg) {
            transferMsg.textContent = "Transferencia realizada ✅";
          }
          // refrescar saldo y movimientos
          window.location.reload();
        })
        .catch((err) => {
          console.error("Error en /auth/transfer:", err);
          if (transferMsg) {
            transferMsg.textContent =
              err.message || "Error al conectar con el servidor";
          }
        });
    });
  }

  // ----- CARGA DEL DASHBOARD -----
  fetch("/auth/dashboard", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error en /auth/dashboard:", data);
        throw new Error(
          (data && data.message) ||
            "No se ha podido cargar el panel"
        );
      }

      return data;
    })
    .then((data) => {
      if (!data) return;

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
          conceptP.textContent = mov.concept || "Movimiento";

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
      } else if (noMovements) {
        noMovements.style.display = "block";
      }
    })
    .catch((err) => {
      console.error("Error cargando dashboard:", err);
    });

  // ----- LOGOUT -----
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
  return iban
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
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
