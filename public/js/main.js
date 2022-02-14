// WARNING, MAIN.JS IS A MIX OF SNAKE LOGIC AND SOCKET.IO

// adapts io calls ( 'on' listener, etc)
const socket = io();

// server element
const playerTwo = document.querySelector('.player-two');

let { username, host } = Qs.parse(location.search, { 
    ignoreQueryPrefix: true
});

let dualMode = false;

// DOM elements
const boardDiv = document.getElementById('board-div');
const boardDivTwo = document.getElementById('board-div-two')
const gameButton = document.getElementById('game-button');
const gameButtonTwo = document.getElementById('game-button-two');
const controlToggleButton = document.getElementById('control-toggle');
const controlsButton = document.querySelectorAll('.controls-button');
const controlDiv = document.getElementById('controls-div');

// host config
if(!host) {
    host = username;
};

// alert with delay for window load
function initialAlert() {
   setTimeout(()=>{
        if(host === username) {
            alert('Tell a friend to enter your username to match!');
        } else {
            alert(`You've connected with ${host}!`);
        };
    }, 100);
};

initialAlert();

gameButtonTwo.innerHTML = host;

socket.on('gameOpponentHash', divs => {
  document.getElementById('board-div-two').innerHTML = divs;
});

let opponentApple = 0;

socket.on('appleOpponent', num => {
    opponentApple = num;
    gameButtonTwo.innerHTML = `${opponentName} has eaten &nbsp;<div class="apple-count">${num}</div>&nbsp; ${num > 1 ? 'apples' : 'apple'}`;
})

let opponentLive = true;

socket.on('deadOpponent', val => {
    boardDivTwo.style.filter = 'brightness(80%)'
    if(val) {
        opponentLive = false
    }
})

let opponentName = ''

socket.on('userjoin', user => {
    opponentName = user;
    dualMode = true;
    playerTwo.style.display = 'inline';
    gameButtonTwo.innerHTML = user;
    console.log(user, ' has joined');
    // initial emit call
    socket.emit('gameHash', boardDiv.innerHTML);
    // update gameBar
    if(!stillAlive){
        alert(`${user} has joined!`);
        gameBar()
    }

});

socket.on('userdisconnect', user => {
    if(user === host) {
        socket.emit('refreshRoom', {username, host});
        host = username;
        socket.emit('joinRoom', { username, host });
        reset();
        gameBar();
    }
    dualMode = false;
    playerTwo.style.display = 'none';
    turnOffWinLoseDetect();
    console.log(user, ' has disconnected');
    if(!stillAlive){
      alert(`${user} has disconnected!`);
      gameBar();
      reset();
    }
});

socket.on('gameInstruct', num => {
    if(num == 1) {
        reset();
        draw(board);
        defPass = true;
        countDownGame();
    } 
});

socket.emit('joinRoom', { username, host });

if( host !== username ) {
    opponentName = host;
    playerTwo.style.display = 'inline';
    boardDivTwo.style.filter = '';
    // initial emit call
    socket.emit('gameHash', boardDiv.innerHTML);
};

// array as board, fixed count
let board = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
];
// elements
let snakeIndex = [43];

let appleIndex = 20;
let listOfAppleFree = [];
let appleEaten = 0;
let stillAlive = false;

let moveLeft = false;
let moveRight = false;
let moveUp = true;
let moveDown = false;

let speed = 600;

let defPass = true;

// initial draw call
draw(board);

// early DOM configuration
function gameBar() {
    if(username === host) {
        gameButton.innerHTML = 'click me to play!';
        gameButton.onclick = dualMode ? () => serverInstruct(1) : gameOn;
        boardDiv.onclick = dualMode ? () => serverInstruct(1) : gameOn;
    } else {
        dualMode = true
        gameButton.innerHTML = 'wait for host to start'
    };
};
gameBar();

function serverInstruct(num) {
    socket.emit('serverInstruct', (num));
};

function countDownGame() {
    reOnlineValues();
    boardDiv.style.filter = '';
    boardDivTwo.style.filter = '';
    gameButton.onclick = '';
    boardDiv.onclick = '';
    let count = 6;
    const interval = setInterval(()=>{
        if(count === 6) {
            gameButton.innerHTML = 'Match initiated!';
            gameButtonTwo.innerHTML = 'Match initiated!';
            count -= 1;
        } else if(count > 0 && count !== 6) {
            gameButton.innerHTML = count + '...';
            gameButtonTwo.innerHTML = count + '...';
            count -= 1;
        } else {
            clearInterval(interval);
            winLoseDetect();
            gameOn();
            count = 6;
        }
    }, 1000);
}

// control essentials
controlToggleButton.onclick = controlsToggle;
controlsButton.forEach(btn => btn.onclick = function(){inputKey(btn.id)});

