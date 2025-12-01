// main.js

document.addEventListener("DOMContentLoaded", () => {
  // ========================
  // LOGIN
  // ========================
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    const msg = document.getElementById("msg");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (msg) {
        msg.textContent = "";
      }

      try {
        const res = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Error al iniciar sesión");
        }

        // Guardar token (y nombre, si viene)
        localStorage.setItem("token", data.token);
        if (data.user && data.user.name) {
          localStorage.setItem("userName", data.user.name);
        }

        if (msg) {
          msg.textContent = "Login correcto ✔";
        }

        // Redirigir al panel
        window.location.href = "/panel.html";
      } catch (err) {
        if (msg) {
          msg.textContent = "Error: " + err.message;
        }
      }
    });
  }

  // ========================
  // REGISTRO
  // ========================
  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    const msg = document.getElementById("msg");

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Datos básicos
      const name = document.getElementById("name").value.trim();
      const surname = document.getElementById("surname").value.trim();
      const birthDate = document.getElementById("birthDate").value;
      const dni = document.getElementById("dni").value.trim();
      const country = document.getElementById("country").value.trim();
      const city = document.getElementById("city").value.trim();
      const address = document.getElementById("address").value.trim();
      const postalCode = document.getElementById("postalCode").value.trim();

      // Contacto y acceso
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword =
        document.getElementById("confirmPassword").value;

      // Moneda
      const mainCurrency = document.getElementById("mainCurrency").value;

      if (msg) {
        msg.textContent = "";
      }

      if (password !== confirmPassword) {
        if (msg) msg.textContent = "Las contraseñas no coinciden";
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

        if (!res.ok) {
          throw new Error(data.message || "Error al registrar");
        }

        if (msg) {
          msg.textContent = "Registro exitoso ✔ Redirigiendo...";
        }

        setTimeout(() => {
          window.location.href = "/login.html";
        }, 1500);
      } catch (err) {
        if (msg) {
          msg.textContent = "Error: " + err.message;
        }
      }
    });
  }

  // ========================
  // LOGOUT (en el panel)
  // ========================
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      window.location.href = "/login.html";
    });
  }
});
