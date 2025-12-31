function formatEUR(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

// Cálculo cuota: sistema francés
function monthlyPayment(principal, months, annualRate) {
  const r = (annualRate / 100) / 12; // tasa mensual
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loan-sim-form");
  const msg = document.getElementById("loan-message");

  const btnApply = document.getElementById("open-apply");
  const btnCopy = document.getElementById("copy-simulation");

  if (btnApply) {
    btnApply.addEventListener("click", () => {
      alert("Demo: aquí abrirías el formulario de solicitud (modal o nueva página).");
    });
  }

  if (document.getElementById("view-conditions")) {
    document.getElementById("view-conditions").addEventListener("click", () => {
      alert("Condiciones demo: TIN desde 4,9% · Plazo 3-120 meses · Sin comisiones (demo).");
    });
  }

  if (document.getElementById("download-contract")) {
    document.getElementById("download-contract").addEventListener("click", () => {
      alert("Demo: aquí descargarías el PDF del contrato.");
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const principal = Number(document.getElementById("loan-amount").value);
      const months = Number(document.getElementById("loan-months").value);
      const apr = Number(document.getElementById("loan-apr").value);

      if (!principal || !months || apr < 0) {
        msg.textContent = "Revisa los datos del simulador.";
        return;
      }

      const fee = monthlyPayment(principal, months, apr);
      const total = fee * months;
      const interest = total - principal;

      setText("result-fee", formatEUR(fee));
      setText("result-total", formatEUR(total));
      setText("result-interest", formatEUR(interest));

      // bloque resumen rápido
      setText("quick-fee", formatEUR(fee));
      setText("quick-total", formatEUR(total));

      msg.textContent = "Simulación calculada ✅";
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      const fee = document.getElementById("result-fee")?.textContent || "—";
      const total = document.getElementById("result-total")?.textContent || "—";
      const text = `Simulación Banco Sánchez\nCuota: ${fee}\nCoste total: ${total}`;
      navigator.clipboard.writeText(text).then(() => {
        alert("Simulación copiada al portapapeles ✅");
      });
    });
  }
});
