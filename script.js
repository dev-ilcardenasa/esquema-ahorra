// Configuración: 1 billete por día, 7 meses (210 días). 1 de $50k cada 7 casillas (semana).
const SAVING_CONFIG = {
    goal: 5_000_000,
    monthsToGoal: 7,
    daysPerMonth: 30,
    denominations: [
        { value: 50_000, count: 30 },   // 1 por semana = 1.500.000
        { value: 20_000, count: 172 }, // 3.440.000
        { value: 10_000, count: 4 },   // 40.000
        { value: 5_000, count: 4 }     // 20.000   → total 5.000.000
    ],
    storageKey: "esquemaAhorroState"
};

const totalDays = SAVING_CONFIG.monthsToGoal * SAVING_CONFIG.daysPerMonth;
const totalBills = SAVING_CONFIG.denominations.reduce((sum, d) => sum + d.count, 0);

function formatCurrency(value) {
    return value.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });
}

function loadState() {
    try {
        const raw = localStorage.getItem(SAVING_CONFIG.storageKey);
        if (!raw) return { activeTiles: {}, billOrder: null, hideTotal: false, cashSoundDataUrl: null };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return { activeTiles: {}, billOrder: null, hideTotal: false, cashSoundDataUrl: null };
        }
        const activeTiles = parsed.activeTiles && typeof parsed.activeTiles === "object" ? parsed.activeTiles : {};
        const billOrder = Array.isArray(parsed.billOrder) ? parsed.billOrder : null;
        const hideTotal = typeof parsed.hideTotal === "boolean" ? parsed.hideTotal : false;
        const cashSoundDataUrl = typeof parsed.cashSoundDataUrl === "string" ? parsed.cashSoundDataUrl : null;
        return { activeTiles, billOrder, hideTotal, cashSoundDataUrl };
    } catch {
        return { activeTiles: {}, billOrder: null, hideTotal: false, cashSoundDataUrl: null };
    }
}

function saveState(state) {
    try {
        localStorage.setItem(SAVING_CONFIG.storageKey, JSON.stringify(state));
    } catch {
        // Si localStorage falla (modo incógnito, etc.), simplemente no persistimos.
    }
}

// Cada 7 casillas = 1 semana. La casilla 7, 14, 21, 28… es siempre $50k (1 billete pesado por semana).
function buildSpreadBillOrder() {
    const n = SAVING_CONFIG.denominations.reduce((sum, d) => sum + d.count, 0);
    const slots = new Array(n).fill(null);
    const daysPerWeek = 7;

    // La última casilla de cada semana (la 7.ª, 14.ª, 21.ª…) es el billete de $50k
    const fiftyKCount = SAVING_CONFIG.denominations.find((d) => d.value === 50_000)?.count ?? 0;
    for (let w = 0; w < fiftyKCount; w++) {
        const pos = (w + 1) * daysPerWeek - 1; // casilla 7, 14, 21, 28… (índice 6, 13, 20, 27…)
        slots[pos] = 50_000;
    }

    // Índices que no son de $50k
    let availableIndices = [];
    for (let i = 0; i < n; i++) {
        if (slots[i] !== 50_000) availableIndices.push(i);
    }

    // Repartir el resto de denominaciones (20k, 10k, 5k) de forma uniforme en esos días
    SAVING_CONFIG.denominations.forEach((denom) => {
        if (denom.value === 50_000 || denom.count === 0) return;

        const count = denom.count;
        const numAvailable = availableIndices.length;
        const toUse = [];
        for (let i = 0; i < count; i++) {
            const idx = count === 1
                ? 0
                : Math.round((i * (numAvailable - 1)) / (count - 1));
            toUse.push(availableIndices[idx]);
        }

        toUse.forEach((pos) => { slots[pos] = denom.value; });
        availableIndices = availableIndices.filter((p) => !toUse.includes(p));
    });

    return slots;
}

