let catalog = null;
const tmdbApiKey = "7f5ccb60f02be23a0abc64fdd5070eba";
let currentPage = "home";
let currentSerie = null;
let currentSeason = null;
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
