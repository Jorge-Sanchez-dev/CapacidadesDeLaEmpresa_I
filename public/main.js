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
      window.location.href = "/secure.html";
    } catch (err) {
      msg.textContent = "Error: " + err.message;
    }
  });
}

// ZONA SEGURA
const getDataBtn = document.getElementById("get-data");

if (getDataBtn) {
  getDataBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("/auth/me", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
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