function getBillOrder(state) {
    const totalCount = SAVING_CONFIG.denominations.reduce((sum, d) => sum + d.count, 0);
    if (state.billOrder && state.billOrder.length === totalCount) {
        return state.billOrder;
    }
    const denomPool = buildSpreadBillOrder();
    state.billOrder = denomPool.slice();
    saveState(state);
    return denomPool;
}

function buildTiles(state) {
    const grid = document.getElementById("all-bills-grid");
    if (!grid) return;

    const denomPool = getBillOrder(state);

    denomPool.forEach((denomValue, index) => {
        const tileNumber = index + 1;
        const tileId = `bill-${tileNumber}`;

        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "bill-tile inactive";
        tile.dataset.tileId = tileId;
        tile.dataset.value = String(denomValue);
        tile.dataset.denomination = String(denomValue);

        const img = document.createElement("img");
        img.className = "bill-img";
        img.alt = formatCurrency(denomValue);
        img.loading = "lazy";
        img.onerror = function () {
            if (img.src.endsWith(".png")) {
                img.src = `billetes/${denomValue}.jpg`;
            } else {
                img.classList.add("bill-img-error");
            }
        };
        img.src = `billetes/${denomValue}.png`;
        tile.appendChild(img);

        const label = document.createElement("span");
        label.className = "bill-label";
        label.textContent = `#${tileNumber}`;

        tile.appendChild(label);

        if (state.activeTiles[tileId]) {
            tile.classList.remove("inactive");
            tile.classList.add("active");
        }

        grid.appendChild(tile);
    });
}

function calculateTotalFromDOM() {
    const tiles = document.querySelectorAll(".bill-tile.active");
    let total = 0;
    tiles.forEach((tile) => {
        const value = Number(tile.dataset.value || 0);
        if (!Number.isNaN(value)) {
            total += value;
        }
    });
    return total;
}

function updateSectionSummaries() {
    const summaryEl = document.getElementById("overall-summary");
    if (!summaryEl) return;

    const totalTiles = document.querySelectorAll(".bill-tile").length;
    const activeTiles = document.querySelectorAll(".bill-tile.active").length;

    summaryEl.textContent = `${activeTiles} de ${totalTiles} billetes ahorrados`;
}

