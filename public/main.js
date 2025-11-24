// LOGIN
const loginForm = document.getElementById("login-form");
const msg = document.getElementById("msg");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);

      msg.textContent = "Login correcto ✔";
      window.location.href = "/dashboard.html";
    } catch (err) {
      msg.textContent = "Error: " + err.message;
    }
  });
}



// REGISTRO 
const registerForm = document.getElementById("register-form");
const msg2 = document.getElementById("msg");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Datos básicos
    const name = document.getElementById("name").value;
    const surname = document.getElementById("surname").value;
    const birthDate = document.getElementById("birthDate").value;
    const dni = document.getElementById("dni").value;
    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value;
    const address = document.getElementById("address").value;
    const postalCode = document.getElementById("postalCode").value;

    // Contacto y acceso
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Moneda
    const mainCurrency = document.getElementById("mainCurrency").value;

    if (password !== confirmPassword) {
      msg2.textContent = "Las contraseñas no coinciden";
      return;
    }

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          birthDate,
          dni,
          country,
          city,
          address,
          postalCode,
          email,
          phone,
          password,
          mainCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      msg2.textContent = "Registro exitoso ✔ Redirigiendo...";
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);

    } catch (err) {
      msg2.textContent = "Error: " + err.message;
    }
  });
}



// LOGOUT
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  });
}
