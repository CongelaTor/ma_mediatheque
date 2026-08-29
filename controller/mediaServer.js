const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const PORT = 9876;

const VLC = "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe";
const vlcInterfacePath = path.join(
  process.env.APPDATA,
  "vlc",
  "vlc-qt-interface.ini",
);

const rootDir = path.join(__dirname, "..");
const catalogPath = path.join(rootDir, "data", "catalog.json");
const configPath = path.join(rootDir, "config", "config.json");
const ignoreWordsPath = path.join(rootDir, "config", "ignoreWords.json");

const driveMappings = {
  "01": null,
  "02": null,
};
detectDriveMappings();

function detectDriveMappings() {
  const driveLetters =
    process.platform === "linux"
      ? ["/run/user/1000/gvfs"]
      : [
          "Z:",
          "Y:",
          "X:",
          "W:",
          "V:",
          "U:",
          "T:",
          "S:",
          "R:",
          "Q:",
          "P:",
          "O:",
          "N:",
          "M:",
          "L:",
          "K:",
          "J:",
          "I:",
          "H:",
          "G:",
          "F:",
          "E:",
          "D:",
        ];

  for (const drive of driveLetters) {
    console.log("test", drive);
    if (!driveMappings["01"] && fs.existsSync(`${drive}\\01_Films`)) {
      driveMappings["01"] = drive;
    }

    if (!driveMappings["02"] && fs.existsSync(`${drive}\\02_Films`)) {
      driveMappings["02"] = drive;
    }

    if (driveMappings["01"] && driveMappings["02"]) {
      break;
    }
  }
}

function resolvePhysicalPath(catalogFile) {
  if (!catalogFile) {
    return null;
  }

  if (catalogFile.startsWith("/01_")) {
    return `${driveMappings["01"]}${catalogFile.replaceAll("/", "\\")}`;
  }

  if (catalogFile.startsWith("/02_")) {
    return `${driveMappings["02"]}${catalogFile.replaceAll("/", "\\")}`;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  for (const source of config.sources) {
    if (!source.paths) {
      continue;
    }
    for (const rootPath of source.paths) {
      const normalizedRoot = rootPath.replaceAll("\\", "/");
      const rootName = normalizedRoot.split("/").pop();

      console.log("catalogFile =", catalogFile);
      console.log("rootName =", rootName);

      if (catalogFile === "/01_reprise_vlc.json" && rootName === "01_Films") {
        const resolved = `${normalizedRoot}/../01_reprise_vlc.json`;
        console.log("resolved =", resolved);
        return resolved;
      }

      if (catalogFile.startsWith(`/${rootName}/`)) {
        const resolved = catalogFile.replace(`/${rootName}`, normalizedRoot);
        console.log("resolved =", resolved);
        return resolved;
      }
    }
  }

  return catalogFile;
}

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
        if (request.url === "/delete-film-file") {
          deleteFilmFile(data, response);
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

        if (request.url === "/resume-playback") {
          resumePlayback(data, response);
          return;
        }

        if (request.url === "/update-resume-playback") {
          updateResumePlayback(data, response);
          return;
        }

        if (request.url === "/sync-resume-playback") {
          syncResumePlayback(data, response);
          return;
        }

        if (request.url === "/get-resume-playback") {
          getResumePlayback(data, response);
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
  console.log("Début launcVlc");
  const physicalPath = resolvePhysicalPath(data.fichier);

  console.log("CATALOG =", data.fichier);
  console.log("PHYSICAL =", physicalPath);
  console.log("physicalPath =", physicalPath);
  execFile(VLC, [physicalPath.replaceAll("/", "\\")], (error) => {
    if (error) {
      console.error(error);
    }
  });
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("OK");
}

function readVlcRecents() {
  if (!fs.existsSync(vlcInterfacePath)) {
    return null;
  }
  const content = fs.readFileSync(vlcInterfacePath, "utf8");
  const listMatch = content.match(/list=(.*)/);
  const timesMatch = content.match(/times=(.*)/);
  if (!listMatch || !timesMatch) {
    return null;
  }
  const files = listMatch[1].split(", ");
  const times = timesMatch[1].split(", ");
  return {
    files,
    times,
  };
}

console.log("vlcInterfacePath =", vlcInterfacePath);
const recents = readVlcRecents();

function getLatestVlcPlayback() {
  const recents = readVlcRecents();
  if (!recents?.files?.[0]) {
    return null;
  }
  return {
    physicalPath: decodeURIComponent(
      recents.files[0].replace(/^file:\/\/\//, ""),
    ),
    positionSeconds: Math.max(0, Math.floor(Number(recents.times[0]) / 1000)),
  };
}

function getResumePlayback(data, response) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const resumeSource = config.sources.find(
    (source) => source.type === "reprise_vlc",
  );
  const resumeFile = resolvePhysicalPath(resumeSource.path);
  const resumeData = fs.existsSync(resumeFile)
    ? JSON.parse(fs.readFileSync(resumeFile, "utf8"))
    : {};
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(resumeData));
}
function syncResumePlayback(data, response) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const resumeSource = config.sources.find(
    (source) => source.type === "reprise_vlc",
  );
  const resumeFile = resolvePhysicalPath(resumeSource.path);
  const resumeData = fs.existsSync(resumeFile)
    ? JSON.parse(fs.readFileSync(resumeFile, "utf8"))
    : {};
  const latestPlayback = getLatestVlcPlayback();
  if (!latestPlayback) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Aucune lecture VLC trouvée");
    return;
  }
  const catalogPath = latestPlayback.physicalPath
    .replace(/^[A-Za-z]:/, "")
    .replaceAll("\\", "/");
  resumeData[data.type] = {
    ...(resumeData[data.type] || {}),
    catalogPath: catalogPath,
    positionSeconds: latestPlayback.positionSeconds,
    lastUpdate: new Date().toISOString(),
    pcName: require("os").hostname(),
  };
  fs.writeFileSync(resumeFile, JSON.stringify(resumeData, null, 2), "utf8");
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Synchronisation OK");
}
function updateResumePlayback(data, response) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const resumeSource = config.sources.find(
    (source) => source.type === "reprise_vlc",
  );
  const resumeFile = resolvePhysicalPath(resumeSource.path);
  const resumeData = fs.existsSync(resumeFile)
    ? JSON.parse(fs.readFileSync(resumeFile, "utf8"))
    : {};

  const latestPlayback = getLatestVlcPlayback();
  resumeData[data.type] = {
    catalogPath: data.catalogPath,
    positionSeconds: latestPlayback?.positionSeconds || 0,
    durationSeconds: 0,
    lastUpdate: new Date().toISOString(),
    pcName: require("os").hostname(),
  };

  fs.writeFileSync(resumeFile, JSON.stringify(resumeData, null, 2), "utf8");

  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  response.end("Resume playback mis à jour");
}
function resumePlayback(data, response) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const resumeSource = config.sources.find(
    (source) => source.type === "reprise_vlc",
  );

  if (!resumeSource?.path) {
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Chemin de reprise_vlc.json non configuré");
    return;
  }

  const resumeFile = resolvePhysicalPath(resumeSource.path).replaceAll(
    "/",
    "\\",
  );
  const resumeData = JSON.parse(fs.readFileSync(resumeFile, "utf8"));
  const resume = resumeData[data.type];
  if (!resume?.catalogPath) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Aucune reprise disponible");
    return;
  }

  const resolvedPath = resolvePhysicalPath(resume.catalogPath);
  const physicalPath = resolvedPath.replaceAll("/", "\\");
  const positionSeconds = Number(resume.positionSeconds) || 0;

  execFile(VLC, [`--start-time=${positionSeconds}`, physicalPath], (error) => {
    if (error) {
      console.error(error);
    }
  });
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Lecture reprise");
}

