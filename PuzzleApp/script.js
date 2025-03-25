// ========================
// Data
// ========================
const piecesData = [
  [[1,0,0],[1,0,0],[1,1,1]],
  [[0,2,0],[0,2,0],[2,2,2]],
  [[3,3,0],[0,3,0],[0,3,3]],
  [[4,0],[4,0],[4,4],[0,4]],
  [[5,0,5],[5,5,5]],
  [[6,6],[6,6],[6,0]],
  [[7,0],[7,0],[7,0],[7,7]],
  [[8,0],[8,8],[0,8]],
  [[9,0],[9,0],[9,9]],
  [[10],[10],[10],[10]]
];

const baseBoard = [
  [0,0,0,0,0,0,99],
  [0,0,0,0,0,0,99],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [99,99,99,99,0,0,0]
];

const my_dict = {
  "January": [0,0], "February": [0,1], "March": [0,2], "April": [0,3], "May": [0,4],
  "June": [0,5], "July": [1,0], "August": [1,1], "September": [1,2], "October": [1,3],
  "November": [1,4], "December": [1,5],
  "1": [2,0], "2": [2,1], "3": [2,2], "4": [2,3], "5": [2,4], "6": [2,5], "7": [2,6],
  "8": [3,0], "9": [3,1], "10": [3,2], "11": [3,3], "12": [3,4], "13": [3,5], "14": [3,6],
  "15": [4,0], "16": [4,1], "17": [4,2], "18": [4,3], "19": [4,4], "20": [4,5], "21": [4,6],
  "22": [5,0], "23": [5,1], "24": [5,2], "25": [5,3], "26": [5,4], "27": [5,5], "28": [5,6],
  "29": [6,0], "30": [6,1], "31": [6,2],
  "Sunday": [6,3], "Monday": [6,4], "Tuesday": [6,5], "Wednesday": [6,6],
  "Thursday": [7,4], "Friday": [7,5], "Saturday": [7,6]
};

const pieceColors = [
  "#FF6347", "#4682B4", "#32CD32", "#FFD700", "#8A2BE2",
  "#DC143C", "#FF1493", "#1E90FF", "#FF8C00", "#20B2AA"
];

// Global variables
let occupancy = [];
let nextPlacedId = 1;
let placedPieces = {};
let selectedPiece = null;
let remainingPieces = piecesData.length;
let currentDragPiece = null;
let currentDragMatrix = null;
let currentlyMovingPiece = null;
let originalPosition = null;

// ========================
// Helper Functions
// ========================

function rotateMatrix(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  let rotated = [];
  for (let j = 0; j < cols; j++) {
    rotated[j] = [];
    for (let i = rows - 1; i >= 0; i--) {
      rotated[j].push(matrix[i][j]);
    }
  }
  return rotated;
}

function flipMatrix(matrix) {
  return matrix.map(row => row.slice().reverse());
}

function canPlacePiece(matrix, startRow, startCol) {
  const tempOccupancy = JSON.parse(JSON.stringify(occupancy));
  
  // Remove current moving piece from temporary board
  if (currentlyMovingPiece) {
    for (let r = 0; r < occupancy.length; r++) {
      for (let c = 0; c < occupancy[r].length; c++) {
        if (tempOccupancy[r][c] === currentlyMovingPiece) {
          tempOccupancy[r][c] = baseBoard[r][c];
        }
      }
    }
  }

  // Check all matrix cells
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] !== 0) {
        const r = startRow + i;
        const c = startCol + j;

        // Boundary checks
        if (r < 0 || r >= tempOccupancy.length || c < 0 || c >= tempOccupancy[0].length) {
          return false;
        }

        // Check if cell is empty (0) and not a date cell (89) or permanent block (99)
        if (tempOccupancy[r][c] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}

function placePieceOnBoard(matrix, startRow, startCol, placedId, color) {
  if (currentlyMovingPiece) {
    removePlacedPiece(currentlyMovingPiece, false);
  }

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] !== 0) {
        let r = startRow + i, c = startCol + j;
        occupancy[r][c] = placedId;
        const cell = document.querySelector(`.spot[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.add("occupied");
          cell.style.backgroundColor = color;
          cell.dataset.placedId = placedId;
          cell.setAttribute('draggable', 'true');
          cell.addEventListener('dragstart', handlePlacedPieceDragStart);
          cell.onclick = () => { removePlacedPiece(placedId); };
          
          const label = cell.querySelector(".label");
          if (label) label.style.display = "none";
        }
      }
    }
  }
  
  placedPieces[placedId] = { 
    matrix: matrix,
    pieceIndex: currentDragPiece?.dataset.index || placedId % pieceColors.length, 
    color: color,
    row: startRow,
    col: startCol
  };
  
  if (!currentlyMovingPiece) remainingPieces--;
  checkPuzzleCompletion();
}

function checkPuzzleCompletion() {
  if (remainingPieces === 0) {
    alert("Congrats! Daily puzzle completed!");
  }
}

function removePlacedPiece(placedId, returnToPanel = true) {
  const pieceInfo = placedPieces[placedId];
  if (!pieceInfo) return;

  for (let r = 0; r < occupancy.length; r++) {
    for (let c = 0; c < occupancy[r].length; c++) {
      if (occupancy[r][c] == placedId) {
        occupancy[r][c] = baseBoard[r][c];
        const cell = document.querySelector(`.spot[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.remove("occupied");
          cell.style.backgroundColor = baseBoard[r][c] === 99 ? "black" : "#fff";
          cell.removeAttribute("data-placedId");
          cell.removeAttribute("draggable");
          cell.onclick = null;
          
          let hasLabel = false;
          for (let key in my_dict) {
            const [row, col] = my_dict[key];
            if (row == r && col == c) {
              hasLabel = true;
              const label = cell.querySelector(".label");
              if (label) label.style.display = "block";
              else {
                const newLabel = document.createElement("div");
                newLabel.classList.add("label");
                newLabel.textContent = key;
                cell.appendChild(newLabel);
              }
              break;
            }
          }
          if (!hasLabel) {
            const strayLabel = cell.querySelector(".label");
            if (strayLabel) strayLabel.remove();
          }
        }
      }
    }
  }

  if (returnToPanel) {
    addPieceToWorkspace(pieceInfo.pieceIndex, pieceInfo.matrix);
    remainingPieces++;
  }
  delete placedPieces[placedId];
}

