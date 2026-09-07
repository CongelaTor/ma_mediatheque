const TOOL_TYPES = ["Animation", "Anime", "Film", "Spectacle"];
const TOOL_GENRES = [
  "Action",
  "Aventure",
  "Biopic",
  "Comédie",
  "Comédie musicale",
  "Drame",
  "Espionnage",
  "Guerre",
  "Policier",
  "Science-Fiction",
];
const TMDB_IGNORE_GENRES = [
  "Animation",
  "Crime",
  "Documentaire",
  "Familial",
  "Fantastique",
  "Histoire",
  "Musique",
  "Mystère",
  "Romance",
  "Téléfilm",
  "Thriller",
  "Western",
];
const TOOL_STUDIOS = ["DC", "Disney", "Disney Classic", "Marvel", "Pixar"];

const TOOLS_FILTER_STATE_KEY = "toolsFilterState";
function loadFilterState(storageKey, defaultState) {
  return JSON.parse(
    sessionStorage.getItem(storageKey) || JSON.stringify(defaultState),
  );
}
function saveFilterState(storageKey, state) {
  sessionStorage.setItem(storageKey, JSON.stringify(state));
}

function loadSidebarState() {
  return loadFilterState("sidebarState", {
    ajoutsExpanded: true,
    genreExpanded: true,
    typeExpanded: true,
    studioExpanded: true,
  });
}

function saveSidebarState(state) {
  saveFilterState("sidebarState", state);
}

const appConstants = {
  tmdbApiKey: "7f5ccb60f02be23a0abc64fdd5070eba",
  tmdbBaseUrl: "https://www.themoviedb.org",
  tmdbSearchBaseUrl: "https://www.themoviedb.org/search",
};

window.appConstants = appConstants;

if (typeof module !== "undefined" && module.exports) {
  module.exports = appConstants;
}

function renderSidebarFilters(containerId, values, dataAttribute, allLabel) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.innerHTML =
    `<button class="sidebar-link" data-${dataAttribute}="all">${allLabel}</button>` +
    values
      .map(
        (value) =>
          `<button class="sidebar-link" data-${dataAttribute}="${value}">${value}</button>`,
      )
      .join("");
}

function renderAllSidebarFilters() {
  renderSidebarFilters("genreFilters", TOOL_GENRES, "genre", "Tous les films");

  renderSidebarFilters("typeFilters", TOOL_TYPES, "type", "Tous les types");

  renderSidebarFilters(
    "studioFilters",
    TOOL_STUDIOS,
    "studio",
    "Tous les studios",
  );
}
