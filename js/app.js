let catalog = null;
const tmdbApiKey = '7f5ccb60f02be23a0abc64fdd5070eba';
let currentPage = 'home';
let currentSerie = null;
let currentSeason = null;
let currentGenre = 'all';
let currentSearch = '';
let activeSeriesLanguages = new Set(['VO', 'VF', 'VOST', 'VOSTFR']);
let activeDetailLanguage = null;
const languageOrder = ['VO', 'VF', 'VOST', 'VOSTFR'];

const tmdbBaseUrl = 'https://www.themoviedb.org';
const tmdbSearchBaseUrl = 'https://www.themoviedb.org/search';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await loadCatalog();
    initializeLanguageFilters();
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

    // if (film.doublonExact || film.doublonProbable) {
    //     const duplicateBadge = document.createElement('div');
    //     duplicateBadge.className = 'duplicate-badge';
    //     duplicateBadge.textContent = film.doublonExact ? 'Doublon exact' : 'Doublon probable';
    //     info.appendChild(duplicateBadge);
    // }

    card.appendChild(posterZone);
    return card;

}

function initializeLanguageFilters() {
    document.querySelectorAll('#languageFilters .language-button').forEach(button => {
        button.onclick = () => handleLanguageButtonClick(button);
    });
}
function handleLanguageButtonClick(button) {
    const language = button.dataset.language;
    if (button.classList.contains('hidden')) {
        return;
    }
    if (currentSerie) {
        activeDetailLanguage = language;
        updateLanguageButtons();
        showSerieDetails(currentSerie, currentSeason);
        return;
    }
    if (button.classList.contains('active')) {
        if (activeSeriesLanguages.size === 1) {
            return;
        }
        activeSeriesLanguages.delete(language);
    } else {
        activeSeriesLanguages.add(language);
    }
    updateLanguageButtons();
    if (currentPage === 'series') {
        renderSeries();
    }
}
function getSerieLanguages(serie) {
    const languages = new Set();
    for (const saison of serie.saisons) {
        for (const episode of saison.episodes) {
            if (episode.langue) {
                languages.add(episode.langue);
            }
        }
    }
    return languageOrder.filter(language => languages.has(language));
}
function updateLanguageButtons() {
    if (currentSerie) {
        updateDetailLanguageButtons();
        return;
    }
    updateSeriesLanguageButtons();
}
function updateSeriesLanguageButtons() {
    document.querySelectorAll('#languageFilters .language-button').forEach(button => {
        const language = button.dataset.language;
        button.classList.remove('hidden');
        button.classList.toggle('active', activeSeriesLanguages.has(language));
    });
}
function updateDetailLanguageButtons() {
    const availableLanguages = getSerieLanguages(currentSerie);
    if (availableLanguages.length > 0 && !availableLanguages.includes(activeDetailLanguage)) {
        activeDetailLanguage = availableLanguages[0];
    }
    document.querySelectorAll('#languageFilters .language-button').forEach(button => {
        const language = button.dataset.language;
        const isVisible = availableLanguages.includes(language);
        button.classList.toggle('hidden', !isVisible);
        button.classList.toggle('active', isVisible && language === activeDetailLanguage);
    });
}
function episodeMatchesDetailLanguage(episode) {
    return episode.langue === activeDetailLanguage;
}
function serieMatchesSeriesLanguages(serie) {
    for (const saison of serie.saisons) {
        for (const episode of saison.episodes) {
            if (episode.langue && activeSeriesLanguages.has(episode.langue)) {
                return true;
            }
        }
    }
    return false;
}

function renderSeries() {
    currentSerie = null;
    currentSeason = null;
    activeDetailLanguage = null;
    updateLanguageButtons();
    const grid = document.getElementById('seriesGrid');
    const episodesPanel = document.getElementById('episodesPanel');
    grid.classList.remove('hidden');
    episodesPanel.classList.add('hidden');
    episodesPanel.innerHTML = '';
    document.getElementById('backToSeriesButton').classList.add('hidden');
    setText('seriesTitle', 'Séries');
    grid.innerHTML = '';
    const series = catalog.series
        .filter(serie => serieMatchesSeriesLanguages(serie))
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
    posterZone.onclick = () => {
        if (serie.tmdbId) {
            openTmdbForSerie(serie);
        } else {
            showTmdbSerieSearch(serie);
        }
    };
    posterZone.appendChild(createPosterContent(serie.image, serie.titre, serie.id));

    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML =
        '<span class="play-icon">▶</span>';
    playButton.onclick = event => {
        event.stopPropagation();
        showSerieDetails(serie);
    };
    posterZone.appendChild(playButton);

    card.appendChild(posterZone);
    return card;
}

function episodeMatchesLanguage(episode) {
    if (!episode.langue) {
        return true;
    }
    return activeLanguages.has(episode.langue);
}