function openFileLocation(data, response) {
  if (!data.fichier) {
    response.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Fichier non renseigné");
    return;
  }
  const physicalPath = resolvePhysicalPath(data.fichier).replaceAll("/", "\\");

  execFile("explorer.exe", [physicalPath], (error) => {
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
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const fichiers = data.fichiers ?? [data.fichier];
  for (const fichier of fichiers) {
    const film = catalog.films.find((item) => item.fichier === fichier);

    if (!film) {
      continue;
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
    film.collectionDescription = data.collectionDescription;
    film.collectionImage = data.collectionImage;
    film.collectionTmdbUrl = data.collectionTmdbUrl;
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), "utf8");
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("Association TMDB enregistrée");
}

function deleteFilmFile(data, response) {
  try {
    const physicalPath = resolvePhysicalPath(data.fichier).replaceAll(
      "/",
      "\\",
    );

    if (!physicalPath || !fs.existsSync(physicalPath)) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("Fichier introuvable");
      return;
    }

    fs.unlinkSync(physicalPath);

    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    catalog.films = catalog.films.filter(
      (film) => film.fichier !== data.fichier,
    );

    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), "utf8");

    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Fichier supprimé");
  } catch (error) {
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(error.message);
  }
}

function refreshCatalog(type, response) {
  const scriptPath = path.join(rootDir, "controller", "generateCatalog.js");
  execFile(
    process.execPath,
    [scriptPath, type],
    { cwd: rootDir },
    (error, stdout, stderr) => {
      if (error) console.log("ERROR : ", error);
      if (stdout?.trim()) {
        console.log(stdout);
      }
      if (stderr?.trim()) {
        console.log("STDERR : ");
        console.log(stderr);
      }
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