function updateTodayDate() {
    const el = document.getElementById("today-date");
    if (!el) return;

    const now = new Date();
    el.textContent = now.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function updateDailyGoalDisplay() {
    const el = document.getElementById("daily-goal");
    if (!el) return;
    el.textContent = "1 billete por día";
}

function getMotivationText(percentage) {
    if (percentage === 0) {
        return "Empieza marcando tu primer billete y mira cómo crece tu ahorro.";
    }
    if (percentage > 0 && percentage < 25) {
        return "Buen comienzo, la clave es la constancia.";
    }
    if (percentage >= 25 && percentage < 50) {
        return "Vas tomando ritmo, sigue así.";
    }
    if (percentage >= 50 && percentage < 75) {
        return "Ya superaste la mitad de tu meta, no pares.";
    }
    if (percentage >= 75 && percentage < 100) {
        return "Estás muy cerca, cada billete cuenta mucho ahora.";
    }
    return "Meta alcanzada. Si quieres, puedes seguir ahorrando aún más.";
}

function updateUI(total) {
    const totalAmountEl = document.getElementById("total-amount");
    const progressFillEl = document.getElementById("progress-fill");
    const progressPercentEl = document.getElementById("progress-percent");
    const motivationEl = document.getElementById("motivation-text");

    if (totalAmountEl) {
        const shouldHide = Boolean(window.__esquemaAhorroHideTotal);
        totalAmountEl.textContent = shouldHide ? "Saldo oculto" : formatCurrency(total);
        if (!shouldHide) {
            totalAmountEl.classList.remove("bump");
            void totalAmountEl.offsetWidth;
            totalAmountEl.classList.add("bump");
        }
    }

    const percentage = Math.max(
        0,
        Math.min(100, (total / SAVING_CONFIG.goal) * 100)
    );

    if (progressFillEl) {
        progressFillEl.style.width = `${percentage}%`;
    }
    if (progressPercentEl) {
        progressPercentEl.textContent = `${percentage.toFixed(0)}%`;
    }
    if (motivationEl) {
        motivationEl.textContent = getMotivationText(percentage);
    }

    updateSectionSummaries();
}

function updateTotalVisibilityButton() {
    const btn = document.getElementById("toggle-total-visibility");
    if (!btn) return;
    const hidden = Boolean(window.__esquemaAhorroHideTotal);
    btn.textContent = hidden ? "Mostrar" : "Ocultar";
    btn.setAttribute("aria-pressed", hidden ? "true" : "false");
    btn.setAttribute("aria-label", hidden ? "Mostrar saldo total" : "Ocultar saldo total");
}

function attachTotalVisibilityListener(state) {
    const btn = document.getElementById("toggle-total-visibility");
    if (!btn) return;

    btn.addEventListener("click", () => {
        state.hideTotal = !state.hideTotal;
        window.__esquemaAhorroHideTotal = state.hideTotal;
        saveState(state);

        updateTotalVisibilityButton();
        updateUI(calculateTotalFromDOM());
    });
}

function playFallbackCashSound() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
        if (!window.__esquemaAhorroAudioCtx) {
            window.__esquemaAhorroAudioCtx = new AudioContextCtor();
        }
        const ctx = window.__esquemaAhorroAudioCtx;

        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-22, now);
        compressor.knee.setValueAtTime(18, now);
        compressor.ratio.setValueAtTime(6, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.12, now);
        compressor.connect(ctx.destination);

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.9, now);
        master.connect(compressor);

        // Ruido corto (moneda / "clink")
        const noiseDur = 0.06;
        const noiseBuf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * noiseDur)), ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            // ruido con caída rápida
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.7;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(2800, now);
        noiseFilter.Q.setValueAtTime(10, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.22, now + 0.006);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(now);
        noise.stop(now + noiseDur);

        // "Ka" corto (golpe)
        const ka = ctx.createOscillator();
        ka.type = "square";
        const kaGain = ctx.createGain();
        kaGain.gain.setValueAtTime(0.0001, now);
        kaGain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
        kaGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        ka.frequency.setValueAtTime(520, now);
        ka.frequency.exponentialRampToValueAtTime(220, now + 0.05);
        ka.connect(kaGain);
        kaGain.connect(master);
        ka.start(now);
        ka.stop(now + 0.055);

        // "Ching" (campanita más aguda)
        const t2 = now + 0.045;
        const ch1 = ctx.createOscillator();
        ch1.type = "sine";
        const ch2 = ctx.createOscillator();
        ch2.type = "triangle";
        const chGain = ctx.createGain();
        chGain.gain.setValueAtTime(0.0001, t2);
        chGain.gain.exponentialRampToValueAtTime(0.16, t2 + 0.01);
        chGain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.25);

        ch1.frequency.setValueAtTime(1650, t2);
        ch1.frequency.exponentialRampToValueAtTime(980, t2 + 0.22);
        ch2.frequency.setValueAtTime(990, t2);
        ch2.frequency.exponentialRampToValueAtTime(660, t2 + 0.22);

        const chFilter = ctx.createBiquadFilter();
        chFilter.type = "highpass";
        chFilter.frequency.setValueAtTime(450, t2);

        ch1.connect(chGain);
        ch2.connect(chGain);
        chGain.connect(chFilter);
        chFilter.connect(master);

        ch1.start(t2);
        ch2.start(t2);
        ch1.stop(t2 + 0.26);
        ch2.stop(t2 + 0.26);
    } catch {
        // Si falla el WebAudio, simplemente no sonamos.
    }
}

function playCashSound() {
    const audio = document.getElementById("cash-sound");

    if (!audio) {
        playFallbackCashSound();
        return;
    }

    try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                playFallbackCashSound();
            });
        }
    } catch {
        playFallbackCashSound();
    }
}

