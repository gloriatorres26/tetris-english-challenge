let playerNameInput = document.getElementById("playerName");

let playerName = "";

let roomCode="";

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");

const music = document.getElementById("music");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

const lineSound = new Audio("lineclear.mp3");
lineSound.volume = 0.6;

const startBtn=document.getElementById("startBtn");

const startScreen=document.getElementById("startScreen");

let gameStarted=false;

let gamePaused = false;

// ===== QUIZ TIMER =====
let quizTimer;
let quizTimeLimit = 5;

let fallSpeed = 700; // velocidad normal

let speedIncreaseCount = 0; // cuántas veces aumentó velocidad
let maxSpeedIncreases = 2;  // máximo permitido

let speedPenalty = 20; // cuánto acelera cuando responde mal
let minSpeed = 400;     // velocidad mínima permitida

// ===== GAME TIMER (TIEMPO TOTAL DEL JUEGO) =====
let gameTimeLimit = 480; // 8 minutos
let gameTimer;
let gameTimeLeft;

let score=0;

let firstTryScore = null;
let secondTryScore = null;
let currentTry = 1;

let lastPieceIndex = null;

let piecesForQuiz = 3;  // empieza cada 3 fichas
let pieceCounter = 0;   // contador de fichas

const COLS=10;
const ROWS=20;
const SIZE=30;

let board = Array.from({length:ROWS},()=>Array(COLS).fill(0));

const colors=[
null,
"cyan",
"yellow",
"purple",
"green",
"red",
"blue",
"orange"
];

const pieces=[

[[1,1,1,1]],

[[2,2],[2,2]],

[[0,3,0],[3,3,3]],

[[0,4,4],[4,4,0]],

[[5,5,0],[0,5,5]],

[[6,0,0],[6,6,6]],

[[0,0,7],[7,7,7]]

];

function drawSquare(x,y,color){

ctx.fillStyle=color;

ctx.fillRect(x*SIZE,y*SIZE,SIZE,SIZE);

ctx.strokeRect(x*SIZE,y*SIZE,SIZE,SIZE);

}

function drawGrid(){

for(let y=0; y<=ROWS; y++){
for(let x=0; x<=COLS; x++){

// brillo suave que cambia cada frame
let alpha = 0.15 + Math.random()*0.35;

ctx.beginPath();
ctx.arc(
x*SIZE,   // esquina horizontal
y*SIZE,   // esquina vertical
1.5,
0,
Math.PI*2
);

ctx.fillStyle = "rgba(255,255,255,"+alpha+")";
ctx.fill();

}
}

}

function drawBoard(){

ctx.clearRect(0,0,canvas.width,canvas.height);

drawGrid(); // ⭐ dibuja estrellas primero

board.forEach((row,y)=>{
row.forEach((value,x)=>{
if(value){
drawSquare(x,y,colors[value]);
}
})
})

}

let piece=randomPiece();

function randomPiece(){

let newIndex;

do{
    newIndex = Math.floor(Math.random()*pieces.length);
}while(newIndex === lastPieceIndex);

lastPieceIndex = newIndex;

let baseShape = pieces[newIndex];

// 🔥 CLONAR forma
let newShape = baseShape.map(row => [...row]);

// 🎨 COLOR RANDOM
let randomColor = Math.floor(Math.random()*7) + 1;

newShape = newShape.map(row =>
    row.map(val => val ? randomColor : 0)
);

return{
    shape:newShape,
    x:3,
    y:0
}

}

function merge(){

piece.shape.forEach((row,y)=>{

row.forEach((value,x)=>{

if(value){

board[y+piece.y][x+piece.x]=value;

}

})

})

score+=10;
scoreText.innerText=score;

pieceCounter++;

if(pieceCounter >= piecesForQuiz){
    pieceCounter = 0;
    showQuiz();
}

clearLines();

piece=randomPiece();

if(collide()){

gameOver();

}

}

// ===== BORRAR FILAS ESTILO TETRIS ===== 
function clearLines(){

for(let y = ROWS - 1; y >= 0; y--){

    if(board[y].every(value => value !== 0)){

        // 🔊 SONIDO
        lineSound.currentTime = 0;
        lineSound.play();

        // ✨ EFECTO VISUAL
        canvas.style.boxShadow = "0 0 25px cyan";
        setTimeout(() => {
            canvas.style.boxShadow = "none";
        }, 120);

        // eliminar fila llena
        board.splice(y,1);

        // agregar nueva fila vacía arriba
        board.unshift(Array(COLS).fill(0));

        score += 50; // puntos extra por línea
        scoreText.innerText = score;

        // 👇 contar como ficha para el sistema de preguntas
        pieceCounter++;

        if(pieceCounter >= piecesForQuiz){
            pieceCounter = 0;
            showQuiz();
        }

        y++; // revisar misma fila otra vez
    }

}

}

