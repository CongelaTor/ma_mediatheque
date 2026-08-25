function initCollectionsPage() {
  currentPage = "collections";

  loadCatalog().then(() => {
    updateResumeButtons();
    renderCollections();
  });
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

      return uniqueFilms.size > 1;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  setText(
    "collectionsCount",
    `${collectionList.length} collection${collectionList.length > 1 ? "s" : ""}`,
  );

  setText("sideCollections", collectionList.length);

  setText(
    "sideFilms",
    collectionList.reduce(
      (total, collection) => total + collection.films.length,
      0,
    ),
  );

  for (const collection of collectionList) {
    const card = document.createElement("article");
    card.className = "media-card";

    let collectionName = collection.nom;
    if (collectionName) {
    collectionName =
      `${collectionName.replace(/\s*-\s*saga$/i, "")}`;
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
