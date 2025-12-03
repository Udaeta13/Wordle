// js/comportamiento.js

const palabraSecreta = "PERRO"; // pon la que quieras
let filaActual = 0;
const filas = document.querySelectorAll(".fila");

// Inicializar listeners en todas las filas (solo necesidades de movimiento/input)
filas.forEach((fila, filaIndex) => {
    const inputs = Array.from(fila.querySelectorAll("input"));

    inputs.forEach((input, i) => {
        // Forzar mayúscula y limitar a 1 carácter, además de avanzar si corresponde
        input.addEventListener("input", (e) => {
            // normalizar valor
            input.value = (input.value || "").toUpperCase().slice(0, 1);

            // Si se ha escrito 1 carácter y no es la última casilla → avanzar foco
            if (input.value.length === 1 && i < inputs.length - 1) {
                inputs[i + 1].focus();
            }
        });

        // PREVENCIÓN de caracteres no alfabéticos con keydown (opcional)
        input.addEventListener("keypress", (e) => {
            // permitir solo letras
            if (!/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
});

// Manejo de teclas globalmente (solo actuará cuando el target sea un input)
document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!target || target.tagName !== "INPUT") return;

    const fila = target.parentElement;
    const inputs = Array.from(fila.querySelectorAll("input"));
    const index = inputs.indexOf(target);

    // BACKSPACE: si el input está vacío, retrocede al anterior y borra
    if (event.key === "Backspace") {
        // Si tiene valor, dejar que el navegador lo borre (no interferimos)
        if (target.value === "") {
            if (index > 0) {
                event.preventDefault(); // prevenimos el comportamiento por seguridad
                inputs[index - 1].focus();
                inputs[index - 1].value = "";
            }
        }
        return;
    }

    // ENTER: queremos comprobar la fila.
    // Usamos setTimeout 0 para asegurarnos de que cualquier evento 'input'
    // que esté aún por procesar (ej: al escribir la 5ª letra) termine primero.
    if (event.key === "Enter") {
        event.preventDefault();
        setTimeout(() => {
            comprobarFila();
        }, 0);
    }
});

// Función que comprueba la fila actual (colores y avance)
function comprobarFila() {
    const filasNode = document.querySelectorAll(".fila");
    const fila = filasNode[filaActual];
    if (!fila) return;

    const inputs = Array.from(fila.querySelectorAll("input"));

    // Construir la palabra tal cual están los inputs AHORA
    const intentoArr = inputs.map(inp => (inp.value || "").toUpperCase().trim());
    const intento = intentoArr.join("");

    // Comprobar que no haya inputs vacíos
    const hayVacio = intentoArr.some(ch => ch === "" || ch.length !== 1);
    if (hayVacio) {
        alert("Debes introducir las 5 letras antes de pulsar ENTER.");
        // enfocar el primer vacío para ayudar al usuario
        const primerVacio = inputs.find(inp => !inp.value);
        if (primerVacio) primerVacio.focus();
        return;
    }

    // Lógica de colores: verdes primero, luego amarillos (respetando repeticiones)
    const estado = Array(5).fill(""); // "verde","amarillo","gris"
    const secretoArray = palabraSecreta.split("");
    const usado = Array(5).fill(false);

    // 1) Verdes
    for (let i = 0; i < 5; i++) {
        if (intentoArr[i] === secretoArray[i]) {
            estado[i] = "verde";
            usado[i] = true;
        }
    }

    // 2) Amarillos
    for (let i = 0; i < 5; i++) {
        if (estado[i] === "") {
            const letra = intentoArr[i];
            let encontrado = false;
            for (let j = 0; j < 5; j++) {
                if (!usado[j] && secretoArray[j] === letra) {
                    encontrado = true;
                    usado[j] = true;
                    break;
                }
            }
            estado[i] = encontrado ? "amarillo" : "gris";
        }
    }

    // Aplicar clases y bloquear inputs de esa fila
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].classList.add(estado[i]);
        inputs[i].classList.add("desactivada");
        inputs[i].disabled = true;
    }

    // Si acertó, notificar y terminar
    if (estado.every(s => s === "verde")) {
        setTimeout(() => alert("¡Correcto!"), 50);
        return;
    }

    // Avanzar filaActual y enfocar la primera casilla de la siguiente (si existe)
    filaActual++;
    if (filaActual < filasNode.length) {
        const siguienteFila = filasNode[filaActual];
        const primerInput = siguienteFila.querySelector("input");
        if (primerInput) primerInput.focus();
    } else {
        setTimeout(() => alert("Se acabaron los intentos. La palabra era: " + palabraSecreta), 50);
    }
}
