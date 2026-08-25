function handleSearch() {
  const input = document.getElementById("searchInput");
  currentSearch = input ? input.value.trim().toLowerCase() : "";

if (
    currentPage === "collections" &&
    typeof renderCollections === "function"
  ) {
    saveSearchText();
    renderCollections();
  }
  
  if (currentPage === "films" && typeof renderFilms === "function") {
    saveFilmsViewState();
    saveSearchText();
    renderFilms();
  }
  
  if (currentPage === "series" && typeof renderSeries === "function") {
    saveSearchText();
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

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 1500);
}