function collide(){

return piece.shape.some((row,y)=>{

return row.some((value,x)=>{

return value && (

board[y+piece.y]?.[x+piece.x]!==0

)

})

})

}

function drawPiece(){

piece.shape.forEach((row,y)=>{

row.forEach((value,x)=>{

if(value){

drawSquare(

x+piece.x,

y+piece.y,

colors[value]

)

}

})

})

}

function update(){

// evita salir por izquierda
if(piece.x<0){

piece.x=0;

}

// evita salir por derecha
if(piece.x+piece.shape[0].length>COLS){

piece.x=COLS-piece.shape[0].length;

}

piece.y++;

if(collide()){

piece.y--;

merge();

}

drawBoard();

drawPiece();


}

let gameLoop;

startBtn.onclick=()=>{

let name = playerNameInput.value.trim();
let room = document.getElementById("roomCode").value.trim();

// ✅ validar datos obligatorios
if(name==="" || room===""){
alert("⚠ Please write your Name AND Class Code");
return;
}

// ✅ efecto visual gamer inmediato
startBtn.classList.add("startAnim");
startBtn.style.transform="scale(1.1)";
startBtn.style.boxShadow="0 0 20px cyan";

// 🔥 reproducimos sonido Y esperamos que termine
playStartSound(()=>{

// 🔥 cuando termina el sonido recién inicia el juego

playerName = name;
roomCode = room;

activateRealtimeRanking();

// registrar jugador con 0 puntos desde el inicio
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: 0
});

startScreen.style.display="none";

music.volume=.4;
music.play();

gameStarted = true;

gameLoop = setInterval(update,700);

startGameTimer();

});

};
document.addEventListener("keydown",e=>{

if(!gameStarted)return;


// IZQUIERDA

if(e.key==="ArrowLeft"){

piece.x--;

if(collide()){

piece.x++; // vuelve atrás si choca

}

}

// DERECHA

if(e.key==="ArrowRight"){

piece.x++;

if(collide()){

piece.x--; // vuelve atrás

}

}

// ABAJO

if(e.key==="ArrowDown"){

piece.y++;

if(collide()){

piece.y--;

merge(); // fija pieza

}

}


// ⭐ ROTAR con espacio

if(e.code==="Space"){

rotatePiece();

}

});



// ---------- QUIZ ----------

const quiz=document.getElementById("quiz");

const questionText=document.getElementById("question");

const answers=document.getElementById("answers");

let questions=[];

async function loadQuestions(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vSuZY8I3EBxrL3tML7ABICEOr2WxHuCi88co-0K0C_U7KBmqulqSHjuJnfSIrHayaVWsAEkKVmsK-mA/pub?output=csv";

let res=await fetch(url);

let text=await res.text();

let rows=text.split("\n").slice(1);

questions=rows.map(row=>{

let cols=row.split(",");

return{

q:cols[0],

a:[cols[1],cols[2],cols[3]],

correct:Number(cols[4])

};

});

}

loadQuestions();

setTimeout(()=>{
console.log("Preguntas cargadas:", questions);
},2000);

function showQuiz(){

// ✅ PROTECCIÓN 1: si no hay preguntas, no abrir quiz
if(!questions || questions.length === 0){
    console.log("⚠ No hay preguntas cargadas");
    return;
}

// pausa juego
clearInterval(gameLoop);

quiz.classList.remove("hidden");

// elegir pregunta aleatoria
let q = questions[Math.floor(Math.random()*questions.length)];

// ✅ PROTECCIÓN 2: evitar error si algo salió mal
if(!q || !q.q || !q.a){
    console.log("⚠ Pregunta inválida:", q);
    return;
}

questionText.innerText = q.q;
answers.innerHTML = "";

q.a.forEach((ans,i)=>{

let b = document.createElement("button");
b.innerText = ans;

b.onclick = ()=>{

answers.innerHTML="";

let result=document.createElement("div");
result.className="answerResult";

if(i===q.correct){

clearInterval(quizTimer);

correctSound.play();

updateRanking();

score+=30;

piecesForQuiz = 4;

result.innerText="✅ CORRECT ANSWER";

}else{

wrongSound.play();
score-=10;

piecesForQuiz = 6;

// 🔥 acelerar caída suavemente
if(speedIncreaseCount < maxSpeedIncreases){

    fallSpeed -= speedPenalty;

    if(fallSpeed < minSpeed){
        fallSpeed = minSpeed;
    }

    speedIncreaseCount++;

    clearInterval(gameLoop);
    gameLoop = setInterval(update, fallSpeed);
}

result.innerText="❌ WRONG ANSWER";
}

answers.appendChild(result);

scoreText.innerText=score;

setTimeout(()=>{

quiz.classList.add("hidden");

clearInterval(gameLoop);
gameLoop = setInterval(update, fallSpeed);

},1500);

};

answers.appendChild(b);

});
}


