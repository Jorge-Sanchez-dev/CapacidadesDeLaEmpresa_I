// /Bizum/Bizum.js

// 🔧 Cambia esto si tu API está en otra URL (por ejemplo: http://localhost:3000)
const API_BASE_URL = ""; // vacío = mismo dominio

// Rutas típicas (ajústalas a tu backend)
const BIZUM_ENDPOINT = "/api/bizum"; // <- si tu backend usa otra, cámbiala

// Helpers
const $ = (id) => document.getElementById(id);

function normalizePhone(raw) {
  // Quita espacios, guiones, paréntesis…
  return (raw || "").replace(/[^\d]/g, "");
}

function isValidSpanishMobile(phoneDigits) {
  // 9 dígitos y empieza por 6 o 7 (móvil en España)
  return /^[67]\d{8}$/.test(phoneDigits);
}

function formatEuros(value) {
  // Normaliza a 2 decimales
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function setMessage(text, type = "info") {
  const el = $("transfer-message");
  if (!el) return;
  el.textContent = text;

  // Si quieres clases por tipo:
  el.classList.remove("is-error", "is-success", "is-info");
  if (type === "error") el.classList.add("is-error");
  else if (type === "success") el.classList.add("is-success");
  else el.classList.add("is-info");
}

function setLoading(isLoading) {
  const btn = document.querySelector("#transfer-form button[type='submit']");
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Enviando..." : "Enviar Bizum";
}

function getAuthHeaders() {
  // Si guardas el token en localStorage, úsalo
  const token = localStorage.getItem("token") || localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function setGreetingFromBackend() {
  const el = $("greeting");
  if (!el) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/auth/dashboard", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.user) return;

    el.textContent = `Hola, ${data.user.name} 👋`;

    // (opcional pero recomendable)
    localStorage.setItem("userName", data.user.name);
  } catch (err) {
    console.error("Error cargando saludo Bizum:", err);
  }
}


async function sendBizum({ toPhone, amount, concept }) {
  const res = await fetch(`${API_BASE_URL}${BIZUM_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      toPhone, // "600123456"
      amount,  // 12.34
      concept, // "Cena"
    }),
  });

  // Intenta parsear respuesta
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      "No se pudo enviar el Bizum. Revisa los datos e inténtalo de nuevo.";
    throw new Error(msg);
  }

  return data;
}

function clearForm() {
  const form = $("transfer-form");
  if (!form) return;
  form.reset();
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  setGreetingFromBackend();
  setMessage("");

  const form = $("transfer-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rawPhone = $("to-phone")?.value || "";
    const phone = normalizePhone(rawPhone);

    const rawAmount = $("amount")?.value;
    const amount = formatEuros(rawAmount);

    const concept = ($("concept")?.value || "").trim();

    // Validaciones
    if (!isValidSpanishMobile(phone)) {
      setMessage(
        "Introduce un número móvil válido (9 dígitos y que empiece por 6 o 7).",
        "error"
      );
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Introduce una cantidad válida mayor que 0.", "error");
      return;
    }

    // ✅ Envío
    try {
      setLoading(true);
      setMessage("");

      // --- MODO REAL (con backend) ---
      const result = await sendBizum({ toPhone: phone, amount, concept });

      // Si tu backend devuelve algo tipo {message:"ok"} o {transactionId:"..."}
      const okMsg =
        (result && result.message) ||
        "Bizum enviado correctamente ✅";
      setMessage(okMsg, "success");
      clearForm();

      // --- MODO SIMULACIÓN (si aún no tienes backend) ---
      // await new Promise((r) => setTimeout(r, 800));
      // setMessage(`Bizum simulado enviado a ${phone} por ${amount.toFixed(2)}€ ✅`, "success");
      // clearForm();
    } catch (err) {
      setMessage(err.message || "Error enviando el Bizum.", "error");
    } finally {
      setLoading(false);
    }
  });
});
