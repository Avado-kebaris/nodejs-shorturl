const sqlite3 = require('sqlite3').verbose();
const http = require('http');

// Create a new database connection
const db = new sqlite3.Database('./db.sqlite3', (err) => {
 if (err) {
    console.error(err.message);
 }
 // Configure the database schema
 db.run(`CREATE TABLE IF NOT EXISTS url_shortener (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            url TEXT NOT NULL
          )`, (err) => {
    if (err) {
      console.error(err.message);
    }
 });
});

function insertUrlMapping(path, url) {
 db.run(`INSERT INTO url_shortener (path, url) VALUES (?, ?)`, [path, url], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
 });
}

function getUrlMapping(path, callback) {
 db.get(`SELECT * FROM url_shortener WHERE path = ?`, [path], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    callback(row);
 });
}

const server = http.createServer((req, res) => {
 const path = req.url;
 if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      const urlMapping = JSON.parse(body);
      insertUrlMapping(urlMapping.path, urlMapping.url);
      res.end('URL mapping added successfully.\n');
    });
 } else {
    getUrlMapping(path, (row) => {
      if (row) {
        res.writeHead(302, { location: row.url });
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
      }
    });
 }
});

server.listen(3000);

