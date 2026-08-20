currentPage = "film-detail";

async function initFilmDetailPage() {
  currentPage = "film-detail";

  const params = new URLSearchParams(window.location.search);
  const tmdbId = Number(params.get("tmdbId"));

  if (!tmdbId) {
    window.location.href = "films.html";
    return;
  }

  await loadCatalog();

  const films = catalog.films.filter((film) => film.tmdbId === tmdbId);

  if (films.length === 0) {
    const storedInfo = JSON.parse(
      sessionStorage.getItem("filmDetailInfo") || "{}",
    );

    setText("filmTitle", storedInfo.titreTmdb || "");
    setText("filmDuration", "0 fichier");

    setText("filmInfoTitle", storedInfo.titreTmdb || "");
    setText("filmInfoYear", storedInfo.anneeTmdb || "");
    setText("filmInfoDescription", storedInfo.descriptionTmdb || "");

    const infoCard = document.getElementById("filmInfoCard");
    infoCard.classList.remove("hidden");

    const imageContainer = infoCard.querySelector(".serie-info-image");

    imageContainer.innerHTML = "";

    if (storedInfo.image) {
      imageContainer.appendChild(
        createPosterContent(
          storedInfo.image,
          storedInfo.titreTmdb,
          "film-detail",
        ),
      );
    }

    document.getElementById("filmTmdbButton").onclick = () => {
      window.location.href = storedInfo.tmdbUrl;
    };

    renderFilmFiles([]);

    return;
  }
  const referenceFilm = films[0];
  console.log("tmdbId =", tmdbId);
  console.log("films =", films);
  console.log("referenceFilm =", referenceFilm);
  sessionStorage.setItem(
    "filmDetailInfo",
    JSON.stringify({
      titreTmdb: referenceFilm.titreTmdb || referenceFilm.titre,
      anneeTmdb: referenceFilm.anneeTmdb || referenceFilm.annee,
      descriptionTmdb: referenceFilm.descriptionTmdb,
      image: referenceFilm.image,
      tmdbUrl: referenceFilm.tmdbUrl,
    }),
  );
  
  setText("filmTitle", referenceFilm.titreTmdb || referenceFilm.titre);

  setText(
    "filmDuration",
    referenceFilm.dureeTmdb
      ? `${referenceFilm.dureeTmdb} min`
      : "Durée inconnue",
  );

  setText("filmInfoTitle", referenceFilm.titreTmdb || referenceFilm.titre);

  setText("filmInfoYear", referenceFilm.anneeTmdb || referenceFilm.annee || "");

  setText("filmInfoDescription", referenceFilm.descriptionTmdb || "");

  const infoCard = document.getElementById("filmInfoCard");
  infoCard.classList.remove("hidden");

  const imageContainer = infoCard.querySelector(".serie-info-image");

  imageContainer.innerHTML = "";

  imageContainer.appendChild(
    createPosterContent(
      referenceFilm.image,
      referenceFilm.titre,
      referenceFilm.id,
    ),
  );

  document.getElementById("filmTmdbButton").onclick = () => {
    window.location.href = referenceFilm.tmdbUrl;
  };

  console.log("films du groupe", films);
  renderFilmFiles(films);
}

function renderFilmFiles(films) {
  const panel = document.getElementById("filmFilesPanel");
  panel.innerHTML = "";

  const selectedLanguages = [
    ...document.querySelectorAll(".language-button.active"),
  ].map((button) => button.dataset.language);

  const filteredFilms = films
    .filter((film) => {
      const languages = Array.isArray(film.langue)
        ? film.langue
        : [film.langue || "TBD"];

      return languages.some((language) => selectedLanguages.includes(language));
    })
    .sort((a, b) => (a.taille || 0) - (b.taille || 0));

  setText(
    "filmDuration",
    `${filteredFilms.length} fichier${filteredFilms.length > 1 ? "s" : ""}`,
  );

  const filesList = document.createElement("div");
  filesList.className = "episode-list";

  for (const film of filteredFilms) {
    filesList.appendChild(createFilmFileCard(film));
  }

  panel.appendChild(filesList);
}

function createFilmFileCard(film) {
  const card = document.createElement("article");
  card.className = "film-file-card";

  const titleRow = document.createElement("div");
  titleRow.className = "film-file-row";

  const title = document.createElement("div");
  title.className = "film-file-title";
  title.textContent = film.nomFichier || "Fichier sans nom";
  title.title = film.nomFichier || "";

  const tmdbButton = document.createElement("button");
  tmdbButton.className = "tmdb-associate-button film-file-action-button";
  tmdbButton.innerHTML = `
    <span class="play-icon film-link-icon">
      <svg viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4"/>
        <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 20"/>
      </svg>
    </span>`;
  tmdbButton.title = "Réassocier TMDB";
  tmdbButton.onclick = () => showTmdbFilmSearch(film);

  titleRow.appendChild(title);
  titleRow.appendChild(tmdbButton);

  const locationRow = document.createElement("div");
  locationRow.className = "film-file-row";

  const folder = document.createElement("div");
  folder.className = "film-file-folder";
  folder.textContent = getFilmFolder(film.fichier);
  folder.title = getFilmFolder(film.fichier);

  const locationButton = document.createElement("button");
  locationButton.className = "tmdb-associate-button film-file-action-button";
  locationButton.innerHTML = '<span class="play-icon film-open-icon">🗁</span>';

  locationButton.title = "Ouvrir l'emplacement";
  locationButton.onclick = () => openFilmLocation(film);

  locationRow.appendChild(folder);
  locationRow.appendChild(locationButton);

  const playbackRow = document.createElement("div");
  playbackRow.className = "film-file-row";

  const metadata = document.createElement("div");
  metadata.className = "film-file-meta";

  const languages = Array.isArray(film.langue)
    ? film.langue.join(", ")
    : film.langue || "TBD";

  metadata.textContent = `${languages} • ${formatFilmFileSize(film.taille)}`;

  const playButton = document.createElement("button");
  playButton.className = "tmdb-associate-button film-file-action-button";
  playButton.innerHTML = '<span class="play-icon">▶</span>';
  playButton.onclick = () => playFilm(film);

  playbackRow.appendChild(metadata);
  playbackRow.appendChild(playButton);

  card.appendChild(titleRow);
  card.appendChild(locationRow);
  card.appendChild(playbackRow);

  return card;
}

function formatFilmFileSize(size) {
  if (!size) {
    return "Taille inconnue";
  }

  const gigabytes = size / (1024 * 1024 * 1024);

  if (gigabytes >= 1) {
    return `${gigabytes.toFixed(2)} Go`;
  }

  const megabytes = size / (1024 * 1024);
  return `${megabytes.toFixed(0)} Mo`;
}

function getFilmFolder(filePath) {
  if (!filePath) {
    return "Dossier inconnu";
  }

  const separatorIndex = Math.max(
    filePath.lastIndexOf("\\"),
    filePath.lastIndexOf("/"),
  );

  return separatorIndex >= 0 ? filePath.substring(0, separatorIndex) : filePath;
}

async function openFilmLocation(film) {
  const response = await fetch("http://localhost:9876/open-file-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fichier: film.fichier,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
  }
}
