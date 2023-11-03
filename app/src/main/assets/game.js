//declaring html elements
var htmlBody = document.querySelector("body");
var htmlCanvas = document.querySelector("canvas");
var htmlInstruction = document.querySelector(".instruction")
var htmlGameOver = document.querySelector(".loseText")
var htmlScore = document.querySelector(".score")
var htmlHighscore = document.querySelector(".highscore")
var htmlSpeed = document.querySelector(".speed")
var htmlJump = document.querySelector(".jump")
var htmlSize = document.querySelector(".size")
var htmlExtraJ = document.querySelector(".triple")
var htmlContainer = document.querySelector(".container")
var htmlPowerContainer = document.querySelector(".powerContainer")
var htmlPauseIcon = document.querySelector(".pauseIcon")
var htmlSettingsIcon = document.querySelector(".fa-cog")
var htmlSettings = document.querySelector(".settings")
var htmlMusicSlider = document.querySelector(".musicSettings .slidecontainer input")
var htmlSoundSlider = document.querySelector(".soundSettings .slidecontainer input")
var htmlMusicText = document.querySelector(".musicText")
var htmlSoundText = document.querySelector(".soundText")
var htmlSaveButton = document.querySelector(".saveButton")
var htmlBackButton = document.querySelector(".backButton")

//declaring other elements
var canvas = htmlCanvas.getContext("2d");
var gameSize = Math.min(screen.width - 4, 496);
var currentSong = new Audio('song1.mp3');
var soundJump = new Audio("sounds/jump.mp3");
var soundCollect = new Audio("sounds/collect.mp3");
var soundLose = new Audio("sounds/loss.mp3");
var soundPowerJ = new Audio("sounds/powerup.mp3");
var soundExtraJ = new Audio("sounds/powerup.mp3");
var soundSlow = new Audio("sounds/powerup.mp3");
var soundShrink = new Audio("sounds/powerup.mp3");
var targetRefreshRate = 90;
var currentMusicVolume = 0.2;
var currentSoundVolume = 0.3;
var settingsState = 0;

//dbb stuff
var DB_name = "gameDB";
var DB_version = "1.0";
var DB_displayName = "gameDB";
var DB_sizeEstimate = 200000;
//var myDB = window.openDatabase(DB_name, DB_version, DB_displayName, DB_sizeEstimate);

//declaring ingame elements
var hasDoubleJump = true;
var numOfExtraJumps = 0;
var currentScore = 0;
var highScore = 0;
var isKeyPressed = false;
var currentJumpAc = 1;
var player;
//lists
var obstacles = [];
var buffs = [];
var afterimages = [];
var playerLossParts = [];

//declaring physics elements
var xPixelsPerMs;

//declaring size elements
var basePlayerX = gameSize * 0.05;
var basePlayerSize = gameSize * 0.10;
var baseBuffSize = gameSize * 0.07;
var baseJumpAc = 1;

//declaring performance elements
var startingTime;
var totalTime;
var lastUpdateTime;
var timeDifference;
var gameState = 0;
var isPlayingLoseAnimation = false;
var score = 0;
var highScore = 0;
var slowCounter = 0;
var isKeyUp = true;

//declaring colors
var basePlayerColor = "#0FDDFF";
var baseObstacleColor = "#CC3B21";
var buffColorSlow = "#FFD775";
var buffColorJumpPower = "#D582FF";
var buffColorShrink = "rgb(136, 221, 247)";
var buffColorJump = "#75FFA7";

//declare x positions
var globalXPosition = 0;
var thisXMoved = 5;
var xToPixelRatio = 0.25 * gameSize / 500;
var speed = 1;
var obstacleCounter = 0;
//
var isJumping = false;
var jumpStartX = 0;
var jumpStartY = 0;


prepareGame();
//-------------------------------------------------------


/*
if(myDB != null) {
    console.log("success")
} else {
    console.log("abbc")
}
*/


//base functions

