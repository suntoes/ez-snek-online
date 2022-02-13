// MONGODB AND MONGOOSE STUFF

const mongoose = require('mongoose');
require('dotenv').config();
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const snekUserSchema = new Schema({
    username: String,
    socketid: String,
    host: String
})

const snekHostSchema = new Schema({
    host: String,
    challenger: String
})

const snekUser = mongoose.model('snekUser', snekUserSchema);
const snekHost = mongoose.model('snekHost', snekHostSchema);

function createUser(username, host) {
    let newUser = new snekUser({'username': username, 'host': host});
    newUser.save((e, d) => {
        if(e) console.error(e);
    })
    console.log(username, ' login!')
}

function deleteUser(username) {
    console.log(username, ' is deleted!')
    snekUser.findOneAndRemove({'username': username}, (e, d) => {
        if(e) console.error(e);
    })
}

function deleteHost(host) {
    snekHost.findOneAndRemove({'host': host}, (e, d) => {
        if(e) console.error(e);
    })
}

function createHost(username) {
    let newHost = new snekHost({host: username});
    newHost.save((e, d) => {
        if(e) console.error(e);
    })
}

function joinHost(username, host) {
    snekHost.findOneAndUpdate( {'host': host}, {challenger: username}, {new: true}, (err, d) => {
        if (err) return console.error(err);
      });
}

async function findChallenger(host) {
    let result = await snekHost.findOne({"host": host}).select('challenger').exec()
    return result.challenger
}

function updateUserAsHost(username) {
    snekUser.findOneAndUpdate( {'username': username}, {host: username}, {new: true}, (err, d) => {
        if (err) return console.error(err);
      });
}

function updateHost(host, username) {
    snekHost.findOneAndUpdate( {'host': host}, {'host': username, challenger: null}, {new: true}, (err, d) => {
        if (err) return console.error(err);
      });
}

function cleanChallenger(host) {
    snekHost.findOneAndUpdate( {'host': host}, {challenger: null}, {new: true}, (err, d) => {
        if (err) return console.error(err);
      });
}

async function checkDuplicateUser(username) {
    let result = await snekUser.findOne({"username": username}).exec()
    if(result) {
        return true
    } else {
        return false
    }
}

async function checkHost(host) {
    let result = await snekHost.findOne({"host": host, "challenger": null}).exec()
    if(result) {
        return true
    } else {
        return false
    }
}

// SOCKET STUFF

async function generateSocketIdToUser(username, socket) {
    snekUser.findOneAndUpdate( {'username': username}, {socketid: socket}, {new: true}, (err, d) => {
        if (err) return console.error(err);
      });
}

async function getUserThruSocket(socket) {
    let result = await snekUser.findOne({socketid: socket}).exec();
    return result
}

module.exports = {
    createUser,
    deleteUser,
    createHost,
    checkDuplicateUser,
    checkHost,
    joinHost,
    generateSocketIdToUser,
    getUserThruSocket,
    deleteHost,
    cleanChallenger,
    findChallenger,
    updateUserAsHost,
    updateHost
}