function showSerieDetails(serie, requestedSeasonNumber = null) {
    currentSerie = serie;
    const serieLanguages = getSerieLanguages(serie);

    if (activeSeriesLanguages.size === 1) {

        const selectedLanguage =
            [...activeSeriesLanguages][0];

        if (serieLanguages.includes(selectedLanguage)) {
            activeDetailLanguage = selectedLanguage;
        }

    }

    const grid = document.getElementById('seriesGrid');
    const episodesPanel = document.getElementById('episodesPanel');
    grid.classList.add('hidden');
    episodesPanel.classList.remove('hidden');
    window.scrollTo(0, 0);
    setText('seriesTitle', serie.titre);
    document.getElementById('backToSeriesButton').classList.remove('hidden');
    episodesPanel.innerHTML = '';
    updateLanguageButtons();
    const sortedSeasons = [...serie.saisons].sort((a, b) => a.numero - b.numero);
    if (sortedSeasons.length === 0) {
        setText('seriesCount', '0 épisode');
        return;
    }
    const seasonsBar = document.createElement('div');
    seasonsBar.className = 'seasons-bar';
    const episodesGrid = document.createElement('div');
    episodesGrid.className = 'cards-grid';
    episodesPanel.appendChild(seasonsBar);
    episodesPanel.appendChild(episodesGrid);
    function renderSeason(selectedSeason) {
        currentSeason = selectedSeason.numero;
        seasonsBar.querySelectorAll('.season-button').forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = seasonsBar.querySelector(`[data-season="${selectedSeason.numero}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        episodesGrid.innerHTML = '';
        const sortedEpisodes = [...selectedSeason.episodes]
            .filter(episode => episodeMatchesDetailLanguage(episode))
            .sort((a, b) => a.numero - b.numero);
        setText('seriesCount', `${sortedEpisodes.length} épisode${sortedEpisodes.length > 1 ? 's' : ''}`);
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
    const selectedSeason = sortedSeasons.find(saison => saison.numero === requestedSeasonNumber) || sortedSeasons[0];
    renderSeason(selectedSeason);
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
        window.location.href = `${tmdbBaseUrl}/movie/${film.tmdbId}`;
        return;
    }

    window.location.href =
        `${tmdbSearchBaseUrl}?query=${encodeURIComponent(film.titre)}`;
}

function openTmdbForSerie(serie) {
    if (serie.tmdbId) {
        window.location.href = `${tmdbBaseUrl}/tv/${serie.tmdbId}`;
        return;
    }
    showTmdbSerieSearch(serie);
}

async function showTmdbSerieSearch(serie) {
    const modal = document.getElementById('tmdbModal');
    const title = document.getElementById('tmdbModalTitle');
    const resultsContainer = document.getElementById('tmdbResults');
    title.textContent = `Résultats TMDB pour ${serie.titre}`;
    resultsContainer.innerHTML = '<div class="tmdb-empty">Recherche en cours...</div>';
    modal.classList.remove('hidden');
    const results = await searchTmdbSerie(serie.titre);
    renderTmdbSerieResults(serie, results);
}
function renderTmdbSerieResults(serie, results) {
    const resultsContainer = document.getElementById('tmdbResults');
    resultsContainer.innerHTML = '';
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="tmdb-empty">Aucun résultat trouvé.</div>';
        return;
    }
    for (const result of results) {
        const card = document.createElement('article');
        card.className = 'tmdb-result-card';
        const imageZone = document.createElement('div');
        if (result.image) {
            const img = document.createElement('img');
            img.src = result.image;
            img.alt = result.titre;
            imageZone.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'tmdb-result-placeholder';
            placeholder.textContent = 'Sans affiche';
            imageZone.appendChild(placeholder);
        }
        const info = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'tmdb-result-title';
        title.textContent = result.titre;
        const year = document.createElement('div');
        year.className = 'tmdb-result-year';
        year.textContent = result.annee || 'Année inconnue';
        const description = document.createElement('div');
        description.className = 'tmdb-result-description';
        description.textContent = result.description || 'Aucune description disponible.';
        info.appendChild(title);
        info.appendChild(year);
        info.appendChild(description);
        const button = document.createElement('button');
        button.className = 'tmdb-associate-button';
        button.textContent = 'Associer';
        button.onclick = () => associateTmdbSerie(serie, result);
        card.appendChild(imageZone);
        card.appendChild(info);
        card.appendChild(button);
        resultsContainer.appendChild(card);
    }
}

async function associateTmdbSerie(serie, result) {
    const response = await fetch('http://localhost:9876/associate-tmdb-serie', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serieId: serie.id,
            tmdbId: result.tmdbId,
            tmdbUrl: result.tmdbUrl,
            image: result.image,
            titreTmdb: result.titre,
            anneeTmdb: result.annee,
            descriptionTmdb: result.description
        })
    });
    if (!response.ok) {
        console.error(await response.text());
        return;
    }
    serie.tmdbId = result.tmdbId;
    serie.tmdbUrl = result.tmdbUrl;
    serie.image = result.image;
    serie.titreTmdb = result.titre;
    serie.anneeTmdb = result.annee;
    serie.descriptionTmdb = result.description;
    closeTmdbModal();
    renderSeries();
}

function closeTmdbModal() {
    document.getElementById('tmdbModal').classList.add('hidden');
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

async function searchTmdbSerie(title) {

    const response = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&language=fr-FR&query=${encodeURIComponent(title)}`
    );
    const data = await response.json();

    if (!data.results) {
        console.error(data);
        return [];
    }

    return data.results.map(item => ({
        tmdbId: item.id,
        titre: item.name,
        annee: item.first_air_date
            ? item.first_air_date.substring(0, 4)
            : '',
        description: item.overview,
        image: item.poster_path
            ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
            : null,
        tmdbUrl:
            `https://www.themoviedb.org/tv/${item.id}`

    }));

}