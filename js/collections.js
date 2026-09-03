let currentCollectionFilter = "all";

function initCollectionsPage() {
  currentPage = "collections";
  initSidebarToggle();
  loadCatalog().then(() => {
    updateResumeButtons();
    renderCollections();
  });
}

function selectCollection(filter) {
  currentCollectionFilter = filter;

  document
    .querySelectorAll(".sidebar-link")
    .forEach((button) => button.classList.remove("active"));

  if (filter === "all") {
    document
      .querySelector("button[onclick=\"selectCollection('all')\"]")
      ?.classList.add("active");
  }

  if (filter === "incomplete") {
    document
      .querySelector("button[onclick=\"selectCollection('incomplete')\"]")
      ?.classList.add("active");
  }

  renderCollections();
}

function renderCollections() {
  const grid = document.getElementById("collectionsGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const collections = new Map();

  for (const film of catalog.films) {
    if (!film.collectionId || !film.collectionNom) {
      continue;
    }

    if (!collections.has(film.collectionId)) {
      collections.set(film.collectionId, {
        id: film.collectionId,
        nom: film.collectionNom,
        image: film.collectionImage || null,
        films: [],
      });
    }

    collections.get(film.collectionId).films.push(film);
  }

  for (const collection of collections.values()) {
    if (!collection.image) {
      const firstFilm = [...collection.films].sort(
        (a, b) =>
          Number(a.anneeTmdb || a.annee || 9999) -
          Number(b.anneeTmdb || b.annee || 9999),
      )[0];

      collection.image = firstFilm?.image || null;
    }
  }

  const collectionList = [...collections.values()]
  .filter((collection) => matchesSearch(collection.nom))
  .filter((collection) => {
    const uniqueFilms = new Set();

    for (const film of collection.films) {
      const key = film.tmdbId
        ? `tmdb:${film.tmdbId}`
        : `title:${film.titre}|${film.annee || ""}`;

      uniqueFilms.add(key);
    }

    if (currentCollectionFilter === "incomplete") {
      return uniqueFilms.size === 1;
    }

    return uniqueFilms.size >= 1;
  })
  .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  
  setText("sideCollections", collectionList.length);
  const groupedFilms = new Set();
  for (const film of catalog.films) {
    const key = film.tmdbId
      ? `tmdb:${film.tmdbId}`
      : `title:${film.titre}|${film.annee || ""}`;
    groupedFilms.add(key);
  }
  setText("sideFilms", groupedFilms.size);

  const uniqueFilms = new Set();
  for (const collection of collectionList) {
    for (const film of collection.films) {
      const key = film.tmdbId
        ? `tmdb:${film.tmdbId}`
        : `title:${film.titre}|${film.annee || ""}`;

      uniqueFilms.add(key);
    }
  }
  setText(
    "collectionsCount",
    `${collectionList.length} collection${collectionList.length >= 1 ? "s" : ""}`,
  );
  setText("collectionsFilmsCount", `${uniqueFilms.size} films`);

  for (const collection of collectionList) {
    const card = document.createElement("article");
    card.className = "media-card";

    let collectionName = collection.nom;
    if (collectionName) {
      collectionName = `${collectionName.replace(/\s*-\s*saga$/i, "")}`;
    }

    const posterZone = document.createElement("div");
    posterZone.className = "poster-zone";
    posterZone.appendChild(
      createPosterContent(collection.image, collectionName, collection.id),
    );

    posterZone.onclick = () => {
      sessionStorage.setItem("collectionsSearch", currentSearch);
      sessionStorage.setItem("selectedCollectionId", collection.id);
      sessionStorage.setItem("selectedCollectionName", collection.nom);
      sessionStorage.setItem("collectionMode", "true");
      window.location.href = "films.html";
    };
    const uniqueFilms = new Set();

    for (const film of collection.films) {
      const key = film.tmdbId
        ? `tmdb:${film.tmdbId}`
        : `title:${film.titre}|${film.annee || ""}`;

      uniqueFilms.add(key);
    }

    const badge = document.createElement("button");

    badge.className = "play-button";
    badge.textContent = uniqueFilms.size;

    posterZone.appendChild(badge);

    card.appendChild(posterZone);
    grid.appendChild(card);
  }
}
