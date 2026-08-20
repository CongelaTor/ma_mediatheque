function initFilmDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const tmdbId = Number(params.get("tmdbId"));

  if (!tmdbId) {
    window.location.href = "films.html";
    return;
  }

  const films = catalog.films.filter((film) => film.tmdbId === tmdbId);

  if (films.length === 0) {
    window.location.href = "films.html";
    return;
  }

  const referenceFilm = films[0];

  setText("filmTitle", referenceFilm.titreTmdb || referenceFilm.titre);

  setText(
    "filmDuration",
    referenceFilm.duree ? `${referenceFilm.duree} min` : "Durée inconnue",
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
}
