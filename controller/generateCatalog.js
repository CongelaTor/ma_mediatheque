const fs = require('fs');
const path = require('path');

console.log('=== Ma vidéothèque ===');

const rootDir = path.join(__dirname, '..');

const configPath = path.join(rootDir, 'config', 'config.json');
const ignoreWordsPath = path.join(rootDir, 'config', 'ignoreWords.json');
const catalogPath = path.join(rootDir, 'data', 'catalog.json');

const config = readJson(configPath);
const ignoreWordsConfig = readJson(ignoreWordsPath);
const catalog = readJson(catalogPath);

normalizeIgnoreWordsConfig(ignoreWordsConfig);
writeJson(ignoreWordsPath, ignoreWordsConfig);

let totalVideos = 0;
let totalNewFilms = 0;
let totalNewEpisodes = 0;

for (const source of config.sources) {

    console.log('');
    console.log(`Scan de : ${source.path}`);

    if (!fs.existsSync(source.path)) {
        console.log(`Dossier introuvable : ${source.path}`);
        continue;
    }

    const fichiers = scanDirectory(source.path, config.extensions);

    console.log(`${fichiers.length} vidéo(s) trouvée(s)`);

    totalVideos += fichiers.length;

    for (const fichier of fichiers) {

        const analyse = analyzeVideoFile(fichier, source);

        if (analyse.type === 'film') {

            const added = addFilmIfNew(catalog, analyse);

            if (added) {
                totalNewFilms++;
            }

        } else if (analyse.type === 'serie') {

            const added = addEpisodeIfNew(catalog, analyse);

            if (added) {
                totalNewEpisodes++;
            }

        }

    }

}

catalog.dateDernierScan = new Date().toISOString();

writeJson(catalogPath, catalog);

console.log('');
console.log('Résumé :');
console.log(`Vidéos analysées : ${totalVideos}`);
console.log(`Nouveaux films ajoutés : ${totalNewFilms}`);
console.log(`Nouveaux épisodes ajoutés : ${totalNewEpisodes}`);
console.log(`Films au catalogue : ${catalog.films.length}`);
console.log(`Séries au catalogue : ${catalog.series.length}`);
console.log('');
console.log('catalog.json mis à jour.');

function readJson(filePath) {

    return JSON.parse(
        fs.readFileSync(filePath, 'utf8')
    );

}

function writeJson(filePath, data) {

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4),
        'utf8'
    );

}

function normalizeIgnoreWordsConfig(ignoreWordsConfig) {

    ignoreWordsConfig.ignoreWords = normalizeList(ignoreWordsConfig.ignoreWords);
    ignoreWordsConfig.patterns = normalizeList(ignoreWordsConfig.patterns);

}

function normalizeList(list) {

    return [...new Set(
        list
            .map(item => item.toUpperCase().trim())
            .filter(item => item.length > 0)
    )].sort();

}

function scanDirectory(directory, extensions, results = []) {

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {

        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {

            scanDirectory(fullPath, extensions, results);

        } else {

            const extension = path.extname(entry.name).toLowerCase();

            if (extensions.includes(extension)) {

                results.push({
                    fichier: fullPath,
                    nom: entry.name,
                    taille: fs.statSync(fullPath).size
                });

            }

        }

    }

    return results;

}

function analyzeVideoFile(fichier, source) {

    const nomSansExtension = path.parse(fichier.nom).name;

    const episodeInfo = detectEpisode(nomSansExtension);
    const annee = detectYear(nomSansExtension);

    let titreBrut = nomSansExtension;

    if (source.type === 'serie' && episodeInfo) {

        titreBrut = nomSansExtension.substring(0, episodeInfo.index);

    } else if (source.type === 'film' && annee) {

        titreBrut = nomSansExtension.substring(0, nomSansExtension.indexOf(annee));

    }

    const titre = cleanTitle(titreBrut);

    return {
        type: source.type,
        id: buildId(titre, annee),
        titre: titre,
        annee: annee,
        saison: episodeInfo ? episodeInfo.saison : null,
        episode: episodeInfo ? episodeInfo.episode : null,
        nomFichier: fichier.nom,
        fichier: fichier.fichier,
        taille: fichier.taille,
        image: findAssociatedImage(fichier.fichier)
    };

}

function detectYear(value) {

    const matchAnnee = value.match(/\b(19|20)\d{2}\b/);

    if (!matchAnnee) {
        return null;
    }

    return parseInt(matchAnnee[0], 10);

}

function detectEpisode(value) {

    const matchSxxExx = value.match(/S(\d{2})E(\d{2})/i);

    if (matchSxxExx) {

        return {
            pattern: matchSxxExx[0],
            index: matchSxxExx.index,
            saison: parseInt(matchSxxExx[1], 10),
            episode: parseInt(matchSxxExx[2], 10)
        };

    }

    const matchX = value.match(/(\d)x(\d{2})/i);

    if (matchX) {

        return {
            pattern: matchX[0],
            index: matchX.index,
            saison: parseInt(matchX[1], 10),
            episode: parseInt(matchX[2], 10)
        };

    }

    return null;

}

function cleanTitle(value) {

    const words = cleanSeparators(value)
        .split(' ')
        .filter(word => word.trim().length > 0);

    const cleanedWords = [];

    for (const word of words) {

        const upperWord = word.toUpperCase();

        if (ignoreWordsConfig.ignoreWords.includes(upperWord)) {
            continue;
        }

        if (wordMatchesPattern(upperWord, ignoreWordsConfig.patterns)) {
            continue;
        }

        cleanedWords.push(word);

    }

    return cleanedWords.join(' ').trim();

}

