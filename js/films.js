function initFilmFilters() {
  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.onclick = () => selectAjouts(button.dataset.ajouts);
  });

  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.onclick = () => selectGenre(button.dataset.genre);
  });
}

function initLanguageFilters() {
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

      saveFilmsViewState();
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
  saveFilmsViewState();
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
  saveFilmsViewState();
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
        return true;
      }
      return String(film.collectionId) === window.selectedCollectionId;
    })
    .filter((film) => filmMatchesAjouts(film))
    .filter((film) => filmMatchesGenre(film))
    .filter((film) => filmMatchesLanguage(film))
    .filter((film) => matchesSearch(film.titre));

  if (currentAjouts === "Récents") {
    films = films.sort(
      (a, b) =>
        new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime(),
    );
  } else {
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
  }

  const collectionName = sessionStorage.getItem("selectedCollectionName");

  if (collectionName) {
    document.querySelector("h1").textContent =
      `${collectionName.replace(/\s*-\s*saga$/i, "")}`;
  }

  setText("filmsCount", `${films.length} film${films.length > 1 ? "s" : ""}`);

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
      window.location.href = `_film-detail.html?tmdbId=${film.tmdbId}`;
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
