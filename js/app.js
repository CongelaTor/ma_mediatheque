let catalog = null;

let currentPage = 'home';
let currentGenre = 'all';
let currentSearch = '';

const tmdbBaseUrl = 'https://www.themoviedb.org';
const tmdbSearchBaseUrl = 'https://www.themoviedb.org/search';

const missingPosterColors = [
    '#f97316',
    '#eab308',
    '#14b8a6',
    '#8b5cf6',
    '#ef4444',
    '#22c55e',
    '#06b6d4',
    '#f43f5e'
];

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {

    await loadCatalog();

    updateStats();
    updateResumeButtons();
    renderFilms();
    renderSeries();

}

async function loadCatalog() {

    const response = await fetch('data/catalog.json');

    catalog = await response.json();

}

async function reloadCatalog() {

    await loadCatalog();

    updateStats();

    if (currentPage === 'films') {
        renderFilms();
    }

    if (currentPage === 'series') {
        renderSeries();
    }

}

function showPage(pageName) {

    currentPage = pageName;

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelector(`#page-${pageName}`).classList.add('active');

    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.querySelector(`.nav-button[data-page="${pageName}"]`);

    if (activeButton) {
        activeButton.classList.add('active');
    }

    if (pageName === 'films') {
        renderFilms();
    }

    if (pageName === 'series') {
        renderSeries();
    }

}

