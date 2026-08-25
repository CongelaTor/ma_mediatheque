async function initHomePage() {
  await loadCatalog();
  updateStats();
  updateResumeButtons();
}
async function initFilmsPage() {
  currentPage = "films";
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
