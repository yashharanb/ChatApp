let username = "";
let color = "";

$(function () {
    // defaults to trying to connect to the host that serves the page
    let socket = io();
    
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    
    // Save username from server
    socket.on('your username', function(name) {
        username = name; 
        document.cookie = 'username=' + username;
    });

    // Save color from server
    socket.on('your color', function(col) {
        color = col; 
        document.cookie = 'color=' + color;
    });

    // when we capture a chat message event we’ll include it in the page
    socket.on('chat message', function (msg) {
        showMessage(msg);
        window.scrollTo(0, document.body.scrollHeight);
    });

    // Display active users to page
    socket.on('updated user', function (users) {
        $('#users').empty();
        $('#users').append($('<li>' + username + " (You)</li>"));
        users.forEach(function (user) {
            if(user !== username){
                $('#users').append($('<li>').text(user));
            }
        }); 
    });

    // Display history of chat messages to page
    socket.on('history', function (history) {
        $('#messages').empty();
        history.forEach(function (msg) {
            showMessage(msg);
        }); 
        
        window.scrollTo(0, document.body.scrollHeight);
    });

    // Display error message
    socket.on('error message', function (msg) {
        alert(msg);
    });
});

function showMessage(msg){
    let class_name = "others";
    if(username === msg.sender){
        class_name = "myself";
    }

    $('#messages').append($('<li>'
        + '<div class = "message ' + class_name + '">'
            + '<div class="timestamp">' + msg.timestamp + '</div>'
            + '<div class="username" style="color:#' + msg.color + ';">'+ msg.sender + '</div>'
            + '<div class="text">' + msg.text + '</div>' 
        + '</div>'    
    ));
}