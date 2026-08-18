function openTmdbForFilm(film) {
    if (film.tmdbId) {
        window.location.href = `${tmdbBaseUrl}/movie/${film.tmdbId}`;
        return;
    }
    window.location.href = `${tmdbSearchBaseUrl}?query=${encodeURIComponent(film.titre)}`;
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
    modal.onclick = event => {
        if (event.target === modal) {
            closeTmdbModal();
        }
    };
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
        const title = document.createElement('a');
        title.className = 'tmdb-result-title tmdb-result-link';
        title.textContent = result.titre;
        title.href = result.tmdbUrl;
        title.target = '_self';
        title.rel = 'noopener noreferrer';
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
    if (currentPage === 'episodes' && typeof showSerieDetails === 'function') {
        showSerieDetails(serie, currentSeason);
        return;
    }
    if (typeof renderSeries === 'function') {
        const currentScrollY = window.scrollY;
        renderSeries();
        setTimeout(() => {
            window.scrollTo(0, currentScrollY);
        }, 0);
    }
}
function closeTmdbModal() {
    document.getElementById('tmdbModal').classList.add('hidden');
}
async function searchTmdbSerie(title) {
    const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&language=fr-FR&query=${encodeURIComponent(title)}`);
    const data = await response.json();
    if (!data.results) {
        console.error(data);
        return [];
    }
    return data.results.map(item => ({
        tmdbId: item.id,
        titre: item.name,
        annee: item.first_air_date ? item.first_air_date.substring(0, 4) : '',
        description: item.overview,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
        tmdbUrl: `https://www.themoviedb.org/tv/${item.id}`
    }));
}

document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {

        const modal =
            document.getElementById('tmdbModal');

        if (!modal.classList.contains('hidden')) {
            closeTmdbModal();
        }

    }

});