async function initFilmsPage() {
  currentPage = "films";

  initSidebarToggle();
  updateUserGreeting();
  await isMediaServerAvailable();
  await loadCatalog();

  updateStats();
  updateResumeButtons();

  initFilmsFilters();
  initFilmsLanguageFilters();

  document.getElementById("searchInput").value = loadSearchText();
  currentSearch = loadSearchText();
  document.getElementById("searchInput").oninput = () => {
    renderFilms();
  };

  const state = loadSidebarFiltersState();
  currentAjouts = state.ajouts ?? "all";
  currentGenre = state.genre ?? "all";
  currentType = state.type ?? "all";
  currentStudio = state.studio ?? "all";
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

function initFilmsFilters() {
  const viewState = loadSidebarFiltersState();

  currentAjouts = viewState.ajouts || "all";
  const validAjouts = ["all", "Nouveautés", "Récents", "Doublons"];
  if (!validAjouts.includes(currentAjouts)) {
    currentAjouts = "all";
  }
  currentGenre = viewState.genre || "all";
  currentType = viewState.type || "all";
  currentStudio = viewState.studio || "all";

  console.log("initFilmsPage");
  console.log("currentAjouts = ", currentAjouts);
  console.log("currentGenre = ", currentGenre);
  console.log("currentType = ", currentType);
  console.log("currentStudio = ", currentStudio);

  renderAllSidebarFilters();

  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.onclick = () => selectAjouts(button.dataset.ajouts);
  });
  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.onclick = () => selectGenre(button.dataset.genre);
  });
  document.querySelectorAll(".sidebar-link[data-type]").forEach((button) => {
    button.onclick = () => selectType(button.dataset.type);
  });
  document.querySelectorAll(".sidebar-link[data-studio]").forEach((button) => {
    button.onclick = () => selectStudio(button.dataset.studio);
  });

  document
    .querySelector(`.sidebar-link[data-ajouts="${currentAjouts}"]`)
    ?.classList.add("active");
  document
    .querySelector(`.sidebar-link[data-genre="${currentGenre}"]`)
    ?.classList.add("active");
  document
    .querySelector(`.sidebar-link[data-type="${currentType}"]`)
    ?.classList.add("active");
  document
    .querySelector(`.sidebar-link[data-studio="${currentStudio}"]`)
    ?.classList.add("active");

  const state = loadSidebarState();

  if (!state.ajoutsExpanded) {
    document.getElementById("ajoutsFilters")?.classList.add("hidden");
  }

  if (!state.genreExpanded) {
    document.getElementById("genreFilters")?.classList.add("hidden");
  }

  if (!state.typeExpanded) {
    document.getElementById("typeFilters")?.classList.add("hidden");
  }

  if (!state.studioExpanded) {
    document.getElementById("studioFilters")?.classList.add("hidden");
  }

  document.getElementById("ajoutsTitle").onclick = () => {
    const filters = document.getElementById("ajoutsFilters");
    filters.classList.toggle("hidden");

    const state = loadSidebarState();
    state.ajoutsExpanded = !filters.classList.contains("hidden");
    saveSidebarState(state);
  };

  document.getElementById("genreTitle").onclick = () => {
    const filters = document.getElementById("genreFilters");
    filters.classList.toggle("hidden");

    const state = loadSidebarState();
    state.genreExpanded = !filters.classList.contains("hidden");
    saveSidebarState(state);
  };

  document.getElementById("typeTitle").onclick = () => {
    const filters = document.getElementById("typeFilters");
    filters.classList.toggle("hidden");

    const state = loadSidebarState();
    state.typeExpanded = !filters.classList.contains("hidden");
    saveSidebarState(state);
  };

  document.getElementById("studioTitle").onclick = () => {
    const filters = document.getElementById("studioFilters");
    filters.classList.toggle("hidden");

    const state = loadSidebarState();
    state.studioExpanded = !filters.classList.contains("hidden");
    saveSidebarState(state);
  };
}

function initFilmsLanguageFilters() {
  document.querySelectorAll(".language-button").forEach((button) => {
    button.onclick = () => {
      const language = button.dataset.language;
      const isActive = button.classList.contains("active");

      button.classList.toggle("active");

      if (language === "VO") {
        document
          .querySelector('.language-button[data-language="VOST"]')
          ?.classList.toggle("active", !isActive);

        document
          .querySelector('.language-button[data-language="VOSTFR"]')
          ?.classList.toggle("active", !isActive);
      }

      saveSidebarFiltersState();
      renderFilms();
    };
  });
}

function getSelectedLanguages() {
  return [...document.querySelectorAll(".language-button.active")].map(
    (button) => button.dataset.language,
  );
}

function selectAjouts(ajouts) {
  currentAjouts = ajouts;
  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-ajouts="${ajouts}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveSidebarFiltersState();
  renderFilms();
}

function selectGenre(genre) {
  currentGenre = genre;
  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-genre="${genre}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveSidebarFiltersState();
  renderFilms();
}

