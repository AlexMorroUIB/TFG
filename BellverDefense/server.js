require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const PORT = 80;
const DBFunctions = require('./DBFunctions.js');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, './index.html'));
});

app.post('/getUsuari', async (req, res) => {
  DBFunctions.GetUser(req, res);
});

app.post('/preguntesUsuari', function (req, res) {
  DBFunctions.InsertPreguntes(req, res);
});

app.post('/updatePuntuacio', function (req, res) {
  DBFunctions.UpdatePuntuacio(req, res);
});

app.get('/getTopPuntuacions', function (req, res) {
  DBFunctions.GetTopPuntuacions(req, res);
});

http.createServer(app).listen(PORT);