document.addEventListener('keydown', (e) => {
  inputKey(e.key.toLowerCase());
})

function controlsToggle() {
  if (controlToggleButton.innerHTML === "show control buttons?") {
      controlDiv.style.display = "flex";
      controlToggleButton.innerHTML = "hide control buttons?"
  } else {
      controlDiv.style.display = "none";
      controlToggleButton.innerHTML = "show control buttons?"
  }
}

function inputKey(key) {
  if (gameButton.innerHTML !== 'click me to play!' && gameButton.innerHTML !== 'aw! wanna try again?') {
      switch(key) {
          case 'arrowup':
          case 'w':
              if (snakeIndex[0]-8 === snakeIndex[1]) {
                  break;
              } else {
                  moveUp = true;
                  moveRight = false;
                  moveLeft = false;
                  moveDown = false;
                  }
              break;
          case 'arrowleft':
          case 'a':
              if (snakeIndex[0]-1 === snakeIndex[1]) {
                  break;
              } else {
                  moveLeft = true;
                  moveUp = false;
                  moveRight = false;
                  moveDown = false;
              }
              break;
          case 'arrowright':
          case 'd':
              if (snakeIndex[0]+1 === snakeIndex[1]) {
              break;
              } else {
                  moveRight = true;
                  moveUp = false;
                  moveLeft = false;
                  moveDown = false;
              }
              break;
          case 'arrowdown':
          case 's':
              if (snakeIndex[0]+8 === snakeIndex[1]) {
              break;
              } else {
                      moveDown = true;
                      moveUp = false;
                      moveRight = false;
                      moveLeft = false;
                  }
              break;
      };
  }         
};

function snakeMove(pos) {
    // basic math to move snake in array w/ restrictions
    if (moveUp) {
        return pos-8;
    } else if (moveDown) {
        return pos+8;
    } else if (moveLeft) {
        return pos-1;
    } else if (moveRight) {
        return pos+1;
    }
  }

// sets new speed
function newSpeed() {
  speed = 600 -(( 1/( board.length/snakeIndex.length) )*200);
};

// sets new list of snake-free index for next apple
function refreshAppleFree() {
  let freeArr = [];
  for (let i = 0; i < board.length; i++) {
      if (!snakeIndex.some(x => x === i)) {
          freeArr.push(i);
      };
  };
  listOfAppleFree = freeArr;
}

// generate random index for next apple
function newAppleIndex() {
  let rndm = Math.floor(Math.random() * (( listOfAppleFree.length -1 )- 0 + 1) + 0);
  return rndm;
}

// resets the #board-div with a new fresh updated divs ;)
function draw(board) {
  if (boardDiv.innerHTML === '') {
      board.forEach(( e, i) => {

          const cell = document.createElement('div')
          boardDiv.appendChild(cell);

          cell.id = i
          cell.classList.add('cells');
          cell.style.backgroundColor = '#212121';

          detectSnakeOrApple(cell, i);
      });
  }   else {
          board.forEach(( e, i) => {
              const cell = document.getElementById(i);
              cell.style.backgroundColor = '#212121';

              if(cell.innerHTML === ':' && i !== snakeIndex[0]) {
                  cell.innerHTML = '';
                  cell.classList.remove('cell-head');
                  cell.style.transform = '';
              }

              detectSnakeOrApple(cell, i);
          });
      }

  socket.emit('gameHash', boardDiv.innerHTML);
}

function detectSnakeOrApple(cell, i) {
  if(snakeIndex.some(x => x === i)) {
      if(i === snakeIndex[0]) {
          cell.classList.add('cell-head');
          cell.innerHTML = ':';

          let numDeg = moveUp ? 90 : moveRight ? 180 : moveDown ? 270 : 0
          cell.style.transform = `rotate(${numDeg}deg)`
      };    
      cell.style.backgroundColor = '#4df163';
  }   else if(i === appleIndex) {
          cell.style.backgroundColor = '#ff5959';
      };
}

// resets necessary game elements
function reset() {
  
  snakeIndex = [43];
  
  appleIndex = 20;
  listOfAppleFree = []

  moveLeft = false;
  moveRight = false;
  moveUp = true;
  moveDown = false;
  
  speed = 600;
};

function playAgain() {
    reset();
    turnOffWinLoseDetect();
    hostGameBar();
}

function hostGameBar() {
  if(username === host) {
        gameButton.onclick = () => {defPass = true; draw(board); gameBar()};
        boardDiv.onclick = () => {defPass = true; draw(board); gameBar()};
        boardDiv.style.filter = '';
        boardDivTwo.style.filter = '';
    }
}