//prepares the game and sets the variables before the game can be played
function prepareGame() {
    htmlCanvas.setAttribute('height', gameSize);
    htmlCanvas.setAttribute('width', gameSize);
    htmlContainer.style.width = (gameSize + 4) + "px";
    htmlSettings.style.width = (gameSize + 4) + "px";
    htmlGameOver.style.top = gameSize / 2 - htmlGameOver.offsetHeight / 2 + document.querySelector("h1").offsetHeight + "px";
    setListeners();
    spawnPlayer();
    loadSettings();
    drawAll();
    currentSong.loop = true;
    setUpDefaultValues();
    setInterval(update, 1000 / targetRefreshRate);
    highScore = localStorage.getItem("highscore") || 0;
}

function loadSettings() {
    currentMusicVolume = localStorage.getItem("musicVolume") || 0.2;
    currentSoundVolume = localStorage.getItem("soundVolume") || 0.3;
    htmlSoundText.textContent = "Sound: " + Math.round(currentSoundVolume * 100) + "%";
    htmlMusicText.textContent = "Music: " + Math.round(currentMusicVolume * 100) + "%";
    htmlSoundSlider.value = currentSoundVolume * 100;
    htmlMusicSlider.value = currentMusicVolume * 100;
}

//what should happen on the 60fps update
function update() {
    if (gameState === 1) {
        var newTime = (new Date()).getTime();
        timeDifference = newTime - lastUpdateTime;
        totalTime += timeDifference;
        computeStandard();
        collectObstacle();
        if (globalXPosition / ((220) * gameSize / 500) > obstacleCounter) {
            if (obstacleCounter % 2 === 0) {
                spawnNewObstacle();
            } else if (Math.random() > 0.7) {
                spawnNewRandomBuff();
            }

            obstacleCounter++;
        }
        lastUpdateTime = newTime;
    }
    currentSong.volume = currentMusicVolume;
    updateTextFields();
    drawAll();
}

//pauses the game
//plays lose animation
function lose() {
    gameState = 2;
    currentSong.pause();

    soundLose.volume = Math.min(currentSoundVolume*1.5, 0.99);
    soundLose.currentTime = 0;
    soundLose.play();
    htmlGameOver.classList.remove("pause")
    htmlGameOver.classList.add("lose")
    htmlGameOver.textContent = "GAME OVER!"
    htmlGameOver.style.visibility = "visible";
    htmlInstruction.textContent = "TAP to play!";
    startLossAnimation();
}

//stop background processing
function pause() {
    gameState = 3;
    currentSong.pause();

    htmlPauseIcon.classList.remove("fa-pause")
    htmlPauseIcon.classList.add("fa-play")
    htmlGameOver.classList.add("pause")
    htmlGameOver.classList.remove("lose")

    htmlGameOver.textContent = "PAUSED!"
    htmlGameOver.style.visibility = "visible";
}

//starts the game from a starting state
function start() {
    htmlPauseIcon.classList.add("fa-pause")
    htmlPauseIcon.classList.remove("fa-play")
    htmlInstruction.textContent = "TAP to (double) JUMP!";
    htmlGameOver.style.visibility = "hidden";
    lastUpdateTime = (new Date()).getTime();
    gameState = 1;
    currentSong.play();
}

function resume() {
    gameState = 1;
    lastUpdateTime = (new Date()).getTime();
    htmlPauseIcon.classList.add("fa-pause")
    htmlPauseIcon.classList.remove("fa-play")
    htmlGameOver.classList.remove("pause")
    htmlGameOver.classList.add("lose")
    htmlGameOver.textContent = "GAME OVER!"
    htmlGameOver.style.visibility = "hidden";
    currentSong.play();
}

//resets values
//starts game
function restart() {
    setUpDefaultValues();
    start();
}


//settings functions
function toggleSettings() {
    htmlSettings.classList.toggle("hide")
    htmlContainer.classList.toggle("hide")
}

function closeSettings() {
    loadSettings();
    if (settingsState != 2) {
        gameState = 3;
    } else {
        gameState = 2;
        htmlGameOver.textContent = "GAME OVER!"
    }
    toggleSettings();

}

function saveSettings() {
    localStorage.setItem("musicVolume", currentMusicVolume);
    localStorage.setItem("soundVolume", currentSoundVolume);
    closeSettings();
}

//-------------------------------------------------------


//prep functions

