let catalog = null;
const tmdbApiKey = "7f5ccb60f02be23a0abc64fdd5070eba";
let currentPage = "home";
let currentSerie = null;
let currentSeason = null;
let currentAjouts = "all";
let currentGenre = "all";
let currentSearch = "";
const languageOrder = ["VO", "VF", "VOST", "VOSTFR", "TBD"];
const savedSeriesLanguages = sessionStorage.getItem(
  "maMediatheque.activeSeriesLanguages",
);
let activeSeriesLanguages = savedSeriesLanguages
  ? new Set(JSON.parse(savedSeriesLanguages))
  : new Set(languageOrder);
let activeDetailLanguage = null;

const tmdbBaseUrl = "https://www.themoviedb.org";
const tmdbSearchBaseUrl = "https://www.themoviedb.org/search";

let showMissingEpisodesOnly = false;

const filmsViewStateKey = "filmsViewState";
const seriesViewStateKey = "seriesViewState";
const searchTextKey = "searchText";

function saveFilmsViewState() {
  const state = {
    ajouts: currentAjouts,
    genre: currentGenre,
    languages: [...document.querySelectorAll(".language-button.active")].map(
      (button) => button.dataset.language,
    ),
  };

  localStorage.setItem(filmsViewStateKey, JSON.stringify(state));
}

function loadFilmsViewState() {
  return JSON.parse(localStorage.getItem(filmsViewStateKey) ?? "{}");
}

function saveSeriesViewState() {
  const state = {
    languages: [...activeSeriesLanguages],
  };

  localStorage.setItem(seriesViewStateKey, JSON.stringify(state));
}

function loadSeriesViewState() {
  return JSON.parse(localStorage.getItem(seriesViewStateKey) ?? "{}");
}

function saveSearchText() {
  localStorage.setItem(
    searchTextKey,
    document.getElementById("searchInput")?.value ?? "",
  );
}

function loadSearchText() {
  return localStorage.getItem(searchTextKey) ?? "";
}
