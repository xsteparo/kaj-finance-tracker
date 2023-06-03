function Transaction(id, text, amount) {
    this.id = id;
    this.text = text;
    this.amount = amount;
}

const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");

let transactions = localStorage.getItem('transactions') !== null
    ? JSON
        .parse(localStorage.getItem('transactions'))
        .filter(transaction => transaction && transaction.id && transaction.text && transaction.amount)
        .map(transaction => new Transaction(transaction.id, transaction.text, transaction.amount))
    : [];

let ctx = document.getElementById('myChart').getContext('2d');
let myChart;

// Funkce createChart vytváří nový graf s využitím knihovny Chart.js
function createChart() {
    // Pokud již existuje instance grafu, je zničena
    if (myChart) {
        myChart.destroy();
    }

    // Vytvoření nové instance grafu
    myChart = new Chart(ctx, {
        // Typ grafu je nastaven na sloupcový graf
        type: 'bar',

        // Data pro graf jsou připravena
        data: {
            // Jako popisky osy X se použijí názvy transakcí
            labels: transactions.map(transaction => transaction.text),

            // Data pro graf jsou rozdělena do datasetů
            datasets: [{
                // Název datasetu je "Transactions"
                label: 'Transactions',

                // Hodnoty datasetu jsou množství transakcí
                data: transactions.map(transaction => transaction.amount),

                // Barva pozadí sloupců je nastavena podle toho, zda je množství transakce kladné nebo záporné
                backgroundColor: transactions.map(transaction => transaction.amount >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'),

                // Barva okraje sloupců je nastavena podle toho, zda je množství transakce kladné nebo záporné
                borderColor: transactions.map(transaction => transaction.amount >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),

                // Šířka okraje sloupců je nastavena na 1
                borderWidth: 1
            }]
        },

        // Možnosti grafu jsou nastaveny
        options: {
            scales: {
                y: {
                    // Osa Y začíná na nule
                    beginAtZero: true
                }
            }
        }
    });
}
let audio = new Audio('sound.mp3');
/**
 * Tato funkce zpracovává událost při odeslání formuláře pro přidání nové transakce.
 *
 * @param {Event} e - Událost odeslání formuláře.
 */
function addTransaction(e) {
    // Zabráníme výchozí akci odeslání formuláře
    e.preventDefault();

    // Zkontrolujeme, zda pole textu a částky jsou prázdná
    if (text.value.trim() === '' || amount.value.trim() === '') {
        // Zobrazíme upozornění, pokud jsou pole prázdná
        alert('prosím přidejte text a částku')
    } else {
        // Vytvoříme novou transakci
        const transaction = new Transaction(generateID(), text.value, +amount.value);

        // Přidáme transakci do pole transakcí
        transactions.push(transaction);

        // Přidáme transakce do historie prohlížeče
        window.history.pushState({ transactions }, '', '');

        // Přidáme transakci do DOM
        addTransactionDOM(transaction);

        // Aktualizujeme hodnoty
        updateValues();

        // Aktualizujeme lokální úložiště
        updateLocalStorage();

        // Vytvoříme graf
        createChart();

        // Vymažeme hodnoty vstupních polí
        text.value = '';
        amount.value = '';

        // Přehrajeme zvuk
        audio.play();
    }
}
// Generuje randomne id
function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

/**
 * Tato funkce přidává poskytnutou transakci do DOM.
 *
 * @param {Object} transakce - Objekt reprezentující transakci. Objekt transakce má následující vlastnosti:
 * @param {string} transakce.id - Unikátní identifikátor transakce.
 * @param {string} transakce.text - Popis transakce.
 * @param {number} transakce.amount - Měnová hodnota transakce. Záporná hodnota reprezentuje výdaje, zatímco kladná hodnota reprezentuje příjem.
 */
function addTransactionDOM(transakce) {
    // Určuje znaménko transakce: "-" pro výdaje a "+" pro příjmy.
    const sign = transakce.amount < 0 ? "-" : "+";

    // Vytvoří novou položku seznamu.
    const item = document.createElement("li");

    // Nastaví id transakce jako id položky.
    item.id = transakce.id;

    // Přidá třídu "minus" pro výdaje a "plus" pro příjmy.
    item.classList.add(transakce.amount < 0 ? "minus" : "plus");

    // Nastaví položku jako přetahovatelnou.
    item.setAttribute("draggable", "true");

    // Nastaví vnitřní HTML položky. Obsahuje text transakce, částku a tlačítko pro odstranění transakce.
    item.innerHTML = `
    ${transakce.text} <span>${sign}${Math.abs(transakce.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transakce.id})">x</button>
    `;

    // Přidá událost dragstart pro položku. Uloží id položky do přenosu dat.
    item.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", event.target.id);
    });

    // Přidá událost dragover pro položku. Zabrání výchozímu chování.
    item.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    // Přidá událost drop pro položku. Zabrání výchozímu chování a přesunou položky v transakcích.
    item.addEventListener("drop", (event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/plain");
        const draggedIndex = transactions.findIndex(transaction => transaction.id == draggedId);
        const droppedId = event.target.id;
        const droppedIndex = transactions.findIndex(transaction => transaction.id == droppedId);

        [transactions[draggedIndex], transactions[droppedIndex]] = [transactions[droppedIndex], transactions[draggedIndex]];

        // Aktualizuje data v localStorage a znovu načte stránku.
        updateLocalStorage();
        Init();
    });

    // Přidá položku do seznamu.
    list.appendChild(item);
}


function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `$${income}`;
    money_minus.innerText = `$${expense}`;
}

/**
 * This function removes a transaction from the DOM and updates the transactions list.
 *
 * @param {string} id - The unique identifier of the transaction to be removed.
 */
function removeTransaction(id) {
    // Obtain the DOM element corresponding to the transaction
    const targetTransaction = document.getElementById(id);

    // Set a CSS animation to smoothly transition the transaction element out of view
    targetTransaction.style.animation = "remove3d 1s forwards";

    // After the animation finishes (after 1 second), update the transactions list,
    // the browser's history state, and the local storage, and refresh the DOM
    setTimeout(() => {
        // Filter out the transaction to be removed from the transactions list
        transactions = transactions.filter(transaction => transaction.id !== id);

        // Update the browser's history state
        window.history.pushState({ transactions }, '', '');

        // Update the local storage
        updateLocalStorage();

        // Refresh the DOM
        Init();
    }, 1000);
}


function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function Init() {
    list.innerHTML = "";
    transactions.forEach(addTransactionDOM);
    updateValues();
    createChart();
}

Init();

form.addEventListener('submit', addTransaction);

// Listener pro událost 'popstate', která je vyvolána, když se změní stav historie prohlížeče
window.addEventListener('popstate', (event) => {
    // Zkontrolujeme, zda je v události definován stav (state)
    if(event.state) {
        // Aktualizujeme pole transakcí podle stavu historie prohlížeče
        transactions = event.state.transactions;

        // Re-inicializujeme aplikaci, aby se zobrazily aktualizované transakce
        Init();
    }
});
const myVideo = document.getElementById('myVideo');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');

playButton.addEventListener('click', function() {
    myVideo.play();
});

pauseButton.addEventListener('click', function() {
    myVideo.pause();
});
