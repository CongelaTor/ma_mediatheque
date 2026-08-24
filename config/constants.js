const appConstants = {
  tmdbApiKey: "7f5ccb60f02be23a0abc64fdd5070eba",
  tmdbBaseUrl: "https://www.themoviedb.org",
  tmdbSearchBaseUrl: "https://www.themoviedb.org/search",
};

window.appConstants = appConstants;

if (typeof module !== "undefined" && module.exports) {
  module.exports = appConstants;
}
