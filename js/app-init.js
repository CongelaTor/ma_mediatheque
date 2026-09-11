// ------------------------------------
// Projet créé le 15/08/2026
// ------------------------------------

async function initHomePage() {
  await loadCatalog();
  updateStats();
  updateUserGreeting();
  await isMediaServerAvailable();

  const context = calculContext.calculateContext({
    mediaServerAvailable,
  });
  console.log("context =", context);

  const scanButton = document.querySelector(".refresh-button");
  scanButton.classList.toggle("hidden", !context.permissions.canScan);

  const resumeFilmButton = document.getElementById("resumeFilmButton");
  resumeFilmButton.classList.toggle("hidden", !context.permissions.canPlay);

  const resumeSerieButton = document.getElementById("resumeSerieButton");
  resumeSerieButton.classList.toggle("hidden", !context.permissions.canPlay);

  updateResumeButtons();
}

function initSidebarToggle() {
  if (
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/"
  ) {
    return;
  }

  if (localStorage.getItem("sidebarHidden") === "true") {
    document.body.classList.add("sidebar-hidden");
  }

  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-hidden");
    localStorage.setItem(
      "sidebarHidden",
      document.body.classList.contains("sidebar-hidden"),
    );
  });
}
