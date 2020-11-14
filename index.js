const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const cookie = require('cookie');

app.use(cookieParser ());
app.use('/', express.static('client'));

const emojis = [
    {text: ":)", utf: "🙂"},
    {text: ":(", utf: "🙁"},
    {text: ":o", utf: "😲"},
];

let userCount = 1;
let history = [];
let users = [];

// define a route handler / that gets called when we hit our website home
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

// listen on the connection event for incoming sockets and emit to everyone
io.on('connection', (socket) => {
    // Send user their username after connecting
    let username = "User" + userCount++;
    let usernameCookie = socket.handshake.headers.cookie;
    if(usernameCookie){
        cookieVal = cookie.parse(usernameCookie).username;
        
        if(cookieVal){
            username = cookieVal;
        }
    }

    if(users.includes(username)){
        username = "User" + userCount++;
    }

    socket.emit('your username', username);

    // Send user their color after connecting 
    let color = Math.floor(Math.random()*16777215).toString(16);
    let colorCookie = socket.handshake.headers.cookie;

    if(colorCookie){
        colorVal = cookie.parse(colorCookie).color;

        if(colorVal){
            color = colorVal;
        }
    }

    socket.emit('your color', color);

    // Send updated users list after a new user connects
    users.push(username);
    io.emit('updated user', users);

    // Send chat history when a new user connects 
    socket.emit('history', history);

    socket.on('chat message', (msg) => {
        // Handle command to change username
        if(msg.startsWith("/name ")){
            msg = msg.replace("/name ", "");
            if(msg){
                if(users.includes(msg)){
                    socket.emit('error message', "This username is already taken.");
                }
                else{
                    for(let i=0; i<history.length; i++){
                        history[i].sender = history[i].sender.replace(username, msg);
                    }

                    users.splice(users.indexOf(username), 1);
                    username = msg;
                    users.push(username);
                    socket.emit('your username', username);
                    io.emit('updated user', users);
                    io.emit('history', history);
                }
            }
            else{
                socket.emit('error message', "Please specify a username.");
            }
        }

        // Handle command to change color 
        else if(msg.startsWith("/color ")){
            msg = msg.replace("/color ", "");
            if(msg){
                if(/^[0-9A-F]{6}$/i.test(msg)){
                    for(let i=0; i<history.length; i++){
                        if(history[i].sender === username){
                            history[i].color = history[i].color.replace(color, msg);
                        }
                    }

                    color = msg;
                    socket.emit('your color', color);
                    io.emit('history', history);
                }
                else{
                    socket.emit('error message', "Please specify a valid color in the format of RRGGBB.");
                }
            }
            else{
                socket.emit('error message', "Please specify a color.");
            }
        }
        
        // Handle regular messages 
        else{
            for(let i=0; i<emojis.length; i++){
                msg = msg.replace(emojis[i].text, emojis[i].utf);
            }

            let message = {
                sender: username,
                color: color,
                text: msg,
                timestamp: createTimestamp()
            };

            // Keep only most recent 200 messages
            history.push(message);
            if(history.length > 200){
                history.shift();
            }

            io.emit('chat message', message);
        }
    });

    // Send updated users list after user disconnects
    socket.on("disconnect", () => {
        users.splice(users.indexOf(username), 1);
        io.emit("updated user", users);
    });
});

// make the http server listen on port 3000
http.listen(3000, () => {
    console.log('listening on port: 3000');
});

function createTimestamp(){
    date = new Date();
    return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear() + "  " + date.getHours() + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes();
}  