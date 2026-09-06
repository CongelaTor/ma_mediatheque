let catalog = null;
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
let activeDetailTbd = true;

const tmdbBaseUrl = "https://www.themoviedb.org";
const tmdbSearchBaseUrl = "https://www.themoviedb.org/search";

let showMissingEpisodesOnly = false;

const filmsViewStateKey = "filmsViewState";
const seriesViewStateKey = "seriesViewState";

function getSearchTextKey() {
  let key;
  switch (currentPage) {
    case "collections":
      key = "searchCollections";
      break;
    case "films":
      key = "searchFilms";
      break;
    case "series":
      key = "searchSeries";
      break;
  }
  return key;
}

function saveSearchText() {
  const key = getSearchTextKey();
  if (!key) {
    return;
  }
  localStorage.setItem(
    key,
    document.getElementById("searchInput").value ?? "",
  );
}

function loadSearchText() {
  const key = getSearchTextKey();
  if (!key) {
    return "";
  }
  return localStorage.getItem(key) ?? "";
}

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
