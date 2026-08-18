const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const PORT = 9876;
const VLC = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
const rootDir = path.join(__dirname, '..');
const catalogPath = path.join(rootDir, 'data', 'catalog.json');

http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }
    if (request.method !== 'POST') {
        response.writeHead(404);
        response.end();
        return;
    }
    let body = '';
    request.on('data', chunk => {
        body += chunk;
    });
    request.on('end', () => {
        try {
            const data = JSON.parse(body || '{}');
            if (request.url === '/associate-tmdb-serie') {
                saveSerieTmdbData(data, response);
                return;
            }
            if (request.url === '/refresh-catalog') {
                refreshCatalog(response);
                return;
            }
            launchVlc(data, response);
        } catch (error) {
            response.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            response.end(error.message);
        }
    });
}).listen(PORT, () => {
    console.log(`MediaServer actif sur http://localhost:${PORT}`);
});
function launchVlc(data, response) {
    execFile(VLC, [data.fichier], error => {
        if (error) {
            console.error(error);
        }
    });
    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('OK');
}
function saveSerieTmdbData(data, response) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const serie = catalog.series.find(item => item.id === data.serieId);
    if (!serie) {
        response.writeHead(404, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('Série introuvable dans catalog.json');
        return;
    }
    serie.tmdbId = data.tmdbId;
    serie.tmdbUrl = data.tmdbUrl;
    serie.image = data.image;
    serie.titreTmdb = data.titreTmdb;
    serie.anneeTmdb = data.anneeTmdb;
    serie.descriptionTmdb = data.descriptionTmdb;
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 4), 'utf8');
    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end('Association TMDB enregistrée');
}

function refreshCatalog(response) {
    console.log('REFRESH CATALOG');
    const scriptPath =
        path.join(rootDir, 'controller', 'generateCatalog.js');
    console.log(scriptPath);
    execFile(
        process.execPath,
        [scriptPath],
        { cwd: rootDir },
        (error, stdout, stderr) => {
            console.log('FIN EXECFILE');
            console.log('ERROR =', error);
            console.log('STDOUT =');
            console.log(stdout);
            console.log('STDERR =');
            console.log(stderr);
            if (error) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
                response.end(stderr || error.message);
                return;
            }
            response.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            response.end(stdout || 'Catalogue synchronisé');
        }
    );
}