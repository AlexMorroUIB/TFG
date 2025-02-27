const express = require('express')
const path = require('path')
const http = require('http')
const https = require('https')
const fs = require('fs')
const PORT = 80

const app = express()

app.use(express.static(path.join(__dirname, 'src')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, './index.html'))
})

http.createServer(app).listen(PORT);
