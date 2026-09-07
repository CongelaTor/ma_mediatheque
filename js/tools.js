function renderToolButtons(values, category, fichier) {
  return values
    .map((value) => {
      let isActive = false;
      if (category === "genre" && Array.isArray(fichier.genre)) {
        isActive = fichier.genre.includes(value);
      }
      if (category === "type") {
        isActive = fichier.type === value;
      }
      if (category === "studio") {
        isActive = fichier.studio === value;
      }
      return `
            <button
                class="language-button ${isActive ? "active" : ""}"
                data-category="${category}"
                data-value="${value}"
                data-fichier="${fichier.fichier}">
                ${value}
            </button>
            `;
    })
    .join("");
}

let showFile = false;
let showType = true;
let showGenre = true;
let showStudio = true;
let applyToAll = false;

function initToolsFilters() {
  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.onclick = () => selectToolsAjouts(button.dataset.ajouts);
  });
  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.onclick = () => selectToolsGenre(button.dataset.genre);
  });
  document.querySelectorAll(".sidebar-link[data-type]").forEach((button) => {
    button.onclick = () => selectToolsType(button.dataset.type);
  });
  document.querySelectorAll(".sidebar-link[data-studio]").forEach((button) => {
    button.onclick = () => selectToolsStudio(button.dataset.studio);
  });
}