//sets up the input listeners
function setListeners() {
    //keyboard action setting
    htmlBody.addEventListener("keydown", onDownAction);
    htmlBody.addEventListener("keyup", onUpAction);

    //smartphone action setting
    htmlBody.addEventListener("touchstart", onDownAction);
    htmlBody.addEventListener("touchend", onUpAction);

    //smartphone settings setting
    htmlMusicSlider.addEventListener("input", onMusicChange);
    htmlSoundSlider.addEventListener("input", onSoundChange);
    htmlMusicSlider.addEventListener("ondrag", onMusicChange);
    htmlSoundSlider.addEventListener("ondrag", onSoundChange);
    htmlMusicSlider.addEventListener("change", onMusicChange);
    htmlSoundSlider.addEventListener("change", onSoundChange);
    htmlSaveButton.addEventListener("touchstart", saveSettings)
    htmlBackButton.addEventListener("touchstart", closeSettings)
}

function onDownAction(e) {
    if (gameState != 4 && e.target != htmlBackButton && e.target != htmlSaveButton) {
        if (e.target == htmlPauseIcon) {
            onPausePress();
        } else if (e.target == htmlSettingsIcon) {
            onSettingsPress();
        } else if (gameState != 3) {
            if (gameState != 1 && playerLossParts.length < 1) {
                currentSong.play();
                restart();
            } else if (player.y >= gameSize * 0.99 - player.size && isKeyUp) {
                jump();
            } else if (hasDoubleJump && isKeyUp) {
                jump();
                hasDoubleJump = false;
            } else if (numOfExtraJumps > 0 && isKeyUp) {
                jump();
                numOfExtraJumps--;
            }

            isKeyUp = false;
        } else {
            //resume()
        }
    }

}
function onUpAction() {
    isKeyUp = true;
}

function onPausePress() {
    if (gameState === 3) {
        resume();
    } else if (gameState === 1) {
        pause();
    }
}

function onSettingsPress() {
    settingsState = gameState;
    pause();
    toggleSettings();
    gameState = 4;
}

function onMusicChange() {
    currentMusicVolume = Math.round(htmlMusicSlider.value) / 100;
    htmlMusicText.textContent = "Music: " + Math.round(currentMusicVolume * 100) + "%";
}
function onSoundChange() {
    currentSoundVolume = Math.round(htmlSoundSlider.value) / 100;
    htmlSoundText.textContent = "Sound: " + Math.round(currentSoundVolume * 100) + "%";
}

//prepares the values to the defaults
function setUpDefaultValues() {
    player.size = basePlayerSize;
    numOfExtraJumps = 0;
    currentJumpAc = 1;
    speed = 1;
    obstacles = [];
    buffs = [];
    obstacleCounter = 0;
    globalXPosition = 0;
    score = 0;
    slowCounter = 0;
    currentSong.currentTime = 27;
    currentSong.playbackRate = speed * 0.7;
}



//-------------------------------------------------------


//math functions
function computeStandard() {
    computeXPosition();
    computePlayerY();
    computeObstaclePositions();
    computeBuffPositions();
    detectCollision()
}
//detects collisions
function detectCollision() {

    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (o.x < player.x + player.size * 0.95 &&
            o.x + o.width > player.x + player.size * 0.05 &&
            o.y < player.y + player.size * 0.95 &&
            o.y + o.height > player.y + player.size * 0.05) {
            computeCollision(0, i)
        }
    }

    for (var i = 0; i < buffs.length; i++) {
        var b = buffs[i];
        if (b.x < player.x + basePlayerSize &&
            b.x + b.width > player.x &&
            b.y < player.y + basePlayerSize &&
            b.y + b.height > player.y) {
            computeCollision(b.type, i)
        }
    }
}

function computePlayerY() {
    if (isJumping) {
        var phX = (globalXPosition - jumpStartX) * 0.5 / (gameSize / 500) / (Math.sqrt(Math.sqrt(currentJumpAc * 1.2)));
        var newY = jumpStartY + currentJumpAc * (0.09 * phX * phX - 8 * phX) * 0.7 * gameSize / 500 - 1
        player.y = newY;
    } else if (player.y < gameSize - player.size) {
        player.y = gameSize - player.size;
        hasDoubleJump = true;
    }
    if (player.y >= gameSize - player.size) {
        isJumping = false;
        player.y = gameSize - player.size;
    }
    if (player.y >= gameSize * 0.99 - player.size) {
        hasDoubleJump = true;
    }
}

