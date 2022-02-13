
const { Console } = require('console');
const express = require('express');
const socketio = require('socket.io');
const {
    checkDuplicateUser, 
    checkHost, 
    createUser, 
    createHost, 
    joinHost,
    generateSocketIdToUser,
    getUserThruSocket,
    deleteUser,
    deleteHost,
    cleanChallenger,
    findChallenger,
    updateUserAsHost,
    updateHost
} = require('./utils/users');
const bodyParser = require('body-parser')
const PORT = 3000 || process.env.port;

// http module to create server
const http = require('http');

const app = express();
// server that'll handle socket io
const server = http.createServer(app);
const io = socketio(server);

//server params
let notify = 0;

// port

// app.use((req, res, next) => {
//     let { method, path, ip } = req;
//     console.log( method + " " + path + " - " + ip );
//     next();
// });

app.get('/', (req, res) => {
    res.sendFile( __dirname + "/public/index.html");
});

app.get('/game', async function(req, res) {
    let { username, host } = req.query;
    const dupTest = await checkDuplicateUser(username);
    const hostTest = await checkHost(host);
    if(dupTest) {
        notify = 1
        res.redirect("/");
    }   else if(!dupTest && !host) {
            createUser(username, username);
            createHost(username);
            res.sendFile( __dirname + `/public/game.html` );
        } else if(!dupTest && hostTest) {
            createUser(username, host);
            await joinHost(username, host);
            res.sendFile( __dirname + `/public/game.html` );
            } else if(!dupTest && !hostTest) {
                notify = 2
                res.redirect("/");
            }
});

io.on('connection', socket => {
    
    socket.on('joinRoom', ({username, host}) => {
        generateSocketIdToUser(username, socket.id)
        console.log(`${username} is joining ${host}...`)
        socket.join(host);

        socket.broadcast.to(host).emit('userjoin', username);

        socket.on('serverInstruct', (num, etc) => {
            if(num == 1) {
                io.to(host).emit('gameInstruct', num);
            }
        })

        socket.on('serverUpdate', ({appleEaten, stillAlive}) => {
            if(stillAlive) {
                socket.broadcast.to(host).emit('appleOpponent', appleEaten)
            } else {
                socket.broadcast.to(host).emit('deadOpponent', true)
            }
        })

        socket.on('gameHash', divs => {
            socket.broadcast.to(host).emit('gameOpponentHash', divs);
        });
    })

    socket.on('refreshRoom', ({username, host}) => {
        console.log(username, ' will leave ',host)
        socket.leave(host);
    })

    socket.emit('notifyClient', notify);

    // server params default
    notify=0;

    socket.on('disconnect', async function() {
        const user = await getUserThruSocket(socket.id);
        if(user !== null) {
            console.log(user.username, ' disconnected');
            socket.broadcast.to(user.host).emit('userdisconnect', user.username);
            // update host/challenger
            if(user.username === user.host) {
                const toBeHost = await findChallenger(user.host)
                if(toBeHost) {
                    updateUserAsHost(toBeHost);
                    updateHost(user.host, toBeHost);
                    deleteUser(user.username);
                } else {
                    deleteHost(user.username);
                    deleteUser(user.username);
                }
            } else {
                cleanChallenger(user.host);
                deleteUser(user.username);
            }
        }
    })
});

// makes public static for static files
app.use(express.static( __dirname + '/public'));

app.use(bodyParser.urlencoded({extended: false}));

// server instead of app, to handle socket io
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
