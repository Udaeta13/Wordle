// PALABRA OBJETIVO (temporal)
const palabraSecreta = "GATOS".toUpperCase();

const filas = document.querySelectorAll(".fila");
let filaActual = 0;

// Inicializar la primera fila
activarFila(filaActual);

function activarFila(index) {
    const row = filas[index];
    const inputs = Array.from(row.querySelectorAll(".letra"));

    // focus en la primera casilla de la fila
    inputs[0].focus();

    inputs.forEach((input, i) => {
        // Limpiar listeners previos si existieran
        input.oninput = null;
        input.onkeydown = null;

        input.addEventListener("input", () => {
            input.value = input.value.toUpperCase().slice(0,1); // forzar mayúscula y 1 char

            // Avanzar al siguiente input si hay letra
            if (input.value !== "" && i < inputs.length - 1) {
                inputs[i + 1].focus();
            }

            // Si se ha rellenado la última casilla de esta fila -> comprobar
            if (i === inputs.length - 1 && input.value !== "") {
                comprobarFila(index);
            }
        });

        input.addEventListener("keydown", (e) => {
            // Backspace: si la casilla está vacía, volver a la anterior
            if (e.key === "Backspace") {
                if (input.value === "" && i > 0) {
                    inputs[i - 1].focus();
                    inputs[i - 1].value = ""; // opcional: borrar la anterior al retroceder
                    e.preventDefault();
                }
            }

            // Evitar introducir caracteres no alfabéticos
            if (e.key.length === 1 && !/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

// Comprueba y colorea solo la fila indicada
function comprobarFila(index) {
    const row = filas[index];
    const inputs = Array.from(row.querySelectorAll(".letra"));

    // construir intento
    const intento = inputs.map(i => (i.value || "").toUpperCase()).join("");

    if (intento.length !== 5) return; // seguridad

    // Algoritmo: marcar verdes primero, luego amarillos (respetando repeticiones)
    const estado = Array(5).fill(""); // "verde","amarillo","gris"
    const secretoArray = palabraSecreta.split("");
    const usado = Array(5).fill(false); // marcas de letras ya emparejadas en secreto

    // 1) verdes
    for (let i = 0; i < 5; i++) {
        if (intento[i] === secretoArray[i]) {
            estado[i] = "verde";
            usado[i] = true;
        }
    }

    // 2) amarillos (buscar en posiciones no usadas)
    for (let i = 0; i < 5; i++) {
        if (estado[i] === "") {
            const letra = intento[i];
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

    // aplicar clases a los inputs de la fila
    for (let i = 0; i < 5; i++) {
        inputs[i].classList.add(estado[i]);
        // desactivar la casilla para que no se pueda editar
        inputs[i].classList.add("desactivada");
        inputs[i].disabled = true;
    }

    // Si acertó toda la palabra, puedes mostrar mensaje o detener el juego
    if (estado.every(s => s === "verde")) {
        // ejemplo: alert y dejar de activar filas
        setTimeout(() => alert("¡Correcto!"), 50);
        return;
    }

    // pasar a la siguiente fila si existe
    filaActual++;
    if (filaActual < filas.length) {
        activarFila(filaActual);
    } else {
        // Se acabaron los intentos: mostrar la respuesta
        setTimeout(() => alert("Se acabaron los intentos. La palabra era: " + palabraSecreta), 50);
    }
}
