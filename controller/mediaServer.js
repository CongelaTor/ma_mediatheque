const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const PORT = 9876;
const VLC = "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
const rootDir = path.join(__dirname, "..");
const catalogPath = path.join(rootDir, "data", "catalog.json");
const ignoreWordsPath = path.join(rootDir, "config", "ignoreWords.json");

http
  .createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (request.method === "OPTIONS") {
      response.writeHead(200);
      response.end();
      return;
    }
    if (request.method !== "POST") {
      response.writeHead(404);
      response.end();
      return;
    }
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        if (request.url === "/associate-tmdb-film") {
          saveFilmTmdbData(data, response);
          return;
        }
        if (request.url === "/associate-tmdb-serie") {
          saveSerieTmdbData(data, response);
          return;
        }
        if (request.url === "/save-missing-episode-flags") {
          saveMissingEpisodeFlags(data, response);
          return;
        }
        if (request.url === "/refresh-catalog") {
          refreshCatalog(data.type || "all", response);
          return;
        }
        if (request.url === "/get-ignore-words") {
          getIgnoreWords(response);
          return;
        }
        if (request.url === "/set-ignore-word") {
          setIgnoreWord(data, response);
          return;
        }
        if (request.url === "/open-file-location") {
          openFileLocation(data, response);
          return;
        }

        launchVlc(data, response);
      } catch (error) {
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(error.message);
      }
    });
  })
  .listen(PORT, () => {
    console.log(`MediaServer actif sur http://localhost:${PORT}`);
  });

function launchVlc(data, response) {
  execFile(VLC, [data.fichier], (error) => {
    if (error) {
      console.error(error);
    }
  });
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("OK");
}

function openFileLocation(data, response) {
  if (!data.fichier) {
    response.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
    });

    response.end("Fichier non renseigné");
    return;
  }

  execFile("explorer.exe", [data.fichier], (error) => {
    if (error) {
      console.error(error);
    }
  });

  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  response.end("Emplacement ouvert");
}

function saveSerieTmdbData(data, response) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const serie = catalog.series.find((item) => item.id === data.serieId);
  if (!serie) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Série introuvable dans catalog.json");
    return;
  }
  serie.tmdbId = data.tmdbId;
  serie.tmdbUrl = data.tmdbUrl;
  serie.image = data.image;
  serie.titreTmdb = data.titreTmdb;
  serie.anneeTmdb = data.anneeTmdb;
  serie.descriptionTmdb = data.descriptionTmdb;
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), "utf8");
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Association TMDB enregistrée");
}

function saveFilmTmdbData(data, response) {
  console.log("saveFilmTmdbData");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  console.log("data.fichier =", data.fichier);
  const film = catalog.films.find((item) => item.fichier === data.fichier);
  console.log(
    catalog.films.filter(
      (item) => item.fichier && item.fichier.includes("Age.Of.Ultron"),
    ),
  );
  if (!film) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Film introuvable dans catalog.json");
    return;
  }

  film.tmdbId = data.tmdbId;
  film.tmdbUrl = data.tmdbUrl;
  film.image = data.image;
  film.titreTmdb = data.titreTmdb;
  film.anneeTmdb = data.anneeTmdb;
  film.dureeTmdb = data.dureeTmdb;
  film.descriptionTmdb = data.descriptionTmdb;
  film.genre = data.genre;
  film.collectionId = data.collectionId;
  film.collectionNom = data.collectionNom;
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), "utf8");

  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  response.end("Association TMDB enregistrée");
}

function refreshCatalog(type, response) {
  console.log("REFRESH CATALOG");
  const scriptPath = path.join(rootDir, "controller", "generateCatalog.js");
  console.log(scriptPath);
  console.log("SCAN TYPE =", type);
  execFile(
    process.execPath,
    [scriptPath, type],
    { cwd: rootDir },
    (error, stdout, stderr) => {
      console.log("FIN EXECFILE");
      console.log("ERROR =", error);
      console.log("STDOUT =");
      console.log(stdout);
      console.log("STDERR =");
      console.log(stderr);
      if (error) {
        response.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(stderr || error.message);
        return;
      }
      response.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(stdout || "Catalogue synchronisé");
    },
  );
}

function saveMissingEpisodeFlags(data, response) {
  console.log("SAVE MISSING EPISODES");
  console.log(data);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const serie = catalog.series.find((item) => item.id === data.serieId);
  if (!serie) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Série introuvable dans catalog.json");
    return;
  }
  let serieHasMissingEpisodes = false;
  for (const saison of serie.saisons) {
    const hasMissingEpisodes = data.missingSeasonNumbers.includes(
      saison.numero,
    );
    saison.hasMissingEpisodes = hasMissingEpisodes;
    if (hasMissingEpisodes) {
      serieHasMissingEpisodes = true;
    }
  }
  serie.hasMissingEpisodes = serieHasMissingEpisodes;
  console.log(JSON.stringify(serie, null, 4));
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), "utf8");
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Indicateurs épisodes manquants enregistrés");
}
function getIgnoreWords(response) {
  const config = JSON.parse(fs.readFileSync(ignoreWordsPath, "utf8"));

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });

  response.end(JSON.stringify(config.ignoreWords || []));
}

function setIgnoreWord(data, response) {
  const config = JSON.parse(fs.readFileSync(ignoreWordsPath, "utf8"));
  const word = String(data.word || "")
    .trim()
    .toUpperCase();
  const ignoreWords = config.ignoreWords || [];

  if (!word) {
    response.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Mot invalide");
    return;
  }

  const existingIndex = ignoreWords.findIndex(
    (item) => item.toUpperCase() === word,
  );

  if (data.ignored && existingIndex === -1) {
    ignoreWords.push(word);
  }

  if (!data.ignored && existingIndex !== -1) {
    ignoreWords.splice(existingIndex, 1);
  }

  config.ignoreWords = ignoreWords.sort((a, b) => a.localeCompare(b, "fr"));

  fs.writeFileSync(ignoreWordsPath, JSON.stringify(config, null, 4), "utf8");

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });

  response.end(JSON.stringify(config.ignoreWords));
}
