async function initSerieDetailPage() {
    currentPage = 'episodes';
    await loadCatalog();
    initializeLanguageFilters();
    updateStats();
    updateResumeButtons();
    const serieId = new URLSearchParams(window.location.search).get('id');
    const serie = catalog.series.find(item => item.id === serieId);
    if (!serie) {
        setText('seriesTitle', 'Série introuvable');
        setText('seriesCount', '0 épisode');
        return;
    }
    showSerieDetails(serie);
}
function showSerieDetails(serie, requestedSeasonNumber = null) {
    currentSerie = serie;
    const serieLanguages = getSerieLanguages(serie);
    if (activeSeriesLanguages.size === 1) {
        const selectedLanguage = [...activeSeriesLanguages][0];
        if (serieLanguages.includes(selectedLanguage)) {
            activeDetailLanguage = selectedLanguage;
        }
    }
    window.scrollTo(0, 0);
    setText('seriesTitle', serie.titre);
    renderSerieInfoCard(serie);
    const backButton = document.getElementById('backToSeriesButton');
    if (backButton) {
        backButton.classList.remove('hidden');
    }
    const episodesPanel = document.getElementById('episodesPanel');
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

function renderSerieInfoCard(serie) {
    const card = document.getElementById('serieInfoCard');
    if (!card) {
        return;
    }
    const imageZone = card.querySelector('.serie-info-image');
    imageZone.innerHTML = '';
    imageZone.appendChild(createPosterContent(serie.image, serie.titre, serie.id));
    setText('serieInfoTitle', serie.titreTmdb || serie.titre);
    setText('serieInfoYear', serie.anneeTmdb || '');
    setText('serieInfoDescription', serie.descriptionTmdb || 'Aucune description disponible.');
    const button = document.getElementById('serieTmdbButton');
    if (serie.tmdbId) {
        button.textContent = 'TMDB';
        button.onclick = () => {
            window.location.href = `${tmdbBaseUrl}/tv/${serie.tmdbId}`;
        };
    } else {
        button.textContent = 'Associer TMDB';
        button.onclick = () => {
            showTmdbSerieSearch(serie);
        };
    }
    card.classList.remove('hidden');
}

function createEpisodeCard(serie, saison, episode) {
    const card = document.createElement('article');
    card.className = 'media-card';
    const posterZone = document.createElement('div');
    posterZone.className = 'poster-zone';
    posterZone.onclick = () => openTmdbForSerie(serie);
    posterZone.appendChild(createMissingPoster(`Épisode ${episode.numero}`));
    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    playButton.innerHTML = '<span class="play-icon">▶</span>';
    playButton.onclick = event => {
        event.stopPropagation();
        playEpisode(serie, saison, episode);
    };
    posterZone.appendChild(playButton);
    card.appendChild(posterZone);
    return card;
}
