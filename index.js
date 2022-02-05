const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 8000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(cors());

io.on('connection', (socket) => {
  console.log('User connected.');
});

app.get('/', (req, res) => {

});

app.listen(port, () => {
  console.log(`Supergun running on port ${port}`);
});