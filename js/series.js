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
    sessionStorage.setItem('maMediatheque.activeSeriesLanguages', JSON.stringify([...activeSeriesLanguages]));
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
    let hasLanguage = false;

    for (const saison of serie.saisons) {
        for (const episode of saison.episodes) {

            if (!episode.langue) {
                continue;
            }

            hasLanguage = true;

            if (activeSeriesLanguages.has(episode.langue)) {
                return true;
            }
        }
    }

    return !hasLanguage;
}
function renderSeries() {
    currentPage = 'series';
    currentSerie = null;
    currentSeason = null;
    activeDetailLanguage = null;
    updateLanguageButtons();
    const grid = document.getElementById('seriesGrid');
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
        if (!serie.tmdbId) {
            showTmdbSerieSearch(serie);
            return;
        }
        window.location.href =
            `episodes.html?id=${encodeURIComponent(serie.id)}`;
    };
    posterZone.appendChild(
        createPosterContent(
            serie.image,
            serie.titre,
            serie.id
        )
    );
    if (serie.hasMissingEpisodes) {
        const missingDot = document.createElement('span');
        missingDot.className = 'serie-missing-dot';
        posterZone.appendChild(missingDot);
    }
    card.appendChild(posterZone);
    return card;
}