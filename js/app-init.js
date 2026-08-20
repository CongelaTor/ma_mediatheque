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

// async function initFilmDetailPage() {
//   currentPage = "film-detail";
//   await loadCatalog();
//   updateStats();
// }