// starts the game with setInterval() and renderBoard()
function gameOn() {
  stillAlive = true
  boardDiv.style.filter = ''
  // recalls renderBoard() for every speed in milliseconds
  let interval = setInterval(() => renderBoard(), speed);
  
  // instruction before first apple gets eaten
  gameButton.innerHTML = '(w, a, s, d) are the controls!';
  
  // disable the unnecessary button for gameplay
  boardDiv.onclick = '';
  gameButton.onclick = '';
  
  // use of localStorage to clean interval later on other function
  localStorage.setItem('game-interval' + username, interval);
}

console.log(username === host)

function winLoseDetect() {
    let emiter = setInterval(()=>{
        socket.emit('serverUpdate', {appleEaten, stillAlive});
    }, 100)

    let checker = setInterval(()=>check(), 100)

    function check() {
        if(stillAlive && !opponentLive) {
            if(appleEaten > opponentApple) {
                clearInterval(checker)
                clearInterval(emiter)
                reOnlineValues();
                playAgain();
                gameOff();
                alert('You win');
                if(username === host){
                    gameButton.innerHTML = 'Click me for a rematch'
                } else {
                    gameButton.innerHTML = 'wait for host to start'
                }
            }
        }
        if(!stillAlive && opponentLive) {
            if(appleEaten < opponentApple) {
                clearInterval(checker)
                clearInterval(emiter)
                reOnlineValues();
                playAgain();
                gameOff();
                alert('You lose');
                if(username === host){
                    gameButton.innerHTML = 'Click me for a rematch'
                } else {
                    gameButton.innerHTML = 'wait for host to start'
                }
            }
        }
        if(!stillAlive && !opponentLive) {
            if(appleEaten === opponentApple) {
                clearInterval(checker)
                clearInterval(emiter)
                reOnlineValues();
                playAgain();
                gameOff();
                alert("It's a tie");
                if(username === host){
                    gameButton.innerHTML = 'Click me for a rematch'
                } else {
                    gameButton.innerHTML = 'wait for host to start'
                }
            }
        }
    }

    localStorage.setItem('emiter-interval' + username, emiter)
    localStorage.setItem('checker-interval' + username, checker)
}

function turnOffWinLoseDetect() {
    clearInterval( localStorage.getItem('emiter-interval' + username) );
    clearInterval( localStorage.getItem('checker-interval' + username) );
}

function reOnlineValues() {
    appleEaten = 0;
    stillAlive = true;
    opponentLive = true;
    opponentApple = 0;
}

// render the game by the game rules
function renderBoard() {
    
  // if snake eats apple
  if (snakeMove(snakeIndex[0]) === appleIndex) {
      appleEaten++

      // adds apple index to snake
      snakeIndex.unshift(appleIndex)

      // new apple function
      refreshAppleFree();
      appleIndex = listOfAppleFree[newAppleIndex()];

      newSpeed();

      // refreshes the render calls for new speed
      gameOff();
      gameOn();

      // gameboard update
      gameButton.innerHTML = 
          `<div class="apple-count">${63-(board.length - snakeIndex.length)}/63</div> &nbsp; apples, &nbsp;<div class="speed-count">${(600/speed).toFixed(2)}x</div> &nbsp; speed`;
  } else {
      // else if snake dont eats apple
      snakeIndex = snakeIndex.map((pos, i) => i === 0 ? snakeMove(pos): snakeIndex[i-1] );
  }
  
  // win or defeat checker
  winTest();
  defTest();

  if (defPass) {
      draw(board);
  }
}

// stops the game with clearInterval()
function gameOff() {
  clearInterval( localStorage.getItem('game-interval' + username) );
}

function winTest() {
  // basic logic to detect win win
  if (snakeIndex.length >= board.length) {
      defPass = false;
      if(!dualMode){
        gameOff();
        playAgain();
        gameButton.innerHTML = 'nc! wanna play again?';
      } else {
        gameOff();
        playAgain();
      }
      stillAlive = false;
  }
}

function defTest() {
  // to call if proven lose
  function provenLose() {
    defPass = false;
      if(!dualMode){
        playAgain();
        gameOff();
        gameButton.innerHTML = 'aw! wanna try again?';
      } else {
        defPass = false;
        gameOff();
        hostGameBar()
        reset();
      }
      stillAlive = false;
      boardDiv.style.filter = 'brightness(80%)';
  };

  // some impromptu maths to detect snake move violations
  if (snakeIndex.indexOf(snakeIndex[0]) !== snakeIndex.lastIndexOf(snakeIndex[0])) {
      provenLose();
  } else if (snakeIndex[0] < 0 || snakeIndex[0] > board.length-1) {
      provenLose();
  } else if ((moveLeft && (snakeIndex[0]+1)%8 === 0) || (moveRight && (snakeIndex[0]+8)%8 === 0)) {
      provenLose();
  }
  
}
