fetch("/MenuIzquierdo/MenuIzquierdo.html")
  .then((res) => res.text())
  .then((html) => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = html;

    const items = container.querySelectorAll(".sidebar-item");
    items.forEach((a) => a.classList.remove("active"));

    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const match = Array.from(items).find((a) => {
      const href = a.getAttribute("href") || "";
      const hrefPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, "");
      return hrefPath === currentPath;
    });
    if (match) match.classList.add("active");

    const logoutBtn = container.querySelector("#logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
      });
    }
  })
  .catch(console.error);
