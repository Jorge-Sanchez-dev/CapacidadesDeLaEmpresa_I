fetch("/components/sidebar.html")
  .then(res => res.text())
  .then(html => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = html;

    // marcar active automáticamente
    const path = window.location.pathname.toLowerCase();

    document.querySelectorAll(".sidebar-item").forEach(link => {
      const route = link.dataset.route;
      if (path.includes(route)) {
        link.classList.add("active");
      }
    });
  })
  .catch(console.error);
