const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Game variables
let bird = { x: 50, y: 150, width: 20, height: 20, gravity: 0.08, lift: -2.2, velocity: 0 };
let pipes = [];
let frame = 0;
const pipeWidth = 20;
const basePipeGap = 150; // Base gap for pipes
let gameOver = false;
let score = 0; // Initialize score
let speedFactor = 1; // Initialize speed factor

// Timer variables
const timerDuration = 5000; // 5 seconds in milliseconds
let timer = timerDuration;
let modeChangeCounter = 0; // Counter to track mode changes

// Game mode variables
let gameMode = 'text'; // Start in text mode

// Color word variables
const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white'];
let currentWord = colors[Math.floor(Math.random() * colors.length)];
let currentWordColor = colors[Math.floor(Math.random() * colors.length)];

// Speech recognition variables
let recognition;
let spokenWord = '';
let isPenalized = false;
let isRecognitionActive = false; // Flag to track if recognition is active

// Initialize speech recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        spokenWord = event.results[0][0].transcript.toLowerCase();
        console.log('Recognized:', spokenWord);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        isRecognitionActive = false; // Reset flag when recognition ends
    };
}

// Add these variables to track key states
let keys = { up: false, down: false };

// Function to create a new pipe
function createPipe() {
    const pipeGap = basePipeGap + Math.random() * basePipeGap; // Random gap between base and twice the base
    const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap));
    pipes.push({ x: canvas.width, y: 0, width: pipeWidth, height: pipeHeight });
    pipes.push({ x: canvas.width, y: pipeHeight + pipeGap, width: pipeWidth, height: canvas.height - pipeHeight - pipeGap });
}

// Function to check for collision
function checkCollision() {
    for (let pipe of pipes) {
        if (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            bird.y < pipe.y + pipe.height &&
            bird.y + bird.height > pipe.y
        ) {
            return true;
        }
    }
    return false;
}

// Function to update game elements
function update(deltaTime) {
    if (!isPenalized) {
        if (keys.up) {
            bird.velocity = bird.lift;
        } else {
            bird.velocity += bird.gravity;
        }
        bird.y += bird.velocity; // Move the bird only if not penalized
    }

    // Create pipes every 200 frames, adjusted by speed factor
    if (frame % Math.floor(200 / speedFactor) === 0) {
        createPipe();
    }

    // Move pipes, adjusted by speed factor
    pipes.forEach(pipe => {
        pipe.x -= 1.5 * speedFactor;
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // Check for collision with pipes
    if (checkCollision()) {
        gameOver = true;
    }

    // Check for collision with canvas boundaries
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver = true;
    }

    // Increment score if game is not over
    if (!gameOver) {
        score++;
        // Increase speed factor slightly over time
        speedFactor += 0.0001;
    }

    // Update timer
    timer -= deltaTime;
    if (timer <= 0) {
        console.log("New timer cycle starting...");
        timer = timerDuration; // Reset timer every 5 seconds
        modeChangeCounter++;
        
        // Update game mode
        if (modeChangeCounter % 1 === 0) { // Change mode every 5 seconds aka timer refresh
            gameMode = Math.random() < 0.5 ? 'text' : 'color'; // Randomly pick between 'text' and 'color'
        }

        // Select a random word and color
        currentWord = colors[Math.floor(Math.random() * colors.length)];
        currentWordColor = colors[Math.floor(Math.random() * colors.length)];

        // Log the correct word based on the current game mode
        console.log(`Start of timer refresh: Game Mode: ${gameMode}, Word Text: ${currentWord}, Word Color: ${currentWordColor}`);

        // Start speech recognition
        spokenWord = '';
        if (!isRecognitionActive) {
            recognition.start();
            isRecognitionActive = true; // Set flag when recognition starts
        }

        // Stop speech recognition after 3 seconds
        setTimeout(() => {
            recognition.stop();
            console.log(`End of speech input: Detected Speech: ${spokenWord}`);
        }, 3000);

        // Process the audio and determine penalty after 4 seconds
        setTimeout(() => {
            if ((gameMode === 'text' && spokenWord !== currentWord) || 
                (gameMode === 'color' && spokenWord !== currentWordColor)) {
                isPenalized = true;
            } else {
                isPenalized = false; // Do not penalize if the guess is correct
            }
        }, 4000);

        // End penalty after 1 second
        setTimeout(() => {
            isPenalized = false;
        }, 5000);
    }

    // Reset frame counter
    frame++;
}

// Function to draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bird
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

    // Draw pipes
    ctx.fillStyle = 'green';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
    });

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '24px serif';
    const scoreText = `Score: ${score}`;
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, canvas.width - scoreWidth - 10, 30); // Adjusted position to top right

    // Draw timer as a health bar
    const barWidth = 100;
    const barHeight = 20;
    const barX = 10;
    const barY = 15;
    const fillWidth = (timer / timerDuration) * barWidth;

    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Draw a line at 1/5 of the timer bar
    const lineX1 = barX + (1 / 5) * barWidth;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(lineX1, barY);
    ctx.lineTo(lineX1, barY + barHeight);
    ctx.stroke();

    // Draw a line at 2/5 of the timer bar
    const lineX2 = barX + (2 / 5) * barWidth;
    ctx.beginPath();
    ctx.moveTo(lineX2, barY);
    ctx.lineTo(lineX2, barY + barHeight);
    ctx.stroke();

    // Draw game mode toggle
    ctx.font = '18px serif';
    ctx.fillStyle = 'black';
    ctx.fillText('Mode =  ', barX, barY + 40);
    ctx.fillText('Text', barX + 60, barY + 40);
    ctx.fillText('Color', barX + 120, barY + 40);

    // Highlight current mode
    if (gameMode === 'text') {
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(barX + 115, barY + 25, 60, 25);
    } else {
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(barX + 55, barY + 25, 50, 25);
    }

    // Draw color word
    ctx.font = '36px serif';
    ctx.fillStyle = currentWordColor;
    ctx.fillText(currentWord, barX + 20, barY + 80);
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!gameOver) {
        update(deltaTime);
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '48px serif';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
    }
}

// Event listeners for bird controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
        keys.up = true;
    }
    // Remove or comment out the down key functionality
    // if (e.code === 'ArrowDown') {
    //     keys.down = true;
    // }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp') {
        keys.up = false;
    }
    // Remove or comment out the down key functionality
    // if (e.code === 'ArrowDown') {
    //     keys.down = false;
    // }
});

// Add touch event listeners for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    keys.up = true;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    keys.up = false;
});

// Start button event listener
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; // Hide the start screen
    requestAnimationFrame(gameLoop); // Start the game loop
}); 