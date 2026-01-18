const role = localStorage.getItem("userRole");
if (role !== "ADMIN") window.location.href = "/Inicio/panel.html";

fetch("/Admin/MenuAdmin.html")
  .then((r) => r.text())
  .then((html) => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = html;

    // activar item actual (opcional)
    const items = container.querySelectorAll(".sidebar-item");
    items.forEach((a) => a.classList.remove("active"));

    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const match = Array.from(items).find((a) => {
      const href = a.getAttribute("href") || "";
      const hrefPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, "");
      return hrefPath === currentPath;
    });
    if (match) match.classList.add("active");

    // logout
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      window.location.href = "/login.html";
    });
  })
  .catch(console.error);
