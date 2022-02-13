const socket = io();

socket.on('notifyClient', n => {
    if(n == 1) {
        alert('Username is currently in used')
    } else if(n == 2) {
        alert("Opponent is in match or doesn't exist")
    } else if(n == 3) {
        alert('Unnamed error!')
    }
} )
