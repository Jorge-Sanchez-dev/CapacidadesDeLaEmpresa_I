fetch("/components/sidebar.html")
  .then((res) => res.text())
  .then((html) => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = html;

    // ✅ 1) Quitar active a todos
    const items = container.querySelectorAll(".sidebar-item");
    items.forEach((a) => a.classList.remove("active"));

    // ✅ 2) Detectar página actual (archivo)
    const current = window.location.pathname.split("/").pop(); // ej: "SimuladorHipoteca.html"

    // ✅ 3) Marcar active por href exacto
    const match = Array.from(items).find((a) => {
      const hrefFile = (a.getAttribute("href") || "").split("/").pop();
      return hrefFile === current;
    });

    if (match) match.classList.add("active");
  })
  .catch(console.error);
