// Consts
const LAND_MARKER = 0;              // indicator of empty cell in the mine field
const MINE_MARKER = 9;              // indicator of a mine cell in the mine field
const GRID_DIMS = [[8, 10], [14, 18], [20, 24]];    // field dimensions for each level [rows, columns]
const CELL_DIMS = [45, 35, 30];     // cell dimensions for each level
const MINES_COUNT = [10, 40, 99];   // number of mines in each level
const TRANS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];   // the translation matrix to get the eight surrounding cells
const NUM_COLORS = ['white', 'blue', 'green', 'red', 'purple', 'black', 'maroon', 'gray', 'turquoise'];
const MINE_COLORS = [['#DA3236', '#8E2123'], ['#F4840D', '#9F5607'], ['#F4C20E', '#9F7E09'], ['#008744', '#01582C'], ['#48E6F1', '#2F969D'], ['#4785ED', '#2F569A'], ['#ED44B5', '#9A2C76']];   // colors of mines shown when game lost

let level = 0;                      // game level: easy, medium, hard
let clock = 0;                      // game clock
let timerId = 0;                    // to be used with setInterval() to run the clock
let flagsPlanted = 0;               // number of flags planted by player
let firstClick = true;              // game has not started yet
let bestScores = [9999999, 9999999, 9999999];   // best time in each level

let mineField = [];     // 2D array: values: 0-9 (9 is a mine)
let mines = [];         // 2D array: values: [y, x] (the coordinate of a mine)
let revealed = [];      // 2D array: values: true, false (true has been revealed)
let flaggedCells = [];  // 2D array: values: [y, x] (the coordinate of a flagged cell)

// DOM objects
let levelMenu, fieldDiv, timerDiv, mineCounter;
let gameDiv, finalScreen, resultImg, scoreDiv, bestDiv, replayBtn;

document.addEventListener("DOMContentLoaded", function() {
    bestScores = initBestScores();
    gameDiv = document.querySelector('#game');
    levelMenu = document.querySelector('#level-menu');
    levelMenu.addEventListener('input', function(e) {
        startNewGame(e);
    }, false);
    timerDiv = document.querySelector('#timer');
    mineCounter = document.querySelector('#mine-count');
    fieldDiv = document.querySelector('#field');

    finalScreen = document.querySelector('#final-screen');
    resultImg = document.querySelector('#result-img');
    scoreDiv = document.querySelector('#score');
    bestDiv = document.querySelector('#best-score');
    replayBtn = document.querySelector('#replay');
    replayBtn.addEventListener('click', startNewGame);

    startNewGame();
    // showMines(mineField);
});

function startNewGame(event) {
    setLevel(levelMenu.value);
    generateFieldDOM();
    timerDiv.textContent = '000';
    mineCounter.textContent = MINES_COUNT[level];
    finalScreen.style.display = 'none';
}

function setLevel(lvl) {
    switch (lvl) {
        case 'easy':
            level = 0;
            break;
        case 'medium':
            level = 1;
            break;
        case 'hard':
            level = 2;
            break;
        default:
            level = 0
    }
    
    // set up a new game
    firstClick = true;
    flagsPlanted = 0;
    flaggedCells = [];
    clock = 0;
    if (timerId !== 0) {
        clearInterval(timerId);
    }
    
    revealed = resetRevealed(GRID_DIMS[level][1], GRID_DIMS[level][0]);
    // generate a new set of mines
    mines = generateMines(GRID_DIMS[level][1], GRID_DIMS[level][0], MINES_COUNT[level]);
    // create a mine field
    mineField = markMineSurroundings(generateMineField(GRID_DIMS[level][1], GRID_DIMS[level][0], mines));
}

function resetRevealed(width, height) {
    let r = [];
    for (let i = 0; i < height; i++) {
        r[i] = Array(width).fill(false);
    }
    return r;
}

// generateMines(width, height, mc) => an array of mine coordinates to be planted.
// width, height: dimensions of the mine field
// mc: number of mines to be planted
// return ms[[]]: the coordinates of the mines
function generateMines(width, height, mc) {
    let ms = [];
    let counter = 0;
    while (counter < mc) {
        let index = Math.floor(Math.random() * height * width);
        let [y, x] = [Math.floor(index / width), index % width];
        if (!ms.find(e => e[0] === y && e[1] === x)) {
            ms.push([y, x]);
            counter++;
        }
    }
    return ms;
}