function startQuizTimer(){

let timeLeft = quizTimeLimit;

quizTimer = setInterval(()=>{

timeLeft--;

if(timeLeft <= 0){

clearInterval(quizTimer);

// ❌ no respondió → aumenta velocidad
if(speedIncreaseCount < maxSpeedIncreases){

    fallSpeed -= speedPenalty;

    if(fallSpeed < minSpeed){
        fallSpeed = minSpeed;
    }

    speedIncreaseCount++;

    clearInterval(gameLoop);
    gameLoop = setInterval(update, fallSpeed);
}

hideQuiz(); // usa tu función actual para cerrar quiz

}

},1000);

}

function playStartSound(callback){

let audio = new Audio("start.mp3");
audio.volume = 0.5;
audio.play();

audio.onended = function(){
    if(callback){
        callback();
    }
};

}

function showIntroAnimation(){

let intro = document.createElement("div");

intro.id = "introScreen";

intro.innerHTML = "READY<br>PLAYER ONE";

document.body.appendChild(intro);

// quitar después de 2.5 segundos
setTimeout(()=>{
intro.remove();
},2500);

}

function startGameTimer(){

gameTimeLeft = gameTimeLimit;

gameTimer = setInterval(()=>{

gameTimeLeft--;

document.getElementById("gameTimerDisplay").innerText = gameTimeLeft;

if(gameTimeLeft <= 0){
    clearInterval(gameTimer);
    endGameByTime();
}

},1000);

}

function endGameByTime(){

clearInterval(gameLoop);

let gameOverDiv = document.getElementById("gameOver");

gameOverDiv.innerHTML = "<h1 class='timeOver'>TIME OVER</h1>";

gameOverDiv.classList.remove("hidden");

}

function gameOver(){

let overSound = new Audio("gameover.mp3");
overSound.volume = 0.6;
overSound.play();

clearInterval(gameLoop);

// 🔥 guardar primer intento
if(firstTryScore === null){
   firstTryScore = score;
   updateTryTables();
}else{
   secondTryScore = score;
   updateTryTables();
}
    
document.getElementById("gameOver")
.classList.remove("hidden");

}

function rotatePiece(){

let rotated = piece.shape[0].map((_,i)=>

piece.shape.map(row=>row[i]).reverse()

);

let oldShape = piece.shape;

piece.shape = rotated;


// evita atravesar paredes

if(collide()){

piece.shape = oldShape;

}

}

// -------- RANKING FIREBASE --------

function updateRanking(){

if(!playerName || !roomCode) return;

players[playerName]=score;

drawRanking();

// 🔥 Guardar en Firebase
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: score
});

}

let players={};

function drawRanking(){

   let list = document.getElementById("playersList");
   if(!list) return;

   list.innerHTML = "";

   Object.values(players)
   .sort((a,b)=> b.score - a.score)
   .forEach((player,index)=>{

      let li = document.createElement("li");
li.className = "player";

if(player.name === playerName){
li.classList.add("currentPlayer");
}

      li.innerHTML =
         "<span>"+(index+1)+". "+player.name+"</span>" +
         "<span>"+player.score+"</span>";

      list.appendChild(li);

   });

}

function saveTryScore(){

if(currentTry === 1){

firstTryScore = score;
document.getElementById("firstTryScore").innerText = firstTryScore;

currentTry = 2;

}else{

secondTryScore = score;
document.getElementById("secondTryScore").innerText = secondTryScore;

}

}

function updateTryTables(){

let firstTable = document.getElementById("firstTryScore");
let secondTable = document.getElementById("secondTryScore");

if(firstTable){
   firstTable.innerText = firstTryScore ?? "-";
}

if(secondTable){
   secondTable.innerText = secondTryScore ?? "-";
}

}

document.addEventListener("keydown", function(e){

if(e.key === "m"){

let newTime = prompt("Set game time (seconds):");

if(newTime){
gameTimeLimit = parseInt(newTime);
document.getElementById("gameTimerDisplay").innerText = gameTimeLimit;
}

}


});

// -------- REALTIME RANKING --------

function activateRealtimeRanking(){

   if(!roomCode || roomCode === "") return;

   firebase.database()
   .ref("rooms/"+roomCode+"/players")
   .on("value", function(snapshot){

      players = snapshot.val() || {};
      drawRanking();

   });

}

function playAgain(){

saveTryScore();

score = 0;
scoreText.innerText = score;

// resetear score en ranking también
firebase.database()
.ref("rooms/"+roomCode+"/players/"+playerName)
.set({
   name: playerName,
   score: 0
});
    
board = Array.from({length:ROWS},()=>Array(COLS).fill(0));

piece = randomPiece();

pieceCounter = 0;

fallSpeed = 700;
speedIncreaseCount = 0;

document.getElementById("gameOver").classList.add("hidden");

clearInterval(gameLoop);
gameLoop = setInterval(update, fallSpeed);

}









