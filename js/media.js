function createPosterContent(imagePath, title, seed) {
    if (imagePath && isWebSafeImagePath(imagePath)) {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = title;
        img.onerror = () => {
            const fallback = createMissingPoster(title);
            img.replaceWith(fallback);
        };
        return img;
    }
    return createMissingPoster(title);
}
function createMissingPoster(seed) {
    const div = document.createElement('div');
    div.className = 'missing-poster';
    div.style.background = 'linear-gradient(135deg, #1b3045 0%, #20364c 30%, #233b54 60%, #284060 100%)';
    const text = document.createElement('span');
    text.textContent = seed;
    div.appendChild(text);
    return div;
}
function isWebSafeImagePath(imagePath) {
    if (!imagePath) {
        return false;
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return true;
    }
    if (imagePath.startsWith('img/') || imagePath.startsWith('./img/') || imagePath.startsWith('images/')) {
        return true;
    }
    return false;
}
