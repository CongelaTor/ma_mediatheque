async function loadCatalog() {
    const response = await fetch('data/catalog.json');
    catalog = await response.json();
}
async function reloadCatalog() {
    await loadCatalog();
    updateStats();
    if (currentPage === 'films' && typeof renderFilms === 'function') {
        renderFilms();
    }
    if (currentPage === 'series' && typeof renderSeries === 'function') {
        renderSeries();
    }
    if (currentPage === 'serie-detail' && currentSerie && typeof showSerieDetails === 'function') {
        showSerieDetails(currentSerie, currentSeason);
    }
}
function updateStats() {
    if (!catalog) {
        return;
    }
    const filmsCount = catalog.films.length;
    const seriesCount = catalog.series.length;
    const episodesCount = countEpisodes();
    setText('statFilms', filmsCount);
    setText('statSeries', seriesCount);
    setText('statEpisodes', episodesCount);
    setText('sideFilms', filmsCount);
    setText('sideSeries', seriesCount);
    setText('sideEpisodes', episodesCount);
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
