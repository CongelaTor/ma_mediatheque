async function loadCatalog() {
  const response = await fetch("data/catalog.json");
  catalog = await response.json();
}
async function reloadCatalog(type = "all") {
  openScanModal();
  document.getElementById("scanTitle").textContent =
    type === "films"
      ? "Scan des films en cours..."
      : type === "series"
        ? "Scan des séries en cours..."
        : "Scan des disques en cours...";

  await new Promise((resolve) => setTimeout(resolve, 500));

  document.getElementById("scanLog").textContent = "";
  const response = await fetch("http://localhost:9876/refresh-catalog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
    }),
  });
  if (!response.ok) {
    const log = await response.text();
    alert(log);
    console.error(await response.text());
    return;
  }
  const log = await response.text();

  document.getElementById("scanTitle").textContent =
    type === "films"
      ? "Scan des films terminé"
      : type === "series"
        ? "Scan des séries terminé"
        : "Scan des disques terminé";

  await loadCatalog();
  updateStats();

  if (currentPage === "films" && typeof renderFilms === "function") {
    renderFilms();
  }
  if (currentPage === "series" && typeof renderSeries === "function") {
    renderSeries();
  }
  if (
    currentPage === "episodes" &&
    currentSerie &&
    typeof showSerieDetails === "function"
  ) {
    showSerieDetails(currentSerie, currentSeason);
  }
  document.getElementById("scanLog").textContent = log;
}
function updateStats() {
  if (!catalog) {
    return;
  }
  const filmsCount = catalog.films.length;
  const seriesCount = catalog.series.length;
  const episodesCount = countEpisodes();
  setText("statFilms", filmsCount);
  setText("statSeries", seriesCount);
  setText("statEpisodes", episodesCount);
  setText("sideFilms", filmsCount);
  setText("sideSeries", seriesCount);
  setText("sideEpisodes", episodesCount);
}
function countEpisodes() {
  let count = 0;
  for (const serie of catalog.series) {
    for (const saison of serie.saisons) {
      count += saison.episodes.length;
    }
  }
  return count;
}
function openScanModal() {
  document.getElementById("scanModal").classList.remove("hidden");
}

function closeScanModal() {
  document.getElementById("scanModal").classList.add("hidden");
}