function computeObstaclePositions() {
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        o.x -= thisXMoved;
    }
}

function computeBuffPositions() {
    //x position
    for (var i = 0; i < buffs.length; i++) {
        var b = buffs[i];
        b.x -= thisXMoved;

        //y position
        if (b.y > gameSize - gameSize / 500 * b.height - 15) {
            b.direction = 1;
        } else if (b.y < gameSize - gameSize / 500 * 185) {
            b.direction = 0;
        }

        if (b.direction === 1) {
            b.y -= thisXMoved / 2;
        } else {
            b.y += thisXMoved / 2;
        }
    }
}

function computeAfterImagePositions() {

}

function computeXPosition() {
    thisXMoved = gameSize / 500 * timeDifference * speed / 4;
    globalXPosition += thisXMoved;
}

//-------------------------------------------------------


//action functions
//computes collisions
function computeCollision(objectType, index) {
    switch (objectType) {
        case 0:
            lose();
            break;
        case 1:
            speedDown();
            buffs.splice(index, 1)
            break;
        case 2:
            upJumpAc();
            buffs.splice(index, 1)
            break;
        case 3:
            shrinkPlayer();
            buffs.splice(index, 1)
            break;
        case 4:
            buffs.splice(index, 1)
            numOfExtraJumps++;
            soundExtraJ.volume = currentSoundVolume*0.7;
            soundExtraJ.currentTime = 0;
            soundExtraJ.play();
            break;
    }
    if (objectType > 0) {
        score += globalXPosition / 10 + 200;
    }
}

function speedUp() {
    if (speed < 3.5) {
        speed += 0.035;
    }
    currentSong.playbackRate = speed * 0.7;
}

function speedDown() {
    slowCounter++;
    speed *= 0.8;
    if (speed < 0.75) {
        speed = 0.75;
    }
    currentSong.playbackRate = speed * 0.7;

    soundSlow.volume = currentSoundVolume*0.7;
    soundSlow.currentTime = 0;
    soundSlow.play();
}

function upJumpAc() {
    currentJumpAc += 0.1

    soundPowerJ.volume = currentSoundVolume*0.7;
    soundPowerJ.currentTime = 0;
    soundPowerJ.play();
}

function shrinkPlayer() {
    player.size -= basePlayerSize * 0.1;
    soundShrink.volume = currentSoundVolume*0.7;
    soundShrink.currentTime = 0;
    soundShrink.play();
}

function jump() {
    isJumping = true;
    jumpStartX = globalXPosition;
    jumpStartY = player.y;
    soundJump.volume = Math.min(currentSoundVolume*1.2, 0.99);
    soundJump.currentTime = 0;
    soundJump.play();
}



//-------------------------------------------------------


//spawn functions
//spawns player, should only be used in game preperation
function spawnPlayer() {
    player = {
        size: basePlayerSize,
        x: basePlayerX,
        y: gameSize - basePlayerSize,
        color: basePlayerColor
    }
}

//spawns a new randomly sized obstacle just out of screen
function spawnNewObstacle() {
    var obstacle;
    var obstacleWidth = Math.round(gameSize / 500 * (Math.random() * 40 + 50));
    var obstacleHeight = Math.round(gameSize / 500 * (Math.random() * 50 + 70));
    if (globalXPosition > 25000 && currentJumpAc > 1.2) {
        obstacleHeight += 10;
        obstacleWidth += 10;
    }
    if (globalXPosition > 35000 && currentJumpAc > 1.4) {
        obstacleHeight += 15;
        obstacleWidth += 15;
        if (globalXPosition > 50000) {
            obstacleHeight += 5;
            obstacleWidth += 5;
        }
    }

    var oX = gameSize;
    obstacle = {
        x: gameSize * 1.05,
        y: gameSize - obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight
    }
    speedUp();
    obstacles.push(obstacle)
}

