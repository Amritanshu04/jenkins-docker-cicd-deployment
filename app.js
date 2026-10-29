

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Jenkins CI/CD Demo</title>
          </head>
          <body>
            <h1>Hello from Jenkins CI/CD!</h1>
            <p>Deployed using Jenkins and Docker on AWS EC2.</p>
            <p>Status: Running successfully</p>
          </body>
        </html>
    `);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Application running on port ' + PORT);
});