// ========================
// Rendering Functions
// ========================

function createNewBoard() {
  const newBoard = baseBoard.map(row => row.slice());
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const currentDay = today.getDate().toString();
  const dayOfWeek = today.toLocaleString('default', { weekday: 'long' });

  [month, currentDay, dayOfWeek].forEach(key => {
    if (my_dict[key]) {
      const [row, col] = my_dict[key];
      newBoard[row][col] = 89;
    }
  });

  return newBoard;
}

function createBoard() {
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";
  occupancy = createNewBoard().map(row => row.slice());

  for (let r = 0; r < occupancy.length; r++) {
    for (let c = 0; c < occupancy[r].length; c++) {
      const cell = document.createElement("div");
      cell.classList.add("spot");
      cell.dataset.row = r;
      cell.dataset.col = c;
      
      cell.style.backgroundColor = occupancy[r][c] === 99 ? "black" :
                                occupancy[r][c] === 89 ? "silver" : "#fff";

      for (let key in my_dict) {
        const [row, col] = my_dict[key];
        if (row == r && col == c) {
          const label = document.createElement("div");
          label.classList.add("label");
          label.textContent = key;
          cell.appendChild(label);
        }
      }
      
      boardElement.appendChild(cell);
    }
  }
}

function createPieces() {
  const piecesElement = document.getElementById("pieces");
  piecesElement.innerHTML = "";
  
  piecesData.forEach((matrix, index) => {
    const pieceDiv = document.createElement("div");
    pieceDiv.classList.add("piece");
    pieceDiv.setAttribute("draggable", "true");
    pieceDiv.dataset.index = index;
    pieceDiv.currentMatrix = matrix;
    pieceDiv.tabIndex = 0;

    pieceDiv.style.cssText = `
      display: grid;
      grid-template-rows: repeat(${matrix.length}, 25px);
      grid-template-columns: repeat(${matrix[0].length}, 25px);
      height: ${matrix.length * 25}px;
      width: ${matrix[0].length * 25}px;
      background: transparent;
    `;

    matrix.forEach(row => row.forEach(cell => {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("piece-cell");
      if (cell !== 0) {
        cellDiv.classList.add("filled");
        cellDiv.style.backgroundColor = pieceColors[index];
      }
      cellDiv.style.border = "1px solid rgba(0,0,0,0.1)";
      pieceDiv.appendChild(cellDiv);
    }));

    pieceDiv.addEventListener("click", () => selectPiece(pieceDiv));
    pieceDiv.addEventListener("dragstart", handlePieceDragStart);
    pieceDiv.addEventListener("dragend", () => pieceDiv.classList.remove("dragging"));

    piecesElement.appendChild(pieceDiv);
  });
}

function handlePieceDragStart(e) {
  currentDragPiece = e.target;
  currentDragMatrix = currentDragPiece.currentMatrix;
  currentlyMovingPiece = null;
  
  e.dataTransfer.setData("isNewPiece", "true");
  currentDragPiece.classList.add("dragging");
}

function addPieceToWorkspace(pieceIndex, matrix) {
  const piecesElement = document.getElementById("pieces");
  const pieceDiv = document.createElement("div");
  pieceDiv.classList.add("piece");
  pieceDiv.setAttribute("draggable", "true");
  pieceDiv.dataset.index = pieceIndex;
  pieceDiv.currentMatrix = matrix;
  pieceDiv.tabIndex = 0;

  pieceDiv.style.cssText = `
    display: grid;
    grid-template-rows: repeat(${matrix.length}, 25px);
    grid-template-columns: repeat(${matrix[0].length}, 25px);
    height: ${matrix.length * 25}px;
    width: ${matrix[0].length * 25}px;
    background: transparent;
  `;

  matrix.forEach(row => row.forEach(cell => {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("piece-cell");
    if (cell !== 0) {
      cellDiv.classList.add("filled");
      cellDiv.style.backgroundColor = pieceColors[pieceIndex];
    }
    cellDiv.style.border = "1px solid rgba(0,0,0,0.1)";
    pieceDiv.appendChild(cellDiv);
  }));

  pieceDiv.addEventListener("click", () => selectPiece(pieceDiv));
  pieceDiv.addEventListener("dragstart", handlePieceDragStart);
  pieceDiv.addEventListener("dragend", () => pieceDiv.classList.remove("dragging"));

  piecesElement.appendChild(pieceDiv);
}

