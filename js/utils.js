function handleSearch() {
  const input = document.getElementById("searchInput");
  currentSearch = input ? input.value.trim().toLowerCase() : "";
  if (currentPage === "films" && typeof renderFilms === "function") {
    renderFilms();
  }
  if (currentPage === "series" && typeof renderSeries === "function") {
    renderSeries();
  }
}
function matchesSearch(value) {
  if (!currentSearch) {
    return true;
  }
  return value.toLowerCase().includes(currentSearch);
}
function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}
function formatNumber(value) {
  return String(value).padStart(2, "0");
}
function hashCode(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function formatFrenchDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
