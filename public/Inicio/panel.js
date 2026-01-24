
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

  if (transferMsg && sessionStorage.getItem("transfer_ok") === "1") {
    transferMsg.textContent = "Transferencia realizada ✅";
    sessionStorage.removeItem("transfer_ok");
  }

  if (transferForm) {
    transferForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (transferMsg) {
        transferMsg.textContent = "Enviando transferencia...";
      }

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
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            const msg =
              (data && data.message) || "Error al hacer la transferencia";
            throw new Error(msg);
          }
          return data;
        })
        .then(() => {
          sessionStorage.setItem("transfer_ok", "1");
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

  fetch("/auth/dashboard", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Error en /auth/dashboard:", data);
        throw new Error((data && data.message) || "No se ha podido cargar el panel");
      }

      return data;
    })
    .then((data) => {
      if (!data) return;

      const { user, account, movements } = data;

      if (user && greetingEl) {
        greetingEl.textContent = `Hola, ${user.name} 👋`;
      }

      if (account) {
        if (balanceAmountEl) {
          const rawBalance =
            typeof account.balance === "number"
              ? account.balance
              : Number(account.balance || 0);
          const saldo = rawBalance.toFixed(2).replace(".", ",");
          balanceAmountEl.textContent = `${saldo} ${account.currency || ""}`;
        }

        if (balanceIbanEl) {
          balanceIbanEl.textContent = formatearIban(account.iban);
        }

        if (nombreCuentaEl) {
          const ibanFormateado = formatearIban(account.iban);
          nombreCuentaEl.textContent = `${account.alias} · ${ibanFormateado}`;
        }
      }

      if (
        Array.isArray(movements) &&
        movements.length > 0 &&
        listaMovimientos
      ) {
        if (noMovements) noMovements.style.display = "none";
        listaMovimientos.innerHTML = "";

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
        if (listaMovimientos) listaMovimientos.innerHTML = "";
        noMovements.style.display = "block";
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