function cleanSeparators(value) {

    return value
        .replace(/[._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

}

function wordMatchesPattern(word, patterns) {

    for (const pattern of patterns) {

        const regex = patternToRegex(pattern);

        if (regex.test(word)) {
            return true;
        }

    }

    return false;

}

function patternToRegex(pattern) {

    const escapedPattern = pattern
        .replace(/[.*+^${}()|[\]\\]/g, '\\$&')
        .replace(/\?/g, '.');

    return new RegExp(`^${escapedPattern}$`, 'i');

}

function buildId(titre, annee) {

    let base = removeAccents(titre)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (annee) {
        base += '_' + annee;
    }

    return base;

}

function removeAccents(value) {

    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

}

function findAssociatedImage(videoPath) {

    const directory = path.dirname(videoPath);
    const baseName = path.parse(videoPath).name;

    for (const extension of config.imageExtensions) {

        const imagePath = path.join(directory, baseName + extension);

        if (fs.existsSync(imagePath)) {
            return imagePath;
        }

    }

    return null;

}

function addFilmIfNew(catalog, analyse) {

    const existingByFile = catalog.films.find(
        film => samePath(film.fichier, analyse.fichier)
    );

    if (existingByFile) {
        return false;
    }

    const duplicateInfo = detectFilmDuplicate(catalog, analyse);

    catalog.films.push({
        id: analyse.id,
        titre: analyse.titre,
        annee: analyse.annee,
        genre: null,
        fichier: analyse.fichier,
        nomFichier: analyse.nomFichier,
        taille: analyse.taille,
        image: analyse.image,
        imdbId: null,
        doublonExact: duplicateInfo.doublonExact,
        doublonProbable: duplicateInfo.doublonProbable,
        groupeDoublon: duplicateInfo.groupeDoublon,
        dateAjout: new Date().toISOString()
    });

    return true;

}

function addEpisodeIfNew(catalog, analyse) {

    if (!analyse.saison || !analyse.episode) {
        return false;
    }

    let serie = catalog.series.find(
        serie => normalizeKey(serie.titre) === normalizeKey(analyse.titre)
    );

    if (!serie) {

        serie = {
            id: buildId(analyse.titre, null),
            titre: analyse.titre,
            image: null,
            imdbId: null,
            saisons: [],
            dateAjout: new Date().toISOString()
        };

        catalog.series.push(serie);

    }

    let saison = serie.saisons.find(
        saison => saison.numero === analyse.saison
    );

    if (!saison) {

        saison = {
            numero: analyse.saison,
            episodes: []
        };

        serie.saisons.push(saison);

    }

    const existingByFile = saison.episodes.find(
        episode => samePath(episode.fichier, analyse.fichier)
    );

    if (existingByFile) {
        return false;
    }

    const duplicateInfo = detectEpisodeDuplicate(serie, analyse);

    saison.episodes.push({
        numero: analyse.episode,
        fichier: analyse.fichier,
        nomFichier: analyse.nomFichier,
        taille: analyse.taille,
        doublonExact: duplicateInfo.doublonExact,
        doublonProbable: duplicateInfo.doublonProbable,
        dateAjout: new Date().toISOString()
    });

    sortCatalog(catalog);

    return true;

}

function detectFilmDuplicate(catalog, analyse) {

    let doublonExact = false;
    let doublonProbable = false;

    for (const film of catalog.films) {

        const sameFileName = film.nomFichier &&
            film.nomFichier.toLowerCase() === analyse.nomFichier.toLowerCase();

        const sameSize = film.taille === analyse.taille;

        const sameTitle = normalizeKey(film.titre) === normalizeKey(analyse.titre);

        const sameYear =
            film.annee === analyse.annee ||
            film.annee === null ||
            analyse.annee === null;

        if (sameFileName && sameSize) {
            doublonExact = true;
        }

        if (sameTitle && sameYear) {
            doublonProbable = true;
        }

    }

    return {
        doublonExact: doublonExact,
        doublonProbable: doublonProbable,
        groupeDoublon: doublonProbable ? normalizeKey(analyse.titre) : null
    };

}

function detectEpisodeDuplicate(serie, analyse) {

    let doublonExact = false;
    let doublonProbable = false;

    for (const saison of serie.saisons) {

        for (const episode of saison.episodes) {

            const sameFileName = episode.nomFichier &&
                episode.nomFichier.toLowerCase() === analyse.nomFichier.toLowerCase();

            const sameSize = episode.taille === analyse.taille;

            const sameEpisode =
                saison.numero === analyse.saison &&
                episode.numero === analyse.episode;

            if (sameFileName && sameSize) {
                doublonExact = true;
            }

            if (sameEpisode) {
                doublonProbable = true;
            }

        }

    }

    return {
        doublonExact: doublonExact,
        doublonProbable: doublonProbable
    };

}

function sortCatalog(catalog) {

    catalog.films.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

    catalog.series.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

    for (const serie of catalog.series) {

        serie.saisons.sort((a, b) => a.numero - b.numero);

        for (const saison of serie.saisons) {
            saison.episodes.sort((a, b) => a.numero - b.numero);
        }

    }

}

function normalizeKey(value) {

    return removeAccents(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

}

function samePath(path1, path2) {

    return path.normalize(path1).toLowerCase() === path.normalize(path2).toLowerCase();

}