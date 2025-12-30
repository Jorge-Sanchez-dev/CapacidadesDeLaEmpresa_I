function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bannerHTML(ad) {
  // tipos:
  // - "circle"      => círculo AMARILLO (cajero)
  // - "whiteCircle" => círculo BLANCO (logo/icono)
  // - "rect"        => media rectangular

  const bannerClass =
    ad.variant === "circle" ? "ad-banner ad-banner--circle" : "ad-banner";

  const mediaClass =
    ad.variant === "whiteCircle"
      ? "ad-banner__media ad-banner__media--circle"
      : "ad-banner__media";

  const headline = ad.kpi
    ? `<div class="ad-banner__kpi">${ad.kpi}</div>`
    : `<div class="ad-banner__title">${ad.title}</div>`;

  return `
    <a class="${bannerClass}" href="${ad.href || "#"}">
      <div class="ad-banner__content">
        ${headline}
        <div class="ad-banner__text">${ad.text}</div>
      </div>
      <div class="${mediaClass}">
        <img src="${ad.img}" alt="${ad.alt || ad.title || ad.kpi || "Promo"}" />
      </div>
    </a>
  `;
}

fetch("/components/right-rail.html")
  .then((res) => res.text())
  .then((html) => {
    const container = document.getElementById("right-rail-container");
    if (!container) return;

    container.innerHTML = html;

    // ✅ Tus 8 anuncios (pon los que quieras)
    const ADS = [
      {
        variant: "circle",
        kpi: "+11.000 cajeros",
        text: "Todo lo que puedes hacer con Banco Sánchez.",
        img: "/photos/Cajero.png",
        alt: "Cajero Banco Sánchez",
        href: "",
      },
      {
        variant: "rect",
        title: "Sánchez Shop",
        text: "Tecnología y gaming con descuentos exclusivos.",
        img: "/photos/Tecnologia.png",
        alt: "Sánchez Shop",
        href: "",
      },
      {
        variant: "whiteCircle",
        title: "Seguro Hogar",
        text: "Protege tu casa desde el primer día.",
        img: "/photos/SeguroHogar.png",
        alt: "Seguro Hogar",
        href: "#",
      },

      {
        variant: "whiteCircle",
        kpi: "Tarjeta Pro",
        text: "Cashback y control desde la app.",
        img: "/photos/Tarjeta_Pro.png",
        alt: "Tarjeta Pro",
        href: "#",
      },
      {
        variant: "whiteCircle",
        title: "Ahorro+",
        text: "Activa tu hucha automática y ahorra sin darte cuenta.",
        img: "/photos/Ahorro.png",
        alt: "Ahorro+",
        href: "#",
      },
      {
        variant: "rect",
        title: "Bizum",
        text: "Envía dinero en segundos a tus contactos.",
        img: "/photos/Bizum.png",
        alt: "Bizum",
        href: "#",
      },
      {
        variant: "whiteCircle",
        kpi: "Hipoteca Joven",
        text: "Simula condiciones especiales.",
        img: "/photos/HipotecaJoven.png",
        alt: "Hipoteca Joven",
        href: "#",
      },
      {
        variant: "rect",
        title: "Préstamo Express",
        text: "Tu dinero en 24h (demo).",
        img: "/photos/PrestamosExpress.png",
        alt: "Préstamo Express",
        href: "#",
      },
    ];

    // ✅ Elegir 4 al azar
    const chosen = shuffle(ADS).slice(0, 4);

    const slot = document.getElementById("ads-slot");
    if (!slot) return;

    slot.innerHTML = chosen.map(bannerHTML).join("");
  })
  .catch(console.error);
