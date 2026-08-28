function playFilm(film) {
  saveResumeFilm(film);
  requestLocalPlay({
    type: "film",
    titre: film.titre,
    fichier: film.fichier,
  });
}
function playEpisode(serie, saison, episode) {
  saveResumeSerie(serie, saison, episode);
  requestLocalPlay({
    type: "serie",
    titre: serie.titre,
    saison: saison.numero,
    episode: episode.numero,
    fichier: episode.fichier,
  });
}
function playFilm(film) {
  saveResumeFilm(film);
  requestLocalPlay({
    type: "film",
    titre: film.titre,
    fichier: film.fichier,
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
  const resume = getResumeFilm();
  if (!resume) {
    return;
  }
  requestLocalPlay({
    type: "film",
    titre: resume.titre,
    fichier: resume.fichier,
  });
}
function resumeSerie() {
  const resume = getResumeSerie();
  if (!resume) {
    return;
  }
  requestLocalPlay({
    type: "serie",
    titre: resume.titre,
    saison: resume.saison,
    episode: resume.episode,
    fichier: resume.fichier,
  });
}
function updateResumeButtons() {
  const resumeCollection = getResumeCollection();
  const resumeFilm = getResumeFilm();
  const resumeSerie = getResumeSerie();

  const resumeCollectionButton = document.getElementById(
    "resumeCollectionButton",
  );
  const resumeFilmButton = document.getElementById("resumeFilmButton");
  const resumeSerieButton = document.getElementById("resumeSerieButton");

  if (resumeCollectionButton) {
    if (resumeCollection) {
      resumeCollectionButton.classList.remove("hidden");
      setText("resumeCollectionText", resumeCollection.titre);
    } else {
      resumeCollectionButton.classList.add("hidden");
    }
  }

  if (resumeFilmButton) {
    if (resumeFilm) {
      resumeFilmButton.classList.remove("hidden");
      setText("resumeFilmText", resumeFilm.titre);
    } else {
      resumeFilmButton.classList.add("hidden");
    }
  }

  if (resumeSerieButton) {
    if (resumeSerie) {
      resumeSerieButton.classList.remove("hidden");
      setText(
        "resumeSerieText",
        `${resumeSerie.titre} S${formatNumber(resumeSerie.saison)}E${formatNumber(resumeSerie.episode)}`,
      );
    } else {
      resumeSerieButton.classList.add("hidden");
    }
  }
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
