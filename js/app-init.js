// ------------------------------------
// Projet créé le 15/08/2026
// ------------------------------------

async function initHomePage() {
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

  await loadCatalog();
  updateStats();
  updateResumeButtons();
}

async function initFilmsPage() {
  currentPage = "films";
  initSidebarToggle();
  await isMediaServerAvailable();
  await loadCatalog();
  updateStats();
  updateResumeButtons();
  initFilmFilters();
  initLanguageFilters();

  document.getElementById("searchInput").value = loadSearchText();
  currentSearch = loadSearchText();

  const state = loadFilmsViewState();
  currentAjouts = state.ajouts ?? "all";
  currentGenre = state.genre ?? "all";
  window.selectedCollectionId = sessionStorage.getItem("selectedCollectionId");

  document
    .querySelectorAll(".nav-button")
    .forEach((button) => button.classList.remove("active"));
  document
    .querySelector('.nav-button[data-page="films"]')
    ?.classList.add("active");

  if (window.selectedCollectionId) {
    currentSearch = "";
    document.getElementById("searchInput").value = "";
  }

  if (window.selectedCollectionId) {
    currentSearch = "";
  }
  window.selectedCollectionName = sessionStorage.getItem(
    "selectedCollectionName",
  );
  if (window.selectedCollectionId) {
    document
      .querySelector('.nav-button[data-page="films"]')
      ?.classList.remove("active");
    document
      .querySelector('.nav-button[data-page="collections"]')
      ?.classList.add("active");
  }
  const backToCollectionsButton = document.getElementById(
    "backToCollectionsButton",
  );

  if (window.selectedCollectionId && backToCollectionsButton) {
    backToCollectionsButton.classList.remove("hidden");

    backToCollectionsButton.onclick = () => {
      window.location.href = "collections.html";
    };
  }

  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.classList.toggle("active", button.dataset.ajouts === currentAjouts);
  });

  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.classList.toggle("active", button.dataset.genre === currentGenre);
  });

  if (state.languages) {
    document.querySelectorAll(".language-button").forEach((button) => {
      button.classList.toggle(
        "active",
        state.languages.includes(button.dataset.language),
      );
    });
  }

  renderFilms();
}

async function initSeriesPage() {
  currentPage = "series";
  initSidebarToggle();
  await loadCatalog();
  initializeLanguageFilters();
  updateStats();
  updateResumeButtons();
  document.getElementById("searchInput").value = loadSearchText();

  currentSearch = loadSearchText();
  if (window.selectedCollectionId) {
    currentSearch = "";
    document.getElementById("searchInput").value = "";
  }

  const state = loadSeriesViewState();
  if (state.languages) {
    activeSeriesLanguages = new Set(state.languages);
  }

  if (state.languages) {
    document.querySelectorAll(".language-button").forEach((button) => {
      button.classList.toggle(
        "active",
        state.languages.includes(button.dataset.language),
      );
    });
  }

  renderSeries();
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
