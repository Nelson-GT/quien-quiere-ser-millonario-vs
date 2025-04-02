const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const feedbackElement = document.getElementById('feedback');
const errorElement = document.getElementById('error');
const timerFillElement = document.getElementById('timer-fill');
const startButton = document.getElementById('start-button');
const moneyLadderElement1 = document.getElementById('money-ladder-1');
const moneyLadderElement2 = document.getElementById('money-ladder-2');
const moneyLadder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const keyMap = {
    q: 0,
    w: 1,
    a: 2,
    s: 3,
    i: 0,
    o: 1,
    k: 2,
    l: 3
};
const playerKeys = {
    0: ['q', 'w', 'a', 's'],
    1: ['i', 'o', 'k', 'l']
};
let questionAnswered = false;
// Inicia el juego cuando se presiona el botón "Start"
startButton.addEventListener('click', startGame);

/**
 * Configura e inicia el juego, reiniciando valores clave.
 */
function startGame() {
    let continuar = true;
    let questions = [];
    let currentQuestion;
    let timer;
    let timeLeft = 10;
    let playerAnswers = [,];
    let gameStarted = false;
    let gameEnded = false;
    let scores = [0, 0];
    let currentLadderIndex = [0, 0];
    let options = [];
    startButton.style.display = 'none';
    gameStarted = true;
    gameEnded = false;
    resetMoneyLadders();
    getQuestions();
    // Detecta las teclas presionadas para responder preguntas
    document.getElementById("ganador-concurso").innerHTML = ''
    document.addEventListener('keydown', function (event) {
        if (!gameStarted || gameEnded) return;

        const key = event.key.toLowerCase();
        let playerIndex = -1;

        if (playerKeys[0].includes(key)) {
            playerIndex = 0;
        } else if (playerKeys[1].includes(key)) {
            playerIndex = 1;
        }

        if (playerIndex !== -1) {
            const selectedIndex = keyMap[key];
            if (selectedIndex !== undefined && playerAnswers[playerIndex] === null) {
                playerAnswers[playerIndex] = selectedIndex;
                handleAnswer(playerIndex, selectedIndex);
            }
        }
    });
    /**
    * Actualiza la visualización de la escalera de dinero en la interfaz.
    */
    function updateMoneyLadderDisplay() {
        const ladderItems1 = moneyLadderElement1.querySelectorAll('li');
        const ladderItems2 = moneyLadderElement2.querySelectorAll('li');
        ladderItems1.forEach(item => item.classList.remove('current'));
        ladderItems2.forEach(item => item.classList.remove('current'));
        ladderItems1[currentLadderIndex[0]].classList.add('current');
        ladderItems2[currentLadderIndex[1]].classList.add('current');
    }
    // Restablece la escalera de dinero para ambos jugadores.
    function resetMoneyLadders() {
        const ladderItems1 = moneyLadderElement1.querySelectorAll('li');
        const ladderItems2 = moneyLadderElement2.querySelectorAll('li');
        ladderItems1.forEach(item => item.classList.remove('current'));
        ladderItems2.forEach(item => item.classList.remove('current'));
        updateMoneyLadderDisplay();
    }
    //Obtiene las preguntas del servidor y las prepara para el juego.
    async function getQuestions() {
        try {
            const response = await fetch('http://localhost:8000/datos.json'); // Ensure the correct relative path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.response_code === 0 && Array.isArray(data.results)) {
                questions = filterQuestions(data.results);
                shuffleArray(questions);
                loadQuestion();
            } else {
                console.error("Unexpected data format:", data);
            }
        } catch (error) {
            console.error("Ha ocurrido un error al obtener las preguntas:", error);
        }
    }
    // Filtra preguntas para evitar caracteres especiales que puedan causar errores.
    function filterQuestions(questions) {
        return questions.filter(q =>
            !q.question.includes('&') &&
            !q.incorrect_answers.some(a => a.includes('&')) &&
            !q.correct_answer.includes('&')
        );
    }
    //Carga la siguiente pregunta del juego.
    function loadQuestion() {
        if (questions.length === 0 || gameEnded) {
            endGame();
            return;
        }
        questionAnswered = false;
        currentQuestion = questions.pop();
        questionElement.innerText = currentQuestion.question;
        optionsElement.innerHTML = '';
        feedbackElement.innerHTML = '';
        options = [...currentQuestion.incorrect_answers, currentQuestion.correct_answer];
        shuffleArray(options);
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.innerText = `${index + 1}. ${option} `;
            const player1Key = playerKeys[0][index];
            const player2Key = playerKeys[1][index];
            optionElement.innerHTML = `<span class="player1-key">${player1Key.toUpperCase()}</span> ${optionElement.innerText} <span class="player2-key">${player2Key.toUpperCase()}</span>`;
            optionElement.dataset.index = index;
            optionsElement.appendChild(optionElement);
        });
        playerAnswers = [null, null];
        moneyLadderElement1.querySelectorAll('li').forEach(li => li.classList.remove('player1-answered'));
        moneyLadderElement2.querySelectorAll('li').forEach(li => li.classList.remove('player2-answered'));
        startTimer();
    }
    //Inicia el temporizador para la pregunta actual.
    function startTimer() {
        if (continuar) {
            clearInterval(timer); // Asegura que no haya temporizadores previos corriendo
            timeLeft = 15; // Reinicia el tiempo a 15 segundos antes de cada nueva pregunta
            updateTimerDisplay();
            timer = setInterval(() => {
                timeLeft -= 0.1;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    endQuestion();
                }
            }, 100);
        }
    }
    function updateTimerDisplay() {
        const fillPercentage = (timeLeft / 15) * 100;       // si se desea cambiar el tiempo, cambiar aquí (15 = segundos)
        timerFillElement.style.transform = `scaleY(${fillPercentage / 100})`;
    }
    // Maneja la respuesta del jugador y actualiza la puntuación y la escalera de dinero.
    function handleAnswer(playerIndex, selectedIndex) {
        if (!gameStarted || gameEnded) return;
        const correctAnswerIndex = options.indexOf(currentQuestion.correct_answer);
        if (questionAnswered) {
            return;
        }
        const ladderItems = (playerIndex === 0) ? moneyLadderElement1.querySelectorAll('li') : moneyLadderElement2.querySelectorAll('li');
        ladderItems.forEach(li => li.classList.remove((playerIndex === 0) ? 'player1-answered' : 'player2-answered'));
        if (selectedIndex === correctAnswerIndex) {
            if (!questionAnswered) {
                scores[playerIndex]++;
                currentLadderIndex[playerIndex] = Math.min(currentLadderIndex[playerIndex] + 1, moneyLadder.length - 1);
    
                ladderItems[currentLadderIndex[playerIndex]].classList.add((playerIndex === 0) ? 'player1-answered' : 'player2-answered');
            }
            questionAnswered = true;
    
            if (scores[playerIndex] >= 10) {
                endGame(playerIndex); // Modificado: se indica qué jugador ha ganado.
            } else {
                endQuestion();
            }
        } else {
            playerAnswers[playerIndex] = false;
            if (playerAnswers[0] === false && playerAnswers[1] === false) {
                endQuestion();
            }
        }
        updateMoneyLadderDisplay();
    }
    // Finaliza la pregunta y muestra la respuesta correcta.
    function endQuestion() {
        clearInterval(timer); // Detiene el temporizador de la pregunta actual
        revealCorrectAnswer();
        setTimeout(() => {
            clearInterval(timer); // Asegura que el temporizador esté completamente detenido antes de la siguiente pregunta
            loadQuestion();
        }, 3500); // Mantiene la pausa de 3.5 segundos antes de la próxima pregunta
    }
    // Revela la respuesta correcta al final de la pregunta.
    function revealCorrectAnswer() {
        const correctAnswerIndex = options.indexOf(currentQuestion.correct_answer);
        const optionElements = optionsElement.querySelectorAll('div');
        optionElements.forEach((optionElement, index) => {
            if (index == correctAnswerIndex) {
                optionElement.classList.add('correct-answer');
            }
        });
    }
    // Finaliza el juego y muestra los resultados finales.
    function endGame(winningPlayer) {
        continuar = false;
        gameStarted = false;
        gameEnded = true;
        questionElement.innerText = `Fin del Juego! Puntuación Jugador 1: ${scores[0]}, Puntuación Jugador 2: ${scores[1]}`;
        if (winningPlayer !== undefined) {
            document.getElementById("ganador-concurso").innerHTML = `¡Jugador ${winningPlayer + 1} ha conseguido 100.000$!`;
        }
        timerFillElement.style = `scaleY(${100})`;
        optionsElement.innerHTML = '';
        feedbackElement.innerText = '';
        startButton.style.display = 'block';
    }
    function shuffleArray(array) { // función para mezclar el array de preguntas
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}