//spawns a new and random buff
function spawnNewRandomBuff() {
    var buff;
    var buffWidth = basePlayerSize / 2;
    var buffHeight = basePlayerSize / 2;
    var btype;
    var decider = Math.random();
    var bcolor;
    if ((decider > 0.85 && slowCounter < 5) || decider > 0.95) {
        btype = 1;
        bcolor = buffColorSlow;
    } else if (decider > 0.6 && currentJumpAc < 1.5) {
        btype = 2;
        bcolor = buffColorJumpPower
    } else if (decider > 0.35 && player.size > basePlayerSize * 0.5) {
        btype = 3;
        bcolor = buffColorShrink;
    } else {
        btype = 4;
        bcolor = buffColorJump;
    }
    var dir;
    if (Math.random() > 0.5) {
        dir = 1
    } else {
        dir = 0
    }
    buff = {
        x: gameSize * 1.1,
        y: gameSize - gameSize / 500 * (Math.random() * 150 + 15),
        width: buffWidth,
        height: buffHeight,
        type: btype,
        color: bcolor,
        direction: dir
    }

    buffs.push(buff)

}

function collectObstacle() {
    for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i];
        if (o.x < -o.width) {
            obstacles.splice(i, 1);
            var sizeMultiplier = (o.height * gameSize / 500) * (o.width * gameSize / 500) / 3000;
            var distanceMultiplier = globalXPosition / 25;
            var basePoints = 150;
            var totalPoints = Math.floor(basePoints + distanceMultiplier * sizeMultiplier);
            score += totalPoints;

            soundCollect.volume = currentSoundVolume*0.7;
            soundCollect.currentTime = 0;
            soundCollect.play();
            delete (o);
        }
    }
}



function collectBuffs() {
    for (var i = buffs.length - 1; i >= 0; i--) {
        var b = buffs[i];
        if (b.x < -b.width) {
            buffs.splice(i, 1);
            delete (b);
        }
    }
}




//-------------------------------------------------------


//draw functions
//draws everything
function drawAll() {
    eraseAll();
    drawBuffs();
    drawPlayerAfterimage();
    drawObstacles();
    if (gameState != 2) {
        drawPlayer();
    } else {
        drawLossParts();
    }
}

//draws the player sprite
function drawPlayer() {
    if (numOfExtraJumps > 0) {
        player.color = buffColorJump;
    } else {
        player.color = basePlayerColor;
    }
    drawRect(player.x, player.y, player.size, player.size, player.color)
}

//draws every obstacle currently created
function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        drawRect(o.x, o.y, o.width, o.height, baseObstacleColor);
    }
}

//draws every buff currently created
function drawBuffs() {
    for (var i = 0; i < buffs.length; i++) {
        var b = buffs[i];
        drawRect(b.x, b.y, b.width, b.height, b.color);
    }
}

//draws the player afterimage
function drawPlayerAfterimage() {

}

//draws a basic square with color
function drawRect(x, y, width, height, color) {
    canvas.fillStyle = color;
    canvas.fillRect(x, y, width, height);
}

function eraseAll() {
    canvas.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);
}

//loss functions
function drawLossParts() {
    for (var i = 0; i < playerLossParts.length; i++) {
        var o = playerLossParts[i];
        drawRect(o.x, o.y, o.width, o.height, o.color);
    }
}

function addLossParts() {
    var parts = 4;
    var sizeOfParts = player.size / parts;
    for (var i = 0; i < parts; i++) {
        for (var x = 0; x < parts; x++) {
            playerLossParts.push({
                x: player.x + sizeOfParts * x,
                y: player.y + sizeOfParts * i,
                width: sizeOfParts + 2,
                height: sizeOfParts + 2,
                color: basePlayerColor
            });
        }
    }
}

function startLossAnimation() {
    var index = 0;
    addLossParts();
    for (var i = playerLossParts.length - 1; i >= 0; i--) {
        index++;
        setTimeout(() => {
            playerLossParts.splice(i, 1)
        }, index * 40);
    };
}

function updateTextFields() {
    var percSize = Math.round(player.size / basePlayerSize * 100);
    htmlExtraJ.textContent = "EXTRA JUMPS: " + Math.floor(numOfExtraJumps);
    htmlJump.textContent = "JUMP POWER: " + Math.floor(currentJumpAc * 10) / 10;
    htmlSize.textContent = "SIZE: " + percSize + "%";
    htmlSpeed.textContent = "SPEED: " + Math.floor(speed * 10) / 10;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highscore", highScore);
    }
    htmlScore.textContent = numberWithDots(Math.floor(score));
    htmlHighscore.textContent = numberWithDots(Math.floor(highScore));
}

function numberWithDots(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