// generateMines(width, height, mc) => an array of mine coordinates to be planted.
// width, height: dimensions of the mine field
// ms[[]]: an array of mine coordinates to be planted
// return mf[[]]: the mine field
function generateMineField(width, height, ms) {
    let mf = [];
    for (let i = 0; i < height; i++) {
        mf[i] = Array(width).fill(LAND_MARKER);
    }

    for (let i = 0; i < ms.length; i++) {
        mf[ms[i][0]][ms[i][1]] = MINE_MARKER;
    }
    return mf;
}

// mf[[]]: a filled mine field
// return target[[]]: mine field with mine surroundings marked
function markMineSurroundings(mf) {
    let height = mf.length;
    let width = mf[0].length;

    let target = [];
    // target = JSON.parse(JSON.stringify(mf));
    for (let i = 0; i < height; i++) {
        target[i] = Array(width).fill(0);
    }

    // isValid: takes coordinates of a cell (row and column).
    // Returns true if the coordinates fall within the field and the cell is not a mine.
    function isValid(y, x) {
        return x >= 0 && x < width && y >= 0 && y < height && mf[y][x] === 0;
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (mf[i][j] === MINE_MARKER) { // MINE_MARKER is assumed to be 9
                target[i][j] = MINE_MARKER;
                for (let k = 0; k < TRANS.length; k++) {
                    if (isValid(i + TRANS[k][0], j + TRANS[k][1])) {
                        target[i + TRANS[k][0]][j + TRANS[k][1]]++;
                    }
                }
            }
        }
    }
    return target;
}

function generateFieldDOM() {
    // set CSS variables
    document.documentElement.style.setProperty('--rowNum', GRID_DIMS[level][0]);
    document.documentElement.style.setProperty('--colNum', GRID_DIMS[level][1]);
    document.documentElement.style.setProperty('--cellDim', `${CELL_DIMS[level]}px`);
    document.documentElement.style.setProperty('--gameWidth', `${CELL_DIMS[level] * GRID_DIMS[level][1]}px`);

    fieldDiv.innerHTML = '';
    for (let i = 0; i < GRID_DIMS[level][0]; i++) {
        for (let j = 0; j < GRID_DIMS[level][1]; j++) {
            let cellDiv = document.createElement("div");
            cellDiv.setAttribute('data-index-y', i);
            cellDiv.setAttribute('data-index-x', j);
            cellDiv.classList.add('cell');
            if ((i + j) % 2 === 0) {
                cellDiv.classList.add('even');
            } else {
                cellDiv.classList.add('odd');
            }
            cellDiv.addEventListener('click', revealCell);
            cellDiv.addEventListener('contextmenu', flagCell, false);
            
            fieldDiv.append(cellDiv);
        }
    }
}

function updateClock() {
    clock++;
    timerDiv.textContent = ('00' + (clock)).slice(-3);
}

function revealCell(e) {
    if (firstClick) {
        firstClick = false;
        timerId = setInterval(updateClock, 1000);
    }
    let x = Number(this.dataset.indexX);
    let y = Number(this.dataset.indexY);
    if (revealed[y][x] === false && !this.classList.contains('flagged')) {
        if (!isMine(mineField, y, x)) {
            cascadeReveal(y, x);
        } else {
            // You lost!!!
            revealMine(y, x);
            shakeField(300);
            window.setTimeout(finishRound, 300, false);
            
        }
    }
}

function cascadeReveal(y, x) {
    revealed[y][x] = true;
    let cell = document.querySelector(`[data-index-y='${y}'][data-index-x='${x}']`)
    cell.classList.add('revealed');
    if (mineField[y][x] > 0) {
        cell.textContent = mineField[y][x];
        if (mineField[y][x] > 1) {
            cell.classList.add(NUM_COLORS[mineField[y][x]]);
        }
    } else {
        shakeField(300);
        for (let i = 0; i < TRANS.length; i++) {
            if (isExpandable(y + TRANS[i][0], x + TRANS[i][1])) {
                cascadeReveal(y + TRANS[i][0], x + TRANS[i][1]);
            }
        }
    }

    // isExpandable(): takes coordinates of a cell (row and column).
    // Returns true if the coordinates fall within the field and the cell is neither revealed nor a mine.
    function isExpandable(y, x) {
        return x >= 0 && x < GRID_DIMS[level][1] && y >= 0 && y < GRID_DIMS[level][0] && !revealed[y][x] && !isMine(mineField, y, x);
    }
}

