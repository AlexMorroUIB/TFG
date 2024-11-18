const express = require('express')
const path = require('path')
const http = require('http')
const https = require('https')
const fs = require('fs')
const PORT = 443
const options = {
  pfx: fs.readFileSync("src/ssl/AlexMorro.pfx"),
  passphrase: "1234"
}

const app = express()

app.use(express.static(path.join(__dirname, 'src')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/index.html'))
})

https.createServer(options, app).listen(PORT);