// ========================
// Drag and Drop Handling
// ========================

function handlePlacedPieceDragStart(e) {
  const placedId = parseInt(e.target.dataset.placedId);
  currentlyMovingPiece = placedId;
  originalPosition = placedPieces[placedId];
  currentDragMatrix = originalPosition.matrix;
  e.dataTransfer.setData("isNewPiece", "false");
}

function setupBoardDrop() {
  const board = document.getElementById("board");
  const CELL_SIZE = 60;

  board.addEventListener("dragover", e => {
    e.preventDefault();
    if (!currentDragMatrix) return;

    const rect = board.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const startCol = Math.floor(mouseX / CELL_SIZE);
    const startRow = Math.floor(mouseY / CELL_SIZE);

    highlightPlacement(currentDragMatrix, startRow, startCol);
  });

  board.addEventListener("drop", e => {
    e.preventDefault();
    removeHighlightPlacement();

    if (!currentDragMatrix) return;

    const rect = board.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const startCol = Math.floor(mouseX / CELL_SIZE);
    const startRow = Math.floor(mouseY / CELL_SIZE);

    if (canPlacePiece(currentDragMatrix, startRow, startCol)) {
      const isNewPiece = e.dataTransfer.getData("isNewPiece") === "true";
      const placedId = currentlyMovingPiece || nextPlacedId++;
      const color = isNewPiece ? pieceColors[currentDragPiece.dataset.index] : originalPosition.color;
      
      placePieceOnBoard(currentDragMatrix, startRow, startCol, placedId, color);
      if (isNewPiece) currentDragPiece.remove();
    } else if (currentlyMovingPiece) {
      placePieceOnBoard(originalPosition.matrix, originalPosition.row, originalPosition.col, currentlyMovingPiece, originalPosition.color);
    }
    
    currentlyMovingPiece = null;
    currentDragPiece = null;
    originalPosition = null;
  });
}

function highlightPlacement(matrix, startRow, startCol) {
  removeHighlightPlacement();
  matrix.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell !== 0) {
        const r = startRow + i;
        const c = startCol + j;
        
        if (r >= 0 && r < occupancy.length && c >= 0 && c < occupancy[0].length) {
          const cell = document.querySelector(`.spot[data-row="${r}"][data-col="${c}"]`);
          if (cell) {
            cell.classList.add(canPlacePiece(matrix, startRow, startCol) ? "valid-drop" : "invalid-drop");
          }
        }
      }
    });
  });
}

function removeHighlightPlacement() {
  document.querySelectorAll('.valid-drop, .invalid-drop').forEach(spot => {
    spot.classList.remove('valid-drop', 'invalid-drop');
  });
}

// ========================
// Keyboard & Selection Handling
// ========================

function selectPiece(pieceElem) {
  if (selectedPiece) selectedPiece.classList.remove("selected");
  selectedPiece = pieceElem;
  selectedPiece.classList.add("selected");
  selectedPiece.focus();
}

function updateSelectedPiece(newMatrix, pieceIndex) {
  selectedPiece.currentMatrix = newMatrix;
  selectedPiece.style.cssText = `
    display: grid;
    grid-template-rows: repeat(${newMatrix.length}, 25px);
    grid-template-columns: repeat(${newMatrix[0].length}, 25px);
    height: ${newMatrix.length * 25}px;
    width: ${newMatrix[0].length * 25}px;
  `;
  
  selectedPiece.innerHTML = "";
  newMatrix.forEach(row => row.forEach(cell => {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("piece-cell");
    if (cell !== 0) {
      cellDiv.classList.add("filled");
      cellDiv.style.backgroundColor = pieceColors[pieceIndex];
    }
    cellDiv.style.border = "1px solid rgba(0,0,0,0.1)";
    selectedPiece.appendChild(cellDiv);
  }));
}

document.addEventListener("keydown", e => {
  if (!selectedPiece) return;
  let matrix = selectedPiece.currentMatrix;
  const pieceIndex = selectedPiece.dataset.index;
  
  switch(e.key) {
    case "ArrowRight":
      matrix = rotateMatrix(matrix);
      break;
    case "ArrowLeft":
      matrix = rotateMatrix(rotateMatrix(rotateMatrix(matrix)));
      break;
    case " ":
      matrix = flipMatrix(matrix);
      e.preventDefault();
      break;
    default: return;
  }
  
  updateSelectedPiece(matrix, pieceIndex);
});

// ========================
// Initialization
// ========================

function init() {
  createBoard();
  createPieces();
  setupBoardDrop();
}

document.addEventListener("DOMContentLoaded", init);