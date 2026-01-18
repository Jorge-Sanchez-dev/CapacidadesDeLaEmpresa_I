function formatEUR(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

// Sistema francés: cuota mensual
function monthlyPayment(principal, months, annualRate) {
  const r = (annualRate / 100) / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mortgage-form");
  const msg = document.getElementById("mortgage-message");

  const btnCopy = document.getElementById("copy");
  const btnReset = document.getElementById("reset");
  const btnSave = document.getElementById("save-sim");

  function resetUI() {
    setText("ltv", "—");
    setText("downpayment", "—");
    setText("loan", "—");
    setText("fee", "—");
    setText("interest", "—");
    setText("total", "—");
    setText("ratio", "—");
    const note = document.getElementById("health-note");
    if (note) note.textContent = "Introduce tus ingresos para estimar el ratio.";
    if (msg) msg.textContent = "";
  }

  if (btnReset) btnReset.addEventListener("click", resetUI);

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      alert("Demo: aquí guardarías la simulación en tu backend o localStorage.");
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const price = Number(document.getElementById("price").value);
      const down = Number(document.getElementById("down").value);
      const years = Number(document.getElementById("years").value);
      const rate = Number(document.getElementById("rate").value);
      const income = Number(document.getElementById("income").value || 0);

      // ✅ FIX: el select correcto es mortgage-type
      const type = document.getElementById("mortgage-type").value;

      if (!price || price <= 0 || down < 0 || years <= 0 || rate < 0) {
        msg.textContent = "Revisa los datos: precio, entrada, plazo e interés.";
        return;
      }

      if (down >= price) {
        msg.textContent = "La entrada no puede ser mayor o igual al precio de la vivienda.";
        return;
      }

      const loan = price - down;
      const months = years * 12;

      // Variable: estimación simple (subimos un poco el tipo para “aprox”)
      const effectiveRate = type === "variable" ? rate + 0.8 : rate;

      const fee = monthlyPayment(loan, months, effectiveRate);
      const total = fee * months;
      const interest = total - loan;

      const ltv = (loan / price) * 100;

      setText("loan", formatEUR(loan));
      setText("downpayment", formatEUR(down));
      setText("ltv", `${ltv.toFixed(1)}%`);

      setText("fee", formatEUR(fee));
      setText("total", formatEUR(total));
      setText("interest", formatEUR(interest));

      // ratio cuota/ingresos
      const note = document.getElementById("health-note");
      if (income && income > 0) {
        const ratio = (fee / income) * 100;
        setText("ratio", `${ratio.toFixed(1)}%`);

        if (note) {
          if (ratio <= 30) note.textContent = "✅ Ratio saludable (≤ 30%).";
          else if (ratio <= 40) note.textContent = "⚠️ Ratio alto (30–40%). Cuidado con el margen.";
          else note.textContent = "🚨 Ratio muy alto (> 40%). Riesgo de ir justísimo.";
        }
      } else {
        setText("ratio", "—");
        if (note) note.textContent = "Introduce tus ingresos para estimar el ratio.";
      }

      // aviso LTV
      if (msg) {
        if (ltv > 80) {
          const neededDown = price * 0.2;
          const extra = neededDown - down;
          msg.textContent =
            `⚠️ Financiación estimada > 80% (LTV ${ltv.toFixed(1)}%). ` +
            `Para 80% necesitarías una entrada de ${formatEUR(neededDown)} (te faltan ${formatEUR(extra)}).`;
        } else {
          msg.textContent = "Cálculo realizado ✅";
        }
      }
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      const fee = document.getElementById("fee")?.textContent || "—";
      const total = document.getElementById("total")?.textContent || "—";
      const ltv = document.getElementById("ltv")?.textContent || "—";
      const text = `Simulación Hipoteca - Banco Sánchez\nCuota: ${fee}\nCoste total: ${total}\nLTV: ${ltv}`;

      navigator.clipboard.writeText(text).then(() => {
        alert("Resultado copiado ✅");
      });
    });
  }
});
