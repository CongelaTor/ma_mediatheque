async function loadCatalog() {
    const response = await fetch('data/catalog.json');
    catalog = await response.json();
}
async function reloadCatalog() {
    openScanModal();
    const response = await fetch('http://localhost:9876/refresh-catalog', {
        method: 'POST'
    });
    if (!response.ok) {
        const log = await response.text();
        alert(log);
        console.error(await response.text());
        return;
    }
    const log = await response.text();

    await loadCatalog();
    updateStats();

    if (currentPage === 'films' && typeof renderFilms === 'function') {
        renderFilms();
    }
    if (currentPage === 'series' && typeof renderSeries === 'function') {
        renderSeries();
    }
    if (currentPage === 'episodes' && currentSerie && typeof showSerieDetails === 'function') {
        showSerieDetails(currentSerie, currentSeason);
    }
    document.getElementById('scanLog').textContent = log;
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
function openScanModal() {
    document
        .getElementById('scanModal')
        .classList.remove('hidden');
}

function closeScanModal() {
    document
        .getElementById('scanModal')
        .classList.add('hidden');
}