function selectType(type) {
  currentType = type;
  document.querySelectorAll(".sidebar-link[data-type]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-type="${type}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveSidebarFiltersState();
  renderFilms();
}
function selectStudio(studio) {
  currentStudio = studio;
  document.querySelectorAll(".sidebar-link[data-studio]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-studio="${studio}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveSidebarFiltersState();
  renderFilms();
}

function renderFilms() {
  currentPage = "films";
  const grid = document.getElementById("filmsGrid");
  grid.innerHTML = "";
  const groupedFilms = new Map();

  for (const film of catalog.films) {
    const groupKey = film.tmdbId
      ? `tmdb:${film.tmdbId}`
      : `title:${film.titre}|${film.annee || ""}`;

    if (!groupedFilms.has(groupKey)) {
      groupedFilms.set(groupKey, {
        film,
        files: [],
        hasExactDuplicate: false,
      });
    }

    const group = groupedFilms.get(groupKey);

    group.files.push(film);

    if (film.doublonExact) {
      group.hasExactDuplicate = true;
    }
  }

  let films = [...groupedFilms.values()]
    .map((group) => {
      group.film.fileCount = group.files.length;
      group.film.groupFiles = group.files;
      group.film.hasExactDuplicate = group.hasExactDuplicate;
      return group.film;
    })
    .filter((film) => {
      if (!window.selectedCollectionId) {
        return !film.collectionId || !film.collectionNom;
      }
      return String(film.collectionId) === window.selectedCollectionId;
    })
    .filter((film) => filmMatchesAjouts(film))
    .filter((film) => filmMatchesGenre(film))
    .filter((film) => filmMatchesType(film))
    .filter((film) => filmMatchesStudio(film))
    .filter((film) => filmMatchesLanguage(film))
    .filter((film) => matchesSearch(film.titre));

  if (currentAjouts === "Récents") {
    films = films.sort(
      (a, b) =>
        new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime(),
    );
  } else if (window.selectedCollectionId) {
    films = films.sort((a, b) => {
      const anneeA = a.anneeTmdb || a.annee || 0;
      const anneeB = b.anneeTmdb || b.annee || 0;

      if (anneeA !== anneeB) {
        return anneeA - anneeB;
      }

      const titreA = a.titreTmdb || a.titre;
      const titreB = b.titreTmdb || b.titre;

      return titreA.localeCompare(titreB, "fr");
    });
  } else {
    films = films.sort((a, b) =>
      (a.titreTmdb || a.titre).localeCompare(b.titreTmdb || b.titre, "fr"),
    );
  }

  const collectionName = sessionStorage.getItem("selectedCollectionName");

  if (collectionName) {
    setText("filmsCount", `${collectionName.replace(/\s*-\s*saga$/i, "")}`);
    setText(
      "filmsSubtitle",
      `${films.length} film${films.length > 1 ? "s" : ""}`,
    );
  } else {
    setText("filmsCount", `${films.length} film${films.length > 1 ? "s" : ""}`);
    setText("filmsSubtitle", "Hors collections");
  }

  for (const film of films) {
    grid.appendChild(createFilmCard(film));
  }
  updateResumeButtons();
}

function filmMatchesAjouts(film) {
  if (currentAjouts === "all") {
    return true;
  }
  if (currentAjouts === "Nouveautés") {
    if (!film.titreTmdb) {
      return true;
    }
  }
  if (currentAjouts === "Récents") {
    return true;
  }
  if (currentAjouts === "Doublons") {
    return Boolean(film.hasExactDuplicate);
  }
  return false;
}

function filmMatchesGenre(film) {
  if (currentGenre === "all") {
    return true;
  }
  if (!film.genre) {
    return false;
  }
  if (Array.isArray(film.genre)) {
    return film.genre.includes(currentGenre);
  }
  return film.genre === currentGenre;
}

function filmMatchesType(film) {
  if (currentType === "all") {
    return true;
  }
  return film.type === currentType;
}

function filmMatchesStudio(film) {
  if (currentStudio === "all") {
    return true;
  }
  return film.studio === currentStudio;
}

function filmMatchesLanguage(film) {
  const selectedLanguages = getSelectedLanguages();

  if (selectedLanguages.length === 0) {
    return true;
  }

  const filmLanguages = Array.isArray(film.langue)
    ? film.langue
    : [film.langue];

  return filmLanguages.some((lang) => selectedLanguages.includes(lang));
}

function createFilmCard(film) {
  const card = document.createElement("article");
  card.className = "media-card";

  const posterZone = document.createElement("div");
  posterZone.className = "poster-zone";
  posterZone.onclick = () => {
    if (film.titreTmdb) {
      window.location.href = `film-detail.html?tmdbId=${film.tmdbId}`;
      return;
    }
    if (!mediaServerAvailable) {
      showToast("Film à venir");
      return;
    }
    showTmdbFilmSearch(film);
  };
  posterZone.appendChild(createPosterContent(film.image, film.titre, film.id));

  if (film.fileCount > 1) {
    const badge = document.createElement("button");
    badge.className = film.hasExactDuplicate
      ? "play-button duplicate-badge"
      : "play-button";
    badge.textContent = film.fileCount;
    posterZone.appendChild(badge);
  }

  card.appendChild(posterZone);
  return card;
}