function updateStats() {

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

function handleSearch() {

    currentSearch = document.getElementById('searchInput').value.trim().toLowerCase();

    if (currentPage === 'films') {
        renderFilms();
    }

    if (currentPage === 'series') {
        renderSeries();
    }

}

function selectGenre(genre) {

    currentGenre = genre;

    document.querySelectorAll('.sidebar-link[data-genre]').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.querySelector(`.sidebar-link[data-genre="${genre}"]`);

    if (activeButton) {
        activeButton.classList.add('active');
    }

    renderFilms();

}

function renderFilms() {

    const grid = document.getElementById('filmsGrid');

    grid.innerHTML = '';

    const films = catalog.films
        .filter(film => filmMatchesGenre(film))
        .filter(film => matchesSearch(film.titre))
        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

    setText('filmsCount', `${films.length} film${films.length > 1 ? 's' : ''}`);

    for (const film of films) {
        grid.appendChild(createFilmCard(film));
    }

    updateResumeButtons();

}

function filmMatchesGenre(film) {

    if (currentGenre === 'all') {
        return true;
    }

    if (!film.genre) {
        return false;
    }

    if (Array.isArray(film.genre)) {
        return film.genre.includes(currentGenre);
    }

    return film.genre === currentGenre;

}

function createFilmCard(film) {

    const card = document.createElement('article');
    card.className = 'media-card';

    const posterZone = document.createElement('div');
    posterZone.className = 'poster-zone';
    posterZone.onclick = () => openTmdbForFilm(film);
    posterZone.appendChild(createPosterContent(film.image, film.titre, film.id));

    const playButton = document.createElement('button');

    playButton.className = 'play-button';
    playButton.innerHTML = '<span class="play-icon">▶</span>';
    playButton.onclick = event => {
        event.stopPropagation();
        playFilm(film);
    };
    posterZone.appendChild(playButton);

    if (film.doublonExact || film.doublonProbable) {
        const duplicateBadge = document.createElement('div');
        duplicateBadge.className = 'duplicate-badge';
        duplicateBadge.textContent = film.doublonExact ? 'Doublon exact' : 'Doublon probable';
        info.appendChild(duplicateBadge);
    }

    card.appendChild(posterZone);
    return card;

}

function renderSeries() {

    const grid = document.getElementById('seriesGrid');
    const episodesPanel = document.getElementById('episodesPanel');

    grid.classList.remove('hidden');
    episodesPanel.classList.add('hidden');
    episodesPanel.innerHTML = '';

    document.getElementById('backToSeriesButton').classList.add('hidden');
    setText('seriesTitle', 'Séries');

    grid.innerHTML = '';

    const series = catalog.series
        .filter(serie => matchesSearch(serie.titre))
        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

    setText('seriesCount', `${series.length} série${series.length > 1 ? 's' : ''}`);

    for (const serie of series) {
        grid.appendChild(createSerieCard(serie));
    }

    updateResumeButtons();

}

function createSerieCard(serie) {

    const card = document.createElement('article');
    card.className = 'media-card';

    const posterZone = document.createElement('div');
    posterZone.className = 'poster-zone';
    posterZone.onclick = () => showSerieDetails(serie);
    posterZone.appendChild(createPosterContent(serie.image, serie.titre, serie.id));

    const playButton = document.createElement('button');

    playButton.className = 'play-button';

    playButton.innerHTML =
        '<span class="play-icon">▶</span>';

    playButton.onclick = event => {
        event.stopPropagation();
        playFirstSerieEpisode(serie);
    };
    posterZone.appendChild(playButton);
    card.appendChild(posterZone);

    return card;
}

function showSerieDetails(serie) {

    const grid = document.getElementById('seriesGrid');
    const episodesPanel = document.getElementById('episodesPanel');

    grid.classList.add('hidden');
    episodesPanel.classList.remove('hidden');

    setText('seriesTitle', serie.titre);
    setText('seriesCount', `${countSerieEpisodes(serie)} épisode${countSerieEpisodes(serie) > 1 ? 's' : ''}`);
    document.getElementById('backToSeriesButton').classList.remove('hidden');
    episodesPanel.innerHTML = '';

    const sortedSeasons = [...serie.saisons].sort((a, b) => a.numero - b.numero);

    if (sortedSeasons.length === 0) {
        return;
    }

    const seasonsBar = document.createElement('div');
    seasonsBar.className = 'seasons-bar';

    const episodesGrid = document.createElement('div');
    episodesGrid.className = 'cards-grid';
    episodesPanel.appendChild(seasonsBar);
    episodesPanel.appendChild(episodesGrid);

    function renderSeason(selectedSeason) {

        seasonsBar.querySelectorAll('.season-button').forEach(button => {
            button.classList.remove('active');
        });

        const activeButton = seasonsBar.querySelector(`[data-season="${selectedSeason.numero}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        episodesGrid.innerHTML = '';

        const sortedEpisodes = [...selectedSeason.episodes].sort((a, b) => a.numero - b.numero);
        for (const episode of sortedEpisodes) {
            episodesGrid.appendChild(createEpisodeCard(serie, selectedSeason, episode));
        }
    }

    for (const saison of sortedSeasons) {
        const button = document.createElement('button');
        button.className = 'season-button';
        button.dataset.season = saison.numero;
        button.textContent = `Saison ${saison.numero}`;
        button.onclick = () => {
            renderSeason(saison);
        };
        seasonsBar.appendChild(button);
    }
    renderSeason(sortedSeasons[0]);
}

function createEpisodeCard(serie, saison, episode) {

    const card = document.createElement('article');
    card.className = 'media-card';

    const posterZone = document.createElement('div');
    posterZone.className = 'poster-zone';
    posterZone.onclick = () => openTmdbForSerie(serie);
    posterZone.appendChild(
        createMissingPoster(
            `Épisode ${episode.numero}`
        )
    );

    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML =
        '<span class="play-icon">▶</span>';

    playButton.onclick = event => {
        event.stopPropagation();
        playEpisode(
            serie,
            saison,
            episode
        );
    };
    posterZone.appendChild(playButton);
    card.appendChild(posterZone);
    return card;
}

function playFirstSerieEpisode(serie) {
    const sortedSeasons = [...serie.saisons].sort((a, b) => a.numero - b.numero);
    if (sortedSeasons.length === 0) {
        return;
    }

    const firstSeason = sortedSeasons[0];
    const sortedEpisodes = [...firstSeason.episodes].sort((a, b) => a.numero - b.numero);
    if (sortedEpisodes.length === 0) {
        return;
    }
    playEpisode(serie, firstSeason, sortedEpisodes[0]);
}

function createPosterContent(imagePath, title, seed) {

    if (imagePath && isWebSafeImagePath(imagePath)) {

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = title;

        img.onerror = () => {
            const fallback = createMissingPoster(title);
            img.replaceWith(fallback);
        };

        return img;

    }

    return createMissingPoster(title);

}

function createMissingPoster(seed) {

    const div = document.createElement('div');

    div.className = 'missing-poster';

    div.style.background =
        'linear-gradient(135deg, #1b3045 0%, #20364c 30%, #233b54 60%, #284060 100%)'; const text = document.createElement('span');

    text.textContent = seed;

    div.appendChild(text);

    return div;

}


function isWebSafeImagePath(imagePath) {

    if (!imagePath) {
        return false;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return true;
    }

    if (imagePath.startsWith('img/') || imagePath.startsWith('./img/') || imagePath.startsWith('images/')) {
        return true;
    }

    return false;

}

function playFilm(film) {

    saveResumeFilm(film);

    requestLocalPlay({
        type: 'film',
        titre: film.titre,
        fichier: film.fichier
    });

}

function playEpisode(serie, saison, episode) {

    saveResumeSerie(serie, saison, episode);

    requestLocalPlay({
        type: 'serie',
        titre: serie.titre,
        saison: saison.numero,
        episode: episode.numero,
        fichier: episode.fichier
    });

}

function requestLocalPlay(payload) {

    fetch('http://localhost:9876', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error(error));

}

function saveResumeFilm(film) {

    localStorage.setItem('maVideotheque.resumeFilm', JSON.stringify({
        titre: film.titre,
        fichier: film.fichier,
        date: new Date().toISOString()
    }));

    updateResumeButtons();

}

function saveResumeSerie(serie, saison, episode) {

    localStorage.setItem('maVideotheque.resumeSerie', JSON.stringify({
        titre: serie.titre,
        saison: saison.numero,
        episode: episode.numero,
        fichier: episode.fichier,
        date: new Date().toISOString()
    }));

    updateResumeButtons();

}

function resumeFilm() {

    const resume = getResumeFilm();

    if (!resume) {
        return;
    }

    requestLocalPlay({
        type: 'film',
        titre: resume.titre,
        fichier: resume.fichier
    });

}

function resumeSerie() {

    const resume = getResumeSerie();

    if (!resume) {
        return;
    }

    requestLocalPlay({
        type: 'serie',
        titre: resume.titre,
        saison: resume.saison,
        episode: resume.episode,
        fichier: resume.fichier
    });

}

function updateResumeButtons() {

    const resumeFilm = getResumeFilm();
    const resumeSerie = getResumeSerie();

    const resumeFilmButton = document.getElementById('resumeFilmButton');
    const resumeSerieButton = document.getElementById('resumeSerieButton');

    if (resumeFilm) {
        resumeFilmButton.classList.remove('hidden');
        setText('resumeFilmText', resumeFilm.titre);
    } else {
        resumeFilmButton.classList.add('hidden');
    }

    if (resumeSerie) {
        resumeSerieButton.classList.remove('hidden');
        setText(
            'resumeSerieText',
            `${resumeSerie.titre} S${formatNumber(resumeSerie.saison)}E${formatNumber(resumeSerie.episode)}`
        );
    } else {
        resumeSerieButton.classList.add('hidden');
    }

}

function getResumeFilm() {

    const value = localStorage.getItem('maVideotheque.resumeFilm');

    if (!value) {
        return null;
    }

    return JSON.parse(value);

}

function getResumeSerie() {

    const value = localStorage.getItem('maVideotheque.resumeSerie');

    if (!value) {
        return null;
    }

    return JSON.parse(value);

}

function openTmdbForFilm(film) {

    if (film.tmdbId) {
        window.open(`${tmdbBaseUrl}/movie/${film.tmdbId}`, '_blank');
        return;
    }

    window.open(`${tmdbSearchBaseUrl}?query=${encodeURIComponent(film.titre)}`, '_blank');

}

function openTmdbForSerie(serie) {

    if (serie.tmdbId) {
        window.open(`${tmdbBaseUrl}/tv/${serie.tmdbId}`, '_blank');
        return;
    }

    window.open(`${tmdbSearchBaseUrl}?query=${encodeURIComponent(serie.titre)}`, '_blank');

}

function countSerieEpisodes(serie) {

    let count = 0;

    for (const saison of serie.saisons) {
        count += saison.episodes.length;
    }

    return count;

}

function matchesSearch(value) {

    if (!currentSearch) {
        return true;
    }

    return value.toLowerCase().includes(currentSearch);

}

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}

function formatNumber(value) {

    return String(value).padStart(2, '0');

}

function hashCode(value) {

    let hash = 0;

    for (let index = 0; index < value.length; index++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }

    return hash;

}