const http = require('http');
const { execFile } = require('child_process');

const PORT = 9876;

const VLC =
    'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';

http.createServer((request, response) => {

    response.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    response.setHeader(
        'Access-Control-Allow-Headers',
        '*'
    );

    response.setHeader(
        'Access-Control-Allow-Methods',
        'POST, OPTIONS'
    );

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

        const data = JSON.parse(body);
        console.log(data);
        execFile(
            VLC,
            [data.fichier],
            error => {

                if (error) {
                    console.error(error);
                }

            }
        );

        response.writeHead(200);
        response.end('OK');

    });

}).listen(PORT, () => {

    console.log(
        `VLC Launcher actif sur http://localhost:${PORT}`
    );

});