function spawnDollarBurst(tile) {
    const rect = tile.getBoundingClientRect();
    const dollar = document.createElement("div");
    dollar.className = "dollar-float";
    dollar.textContent = "$";
    dollar.style.left = `${rect.left + rect.width / 2}px`;
    dollar.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(dollar);

    dollar.addEventListener("animationend", () => {
        dollar.remove();
    });
}

function attachTileListeners(state) {
    const container = document.body;

    container.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const tile = target.closest(".bill-tile");
        if (!tile) return;

        const tileId = tile.dataset.tileId;
        const value = Number(tile.dataset.value || 0);
        if (!tileId || Number.isNaN(value)) return;

        const isActive = tile.classList.contains("active");

        if (isActive) {
            if (!confirm("¿Seguro que quieres desmarcar este billete? Se restará del total ahorrado.")) {
                return;
            }
            tile.classList.remove("active");
            tile.classList.add("inactive");
            delete state.activeTiles[tileId];
        } else {
            tile.classList.add("active");
            tile.classList.remove("inactive");
            state.activeTiles[tileId] = true;
            tile.classList.add("just-activated");
            setTimeout(() => {
                tile.classList.remove("just-activated");
            }, 240);
            playCashSound();
            spawnDollarBurst(tile);
        }

        const total = calculateTotalFromDOM();
        updateUI(total);
        saveState(state);
    });
}

function attachResetListener(state) {
    const resetButton = document.getElementById("reset-button");
    if (!resetButton) return;

    resetButton.addEventListener("click", () => {
        if (!confirm("¿Seguro que quieres reiniciar todo el progreso de ahorro?")) {
            return;
        }

        state.activeTiles = {};
        state.billOrder = null;

        const grid = document.getElementById("all-bills-grid");
        if (grid) {
            grid.innerHTML = "";
            buildTiles(state);
        }

        updateUI(0);
        saveState(state);
    });
}

function applyCustomCashSoundFromState(state) {
    const audio = document.getElementById("cash-sound");
    if (!audio) return;

    if (state.cashSoundDataUrl) {
        audio.src = state.cashSoundDataUrl;
        try {
            audio.load();
        } catch {
            // ignore
        }
    } else {
        audio.src = "cash.mp3";
        try {
            audio.load();
        } catch {
            // ignore
        }
    }
}

function attachSoundPickerListeners(state) {
    const fileInput = document.getElementById("cash-sound-file");
    const pickBtn = document.getElementById("pick-sound-button");
    const testBtn = document.getElementById("test-sound-button");
    const resetBtn = document.getElementById("reset-sound-button");

    if (!(fileInput instanceof HTMLInputElement)) return;
    if (!pickBtn || !testBtn || !resetBtn) return;

    pickBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        // Evitar reventar localStorage con archivos enormes.
        const maxBytes = 900_000; // ~0.9MB
        if (file.size > maxBytes) {
            alert("Ese audio es muy pesado. Usa uno más corto/liviano (ideal < 1MB).");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") return;

            state.cashSoundDataUrl = result;
            saveState(state);
            applyCustomCashSoundFromState(state);

            // prueba rápida
            playCashSound();
        };
        reader.onerror = () => {
            alert("No se pudo leer el archivo de audio.");
        };
        reader.readAsDataURL(file);
    });

    testBtn.addEventListener("click", () => {
        playCashSound();
    });

    resetBtn.addEventListener("click", () => {
        state.cashSoundDataUrl = null;
        saveState(state);
        applyCustomCashSoundFromState(state);
        fileInput.value = "";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const state = loadState();
    window.__esquemaAhorroHideTotal = state.hideTotal;

    applyCustomCashSoundFromState(state);

    buildTiles(state);
    attachTileListeners(state);
    attachResetListener(state);
    attachTotalVisibilityListener(state);
    attachSoundPickerListeners(state);

    const initialTotal = calculateTotalFromDOM();
    updateUI(initialTotal);
    updateTotalVisibilityButton();
    updateSectionSummaries();
    updateTodayDate();
    updateDailyGoalDisplay();
});