function shakeField(duration) {
    fieldDiv.classList.add('shake');
    setTimeout(function(){ fieldDiv.classList.remove('shake') }, duration);
}

function flagCell(e) {
    e.preventDefault();

    let x = Number(this.dataset.indexX);
    let y = Number(this.dataset.indexY);

    if (revealed[y][x] === false) {
        if (this.classList.contains('flagged')) {
            this.classList.remove('flagged');
            flagsPlanted--;
            flaggedCells.splice(flaggedCells.findIndex(c => c[0] === y && c[1] === x),1);
            mineCounter.textContent = MINES_COUNT[level] - flagsPlanted;
        } else {
            this.classList.add('flagged');
            flagsPlanted++;
            flaggedCells.push([y, x]);
            mineCounter.textContent = MINES_COUNT[level] - flagsPlanted;
            if (checkVictory()) {
                // Game won!!!
                finishRound(true);
            }
        }
    }
    // should return false to prevent the default context menu
    return false;
}

function checkVictory() {
    if (flagsPlanted === MINES_COUNT[level]) {
        // check if all the coordinates stored in flaggedCells represent cell with mines
        return flaggedCells.every(e => mineField[e[0]][e[1]] === 9)
    }
    return false;
}

function revealMine(y, x) {
    let cell = document.querySelector(`[data-index-y='${y}'][data-index-x='${x}']`);
    let colorIndex = Math.floor(Math.random() * MINE_COLORS.length);
    cell.classList.add('mine');
    cell.style.backgroundColor = MINE_COLORS[colorIndex][0];
    cell.style.color = MINE_COLORS[colorIndex][1];
    cell.textContent = '●';
}

function revealMines() {
    let counter = 0;
    let revealIntervalID = window.setInterval(function() {
        revealMine(mines[counter][0], mines[counter][1]);
        counter++;
        if (counter === mines.length) {
            clearInterval(revealIntervalID);
        }
    }, 2000 / mines.length);
}

function finishRound(won) {
    clearInterval(timerId);
    if (won === true) {
        resultImg.setAttribute('src', './icons/win_screen.png');
        scoreDiv.textContent = ('00' + (clock)).slice(-3);
        if (clock < bestScores[level]) {
            bestScores[level] = clock;
            localStorage.setItem('minesweeperBestScores', JSON.stringify(bestScores));
        }
        bestDiv.textContent = ('00' + (bestScores[level])).slice(-3);
        document.documentElement.style.setProperty('--gameWidth', `${gameDiv.offsetWidth}px`);
        document.documentElement.style.setProperty('--gameHeight', `${gameDiv.offsetHeight}px`);
        finalScreen.style.display = 'block';
    } else {
        resultImg.setAttribute('src', './icons/lose_screen.png');
        scoreDiv.textContent = '— — —';
        bestDiv.textContent = bestScores[level] === 9999999 ? '— — —' : ('00' + (bestScores[level])).slice(-3);
        document.documentElement.style.setProperty('--gameWidth', `${gameDiv.offsetWidth}px`);
        document.documentElement.style.setProperty('--gameHeight', `${gameDiv.offsetHeight}px`);
        
        revealMines();
        let timeoutID = window.setTimeout(function() {
            finalScreen.style.display = 'block';
        }, 2000);
    }
    
}

function isMine(mf, y, x) {
    return mf[y][x] === MINE_MARKER ? true : false;
}

function initBestScores() {
    const scoreFromLocalStorage = JSON.parse(localStorage.getItem('minesweeperBestScores'));
    if (Array.isArray(scoreFromLocalStorage)) {
        return scoreFromLocalStorage;
    } else {
        return [9999999, 9999999, 9999999];
    }
}

// this function shows the values of all the cells. Used for debugging.
function showMines(mf) {
    const cells = document.querySelectorAll('div.cell');
    for (let i = 0; i < mf.length; i++) {
        for (let j = 0; j < mf[0].length; j++) {
            cells[i * mf[0].length + j].textContent = isMine(mf, i, j) ? 'X' : mf[i][j];
        }
    }
}