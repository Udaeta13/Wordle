
// Configuracion inicial
let palabraSecreta = ""; // se llena desde la API
let filaActual = 0;
const MAX_FILAS = 6;
const LONGITUD = 5;

// Quitar tildes de una palabra
function quitarTildes(palabra) {
    return palabra
        .replace(/[á]/gi, "a")
        .replace(/[é]/gi, "e")
        .replace(/[í]/gi, "i")
        .replace(/[ó]/gi, "o")
        .replace(/[ú]/gi, "u");
}


// Cargar palabra desde la API
async function cargarPalabra() {
    try {
        const respuesta = await fetch("https://random-word-api.herokuapp.com/word?lang=es&length=5");
        const datos = await respuesta.json();

        if (Array.isArray(datos) && datos[0]) {
            palabraSecreta = quitarTildes(datos[0]).toUpperCase();
        } else {
            throw new Error("Respuesta inesperada de la API");
        }

    } catch (err) {
        console.error("Error al cargar palabra desde la API:", err);
        palabraSecreta = "PERRO";
    } finally {
        console.log("Palabra secreta:", palabraSecreta);
        const primera = document.querySelector(".fila input");
        if (primera) primera.focus();
    }
}

cargarPalabra();



// Helpers DOM
function filasNodeList() {
    return document.querySelectorAll(".fila");
}

function inputsDeFila(index) {
    const filas = filasNodeList();
    const fila = filas[index];
    return fila ? Array.from(fila.querySelectorAll("input")) : [];
}


// Inicializar filas: eventos input y keypress
inicializarFilas();

function inicializarFilas() {
    const filas = filasNodeList();
    filas.forEach((fila, filaIndex) => {
        const inputs = Array.from(fila.querySelectorAll("input"));
        inputs.forEach((input, i) => {
            // Input: normalizar mayúscula y limitar 1 char
            input.addEventListener("input", (e) => {
                // Normalizar: forzar mayúscula, recortar a 1
                input.value = (input.value || "").toUpperCase().slice(0, 1);

                // Si escribimos una letra y no es el último -> avanzar foco dentro de la MISMA fila
                if (input.value.length === 1 && i < inputs.length - 1) {
                    inputs[i + 1].focus();
                }
            });

            // Permitir letras españolas (incluye ñ y vocales acentuadas)
            input.addEventListener("keypress", (e) => {
                // tecla puede ser más de 1 car (ej: dead keys), comprobamos la propiedad key
                const key = e.key || "";
                // permitir letras A-Z, a-z, ñÑ, y vocales acentuadas
                if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]$/.test(key)) {
                    e.preventDefault();
                }
            });
        });
    });
}


// Navegación teclado físico: Backspace y Enter (con setTimeout para última letra)
document.addEventListener("keydown", (event) => {
    const target = event.target;

    // Si no estamos dentro de un input del tablero, ignorar excepto teclas generales
    if (!target || target.tagName !== "INPUT") return;

    const fila = target.parentElement;
    const inputs = Array.from(fila.querySelectorAll("input"));
    const index = inputs.indexOf(target);

    // BACKSPACE
    if (event.key === "Backspace") {
        // Si la casilla tiene valor, dejar que el navegador la borre (no interferimos)
        // Si está vacía -> retroceder y borrar anterior
        if (target.value === "") {
            if (index > 0) {
                event.preventDefault();
                inputs[index - 1].focus();
                inputs[index - 1].value = "";
            }
        }
        return;
    }

    // ENTER -> comprobar fila; usamos setTimeout 0 para que si hay un 'input'
    // pendiente (ej: el usuario tecleó la 5ª letra y rápidamente ENTER),
    // ese input se procese antes de leer los valores.
    if (event.key === "Enter") {
        event.preventDefault();
        setTimeout(() => {
            comprobarFila();
        }, 0);
        return;
    }
});


// Mover foco programáticamente cuando usamos teclado virtual
function dispatchInputEvent(element) {
    const ev = new Event('input', { bubbles: true });
    element.dispatchEvent(ev);
}

// Tecado virtual
function inicializarTeclado() {
    const teclado = document.getElementById("teclado");
    if (!teclado) return;

    teclado.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-key]");
        if (!btn) return;
        const key = btn.dataset.key;

        if (key === "ENTER") {
            // igual que pulsar Enter
            setTimeout(() => comprobarFila(), 0);
            return;
        }

        if (key === "BACK") {
            borrarLetra();
            return;
        }

        // letra
        escribirLetra(key);
    });
}

