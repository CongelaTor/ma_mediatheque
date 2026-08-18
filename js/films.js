function initFilmFilters() {
    document.querySelectorAll('.sidebar-link[data-genre]').forEach(button => {
        button.onclick = () => selectGenre(button.dataset.genre);
    });
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
    currentPage = 'films';
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
    card.appendChild(posterZone);
    return card;
}
