function playFilm(film) {
  saveResumeFilm(film);
  updateResumePlayback("film", film);
  updateResumeButtons();
  requestLocalPlay({
    type: "film",
    titre: film.titre,
    fichier: film.fichier,
  });
}
function playEpisode(serie, saison, episode) {
  const episodes = saison.episodes
    .filter((item) => episodeMatchesDetailLanguage(item))
    .sort((a, b) => a.numero - b.numero);
  const selectedEpisodeIndex = episodes.findIndex(
    (item) => item.fichier === episode.fichier,
  );
  const fichiers = episodes
    .slice(selectedEpisodeIndex)
    .map((item) => item.fichier);
  saveResumeSerie(serie, saison, episode);
  updateResumePlayback("serie", episode);
  requestLocalPlay({
    type: "serie",
    titre: serie.titre,
    saison: saison.numero,
    episode: episode.numero,
    fichier: episode.fichier,
    fichiers: fichiers,
  });
}
function requestLocalPlay(payload) {
  fetch("http://localhost:9876", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
}

function syncResumePlayback(type) {
  fetch("http://localhost:9876/sync-resume-playback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: type,
    }),
  })
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      updateResumeButtons();
    })
    .catch((error) => console.error(error));
}

function requestResumePlayback(type) {
  fetch("http://localhost:9876/resume-playback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: type,
    }),
  })
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
}

function updateResumePlayback(type, media) {
  fetch("http://localhost:9876/update-resume-playback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: type,
      catalogPath: media.fichier,
      durationSeconds: 0,
    }),
  })
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      updateResumeButtons();
    })
    .catch((error) => console.error(error));
}
function saveResumeFilm(film) {
  const title = film.titreTmdb || film.titre;
  localStorage.setItem(
    "maVideotheque.resumeFilm",
    JSON.stringify({
      titre: title,
      fichier: film.fichier,
      date: new Date().toISOString(),
    }),
  );
  updateResumeButtons();
}
function saveResumeSerie(serie, saison, episode) {
  localStorage.setItem(
    "maVideotheque.resumeSerie",
    JSON.stringify({
      titre: serie.titre,
      saison: saison.numero,
      episode: episode.numero,
      fichier: episode.fichier,
      date: new Date().toISOString(),
    }),
  );
  updateResumeButtons();
}

function resumeFilm() {
  requestResumePlayback("film");
}
function resumeSerie() {
  requestResumePlayback("serie");
}

function updateResumeButtons() {
  const resumeCollection = getResumeCollection();
  const resumeSerie = getResumeSerie();
  const resumeCollectionButton = document.getElementById(
    "resumeCollectionButton",
  );
  const resumeFilmButton = document.getElementById("resumeFilmButton");
  const resumeSerieButton = document.getElementById("resumeSerieButton");
  if (!mediaServerAvailable) {
    resumeCollectionButton?.classList.add("hidden");
    resumeFilmButton?.classList.add("hidden");
    resumeSerieButton?.classList.add("hidden");
    return;
  }
  if (resumeCollectionButton) {
    if (resumeCollection) {
      resumeCollectionButton.classList.remove("hidden");
      setText("resumeCollectionText", resumeCollection.titre);
    } else {
      resumeCollectionButton.classList.add("hidden");
    }
  }
  resumeFilmButton?.classList.add("hidden");
  resumeSerieButton?.classList.add("hidden");
  fetch("http://localhost:9876/get-resume-playback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((resumeData) => {
      if (resumeFilmButton && resumeData.film?.catalogPath) {
        const position = new Date(
          (Number(resumeData.film.positionSeconds) || 0) * 1000,
        )
          .toISOString()
          .substring(11, 19);
        const film = catalog.films.find(
          (item) => item.fichier === resumeData.film.catalogPath,
        );
        resumeFilmButton.classList.remove("hidden");
        setText(
          "resumeFilmText",
          `${film?.titreTmdb || film?.titre || resumeData.film.catalogPath.split("/").pop() || "Film"} (${position})`,
        );
      }
      if (resumeSerieButton && resumeData.serie?.catalogPath && resumeSerie) {
        const position = new Date(
          (Number(resumeData.serie.positionSeconds) || 0) * 1000,
        )
          .toISOString()
          .substring(11, 19);
        resumeSerieButton.classList.remove("hidden");
        setText(
          "resumeSerieText",
          `${resumeSerie.titre} S${formatNumber(resumeSerie.saison)}E${formatNumber(resumeSerie.episode)} (${position})`,
        );
      }
    })
    .catch((error) => console.error(error));
}

function getResumeCollection() {
  const value = localStorage.getItem("maVideotheque.resumeFilm");
  if (!value) {
    return null;
  }
  return JSON.parse(value);
}
function getResumeFilm() {
  const value = localStorage.getItem("maVideotheque.resumeFilm");
  if (!value) {
    return null;
  }
  return JSON.parse(value);
}
function getResumeSerie() {
  const value = localStorage.getItem("maVideotheque.resumeSerie");
  if (!value) {
    return null;
  }
  return JSON.parse(value);
}

setInterval(() => {
  updateResumeButtons();
}, 60000);

function initResumeButtons() {
  const syncFilmButton = document.getElementById("syncFilmButton");
  if (syncFilmButton) {
    syncFilmButton.onclick = () => {
      syncResumePlayback("film");
    };
  }

  const syncSerieButton = document.getElementById("syncSerieButton");
  if (syncSerieButton) {
    syncSerieButton.onclick = () => {
      syncResumePlayback("serie");
    };
  }
}