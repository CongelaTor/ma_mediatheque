async function initHomePage() {
    await loadCatalog();
    updateStats();
    updateResumeButtons();
}
async function initFilmsPage() {
    currentPage = 'films';
    await loadCatalog();
    updateStats();
    updateResumeButtons();
    initFilmFilters();
    renderFilms();
}
async function initSeriesPage() {
    currentPage = 'series';
    await loadCatalog();
    initializeLanguageFilters();
    updateStats();
    updateResumeButtons();
    renderSeries();
}