// Escribir letra desde teclado virtual
function escribirLetra(letra) {
    const inputs = inputsDeFila(filaActual);
    if (inputs.length === 0) return;

    // buscar primer input vacío
    for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].value) {
            inputs[i].value = letra.toUpperCase().slice(0,1);

            // dispatch input para que se comporte como si el usuario hubiese escrito
            dispatchInputEvent(inputs[i]);

            // si no es el último, avanzar foco
            if (i < inputs.length - 1) inputs[i + 1].focus();
            else inputs[i].focus();

            break;
        }
    }
}

// Borrar letra desde teclado virtual
function borrarLetra() {
    const inputs = inputsDeFila(filaActual);
    if (inputs.length === 0) return;

    // buscar ultimo input lleno
    for (let i = inputs.length - 1; i >= 0; i--) {
        if (inputs[i].value) {
            inputs[i].value = "";
            inputs[i].focus();
            dispatchInputEvent(inputs[i]);
            break;
        }
    }
}


// Comprobar fila actual (colores y teclado virtual)
function comprobarFila() {
    const filas = filasNodeList();
    const fila = filas[filaActual];
    if (!fila) return;

    const inputs = Array.from(fila.querySelectorAll("input"));

    // leer valores AHORA (tras cualquier input pendiente)
    const intentoArr = inputs.map(inp => (inp.value || "").toUpperCase().trim());
    const hayVacio = intentoArr.some(ch => ch === "" || ch.length !== 1);

    if (hayVacio) {
        // enfocar primer vacío para ayudar al usuario
        const primerVacio = inputs.find(inp => !inp.value);
        if (primerVacio) primerVacio.focus();
        alert("Debes introducir las 5 letras antes de pulsar ENTER.");
        return;
    }

    const intento = intentoArr.join("");
    // algoritmo: verdes primero, luego amarillos respetando repeticiones
    const estado = Array(LONGITUD).fill(""); // "verde","amarillo","gris"
    const secretoArray = palabraSecreta.split("");
    const usado = Array(LONGITUD).fill(false);

    // 1) Verdes
    for (let i = 0; i < LONGITUD; i++) {
        if (intentoArr[i] === secretoArray[i]) {
            estado[i] = "verde";
            usado[i] = true;
        }
    }

    // 2) Amarillos
    for (let i = 0; i < LONGITUD; i++) {
        if (estado[i] === "") {
            const letra = intentoArr[i];
            let encontrado = false;
            for (let j = 0; j < LONGITUD; j++) {
                if (!usado[j] && secretoArray[j] === letra) {
                    encontrado = true;
                    usado[j] = true;
                    break;
                }
            }
            estado[i] = encontrado ? "amarillo" : "gris";
        }
    }

    // Aplicar clases a inputs y bloquearlos
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].classList.add(estado[i]);         // .verde/.amarillo/.gris
        inputs[i].classList.add("desactivada");    // estilo visual
        inputs[i].disabled = true;
    }

    // Actualizar teclado virtual según estado (prioridad verde > amarillo > gris)
    for (let i = 0; i < LONGITUD; i++) {
        marcarTecla(intentoArr[i], estado[i]);
    }

    // Si ganó
    if (estado.every(s => s === "verde")) {
        setTimeout(() => alert("¡Correcto! La palabra era: " + palabraSecreta), 50);
        return;
    }

    // Avanzar fila actual y enfocar la primera casilla de la siguiente
    filaActual++;
    if (filaActual < filas.length) {
        const siguienteInputs = inputsDeFila(filaActual);
        if (siguienteInputs.length > 0) siguienteInputs[0].focus();
    } else {
        setTimeout(() => alert("Se acabaron los intentos. La palabra era: " + palabraSecreta), 50);
    }
}


// Marcar tecla en teclado virtual con prioridad
function marcarTecla(letraRaw, estado) {
    if (!letraRaw) return;
    const letra = letraRaw.toUpperCase();

    // Buscar boton correspondiente (data-key). Si no existe, salir
    const selector = `#teclado button[data-key="${letra}"]`;
    const boton = document.querySelector(selector);
    if (!boton) return;

    // prioridad verde > amarillo > gris
    if (estado === "verde") {
        boton.classList.remove("tecla-amarilla", "tecla-gris");
        boton.classList.add("tecla-verde");
    } else if (estado === "amarillo") {
        if (!boton.classList.contains("tecla-verde")) {
            boton.classList.remove("tecla-gris");
            boton.classList.add("tecla-amarilla");
        }
    } else { // gris
        if (!boton.classList.contains("tecla-verde") && !boton.classList.contains("tecla-amarilla")) {
            boton.classList.add("tecla-gris");
        }
    }
}


// Opcional: exponer funciones en global para debugging
window._wordle = {
    cargarPalabra,
    escribirLetra,
    borrarLetra,
    comprobarFila,
    getPalabraSecreta: () => palabraSecreta
};