function selectToolsAjouts(ajouts) {
  currentAjouts = ajouts;
  document.querySelectorAll(".sidebar-link[data-ajouts]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-ajouts="${ajouts}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveFilmsViewState();
  renderTools();
}

function selectToolsGenre(genre) {
  currentGenre = genre;
  document.querySelectorAll(".sidebar-link[data-genre]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-genre="${genre}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveFilmsViewState();
  renderTools();
}

function selectToolsType(type) {
  currentType = type;
  document.querySelectorAll(".sidebar-link[data-type]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-type="${type}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveFilmsViewState();
  renderTools();
}

function selectToolsStudio(studio) {
  currentStudio = studio;
  document.querySelectorAll(".sidebar-link[data-studio]").forEach((button) => {
    button.classList.remove("active");
  });
  const activeButton = document.querySelector(
    `.sidebar-link[data-studio="${studio}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
  saveFilmsViewState();
  renderTools();
}

function filmMatchesAjouts(fichier) {
  if (currentAjouts === "all") {
    return true;
  }
  if (currentAjouts === "Nouveautés") {
    return !fichier.titreTmdb;
  }
  if (currentAjouts === "Récents") {
    return true;
  }
  if (currentAjouts === "Doublons") {
    return Boolean(fichier.doublonExact);
  }
  return false;
}

function filmMatchesGenre(fichier) {
  if (currentGenre === "all") {
    return true;
  }
  if (!fichier.genre) {
    return false;
  }
  if (Array.isArray(fichier.genre)) {
    return fichier.genre.includes(currentGenre);
  }
  return fichier.genre === currentGenre;
}

function filmMatchesType(fichier) {
  if (currentType === "all") {
    return true;
  }
  return fichier.type === currentType;
}

function filmMatchesStudio(fichier) {
  if (currentStudio === "all") {
    return true;
  }
  return fichier.studio === currentStudio;
}

function loadToolsFilterState() {
  return loadFilterState(TOOLS_FILTER_STATE_KEY, {
    ajoutsExpandedTools: false,
    genreExpandedTools: false,
    typeExpandedTools: false,
    studioExpandedTools: false,
    currentAjoutsTools: "all",
    currentGenreTools: "all",
    currentTypeTools: "all",
    currentStudioTools: "all",
  });
}

function saveToolsFilterState(state) {
  sessionStorage.setItem(TOOLS_FILTER_STATE_KEY, JSON.stringify(state));
}

async function initToolsPage() {
  await loadCatalog();

  const viewState = loadFilmsViewState();

  currentAjouts = viewState.ajouts || "all";
  currentGenre = viewState.genre || "all";
  currentType = viewState.type || "all";
  currentStudio = viewState.studio || "all";

  renderAllSidebarFilters();
  initToolsFilters();

  const filterState = loadToolsFilterState();
  if (!filterState.ajoutsExpanded) {
    document.getElementById("ajoutsFilters")?.classList.add("hidden");
  }
  if (!filterState.genreExpanded) {
    document.getElementById("genreFilters")?.classList.add("hidden");
  }
  if (!filterState.typeExpanded) {
    document.getElementById("typeFilters")?.classList.add("hidden");
  }
  if (!filterState.studioExpanded) {
    document.getElementById("studioFilters")?.classList.add("hidden");
  }

  document.getElementById("searchInput").oninput = () => {
    renderTools();
  };

  document.getElementById("showTypeButton").onclick = () => {
    showType = !showType;
    document
      .getElementById("showTypeButton")
      .classList.toggle("active", showType);
    renderTools();
  };

  document.getElementById("showGenreButton").onclick = () => {
    showGenre = !showGenre;
    document
      .getElementById("showGenreButton")
      .classList.toggle("active", showGenre);
    renderTools();
  };

  document.getElementById("showFileButton").onclick = () => {
    showFile = !showFile;
    document
      .getElementById("showFileButton")
      .classList.toggle("active", showFile);
    renderTools();
  };

  document.getElementById("applyToAllButton").onclick = () => {
    applyToAll = !applyToAll;
    document
      .getElementById("applyToAllButton")
      .classList.toggle("active", applyToAll);
  };

  document.getElementById("showStudioButton").onclick = () => {
    showStudio = !showStudio;
    document
      .getElementById("showStudioButton")
      .classList.toggle("active", showStudio);
    renderTools();
  };

  document.getElementById("searchInput").oninput = () => {
    renderTools();
  };

  document.getElementById("ajoutsTitle").onclick = () => {
    const filters = document.getElementById("ajoutsFilters");
    filters.classList.toggle("hidden");

    const state = loadToolsFilterState();
    state.ajoutsExpanded = !filters.classList.contains("hidden");
    saveToolsFilterState(state);
  };

  const genreTitle = document.getElementById("genreTitle");
  if (genreTitle) {
    genreTitle.onclick = () => {
      const filters = document.getElementById("genreFilters");
      filters.classList.toggle("hidden");

      const state = loadToolsFilterState();
      state.genreExpanded = !filters.classList.contains("hidden");
      saveToolsFilterState(state);
    };
  }

  const typeTitle = document.getElementById("typeTitle");
  if (typeTitle) {
    typeTitle.onclick = () => {
      const filters = document.getElementById("typeFilters");
      filters.classList.toggle("hidden");

      const state = loadToolsFilterState();
      state.typeExpanded = !filters.classList.contains("hidden");
      saveToolsFilterState(state);
    };
  }

  const studioTitle = document.getElementById("studioTitle");
  if (studioTitle) {
    studioTitle.onclick = () => {
      const filters = document.getElementById("studioFilters");
      filters.classList.toggle("hidden");

      const state = loadToolsFilterState();
      state.studioExpanded = !filters.classList.contains("hidden");
      saveToolsFilterState(state);
    };
  }
  renderTools();
}

async function saveFilmMetadata(fichier) {
  const response = await fetch("http://localhost:9876/save-film-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fichier: fichier.fichier,
      type: fichier.type || null,
      genre: fichier.genre || [],
      studio: fichier.studio || null,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

let displayedFiles = [];

function renderTools() {
  const container = document.getElementById("toolsContainer");
  let fichiers = catalog.films
    .filter((fichier) => filmMatchesAjouts(fichier))
    .filter((fichier) => filmMatchesGenre(fichier))
    .filter((fichier) => filmMatchesType(fichier))
    .filter((fichier) => filmMatchesStudio(fichier))
    .filter((fichier) => {
      const filtre = document
        .getElementById("searchInput")
        ?.value?.toLowerCase()
        ?.trim();

      if (!filtre) {
        return true;
      }

      const titre = (fichier.titreTmdb || fichier.titre || "").toLowerCase();
      const chemin = (fichier.fichier || "").toLowerCase();

      return titre.includes(filtre) || chemin.includes(filtre);
    });

  fichiers = fichiers.sort((a, b) => {
    const valeurA = showFile ? a.fichier : a.titreTmdb || a.titre;

    const valeurB = showFile ? b.fichier : b.titreTmdb || b.titre;

    return valeurA.localeCompare(valeurB, "fr");
  });

  displayedFiles = fichiers;

  setText(
    "filmsCount",
    `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""}`,
  );

  setText("filmsSubtitle", "Correction rapide");

  const titleCounts = {};

  fichiers.forEach((fichier) => {
    const titre = fichier.titreTmdb || fichier.titre;
    titleCounts[titre] = (titleCounts[titre] || 0) + 1;
  });

  let previousTitle = "";

  container.innerHTML = fichiers
    .map((fichier, index) => {
      const titre = showFile
        ? fichier.fichier
        : fichier.titreTmdb || fichier.titre;

      const nextFichier = fichiers[index + 1];

      const currentTitle = titre;
      const nextTitle = nextFichier
        ? nextFichier.titreTmdb || nextFichier.titre
        : null;

      const separatorBefore =
        titleCounts[currentTitle] > 1 && previousTitle !== currentTitle
          ? '<div class="tool-duplicate-separator"></div>'
          : "";

      const separatorAfter =
        titleCounts[currentTitle] > 1 && nextTitle !== currentTitle
          ? '<div class="tool-duplicate-separator"></div>'
          : "";

      previousTitle = currentTitle;

      return `
        ${separatorBefore}
            <div class="tool-film">
                <div class="tool-film-title">
                ${titre}
                </div>

                ${
                  showType
                    ? `
                <span class="tool-group">
                    ${renderToolButtons(TOOL_TYPES, "type", fichier)}
                </span>
                `
                    : ""
                }

                ${
                  showGenre
                    ? `
                <span class="tool-group">
                    ${renderToolButtons(TOOL_GENRES, "genre", fichier)}
                </span>
                `
                    : ""
                }

                ${
                  showStudio
                    ? `
                <span class="tool-group">
                    ${renderToolButtons(TOOL_STUDIOS, "studio", fichier)}
                </span>
                `
                    : ""
                }
            </div>
        ${separatorAfter}    
        `;
    })
    .join("");

  container
    .querySelectorAll(".language-button[data-category]")
    .forEach((button) => {
      button.onclick = async () => {
        if (applyToAll) {
          showToast(`Mise à jour de ${displayedFiles.length} fichiers...`);
        }

        const fichierPath = button.dataset.fichier;
        const fichier = catalog.films.find(
          (item) => item.fichier === fichierPath,
        );

        if (!fichier) {
          return;
        }

        const fichiersToUpdate = applyToAll ? displayedFiles : [fichier];
        const category = button.dataset.category;
        const value = button.dataset.value;
        const shouldActivate = !button.classList.contains("active");
        for (const fichierToUpdate of fichiersToUpdate) {
          if (category === "type") {
            if (!shouldActivate) {
              fichierToUpdate.type = null;
            } else {
              fichierToUpdate.type = value;
            }
          }
          if (category === "studio") {
            if (!shouldActivate) {
              fichierToUpdate.studio = null;
            } else {
              fichierToUpdate.studio = value;
            }
          }
          if (category === "genre") {
            const genres = Array.isArray(fichierToUpdate.genre)
              ? [...fichierToUpdate.genre]
              : [];
            if (!shouldActivate) {
              fichierToUpdate.genre = genres.filter((g) => g !== value);
            } else {
              if (!genres.includes(value)) {
                genres.push(value);
              }
              fichierToUpdate.genre = genres;
            }
          }
          await saveFilmMetadata(fichierToUpdate);
        }
        renderTools();
      };
    });
}
