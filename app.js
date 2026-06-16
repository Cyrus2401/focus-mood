/* ==========================================================================
   APP.JS — Zenith Focus Premium Application Logic
   Features: GSAP Motion, Pomodoro countdown, Web Audio Synth, LocalStorage tasks
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- Initial Entry Motion using GSAP ---
    initGSAPAnimations();

    // --- State Variables ---
    let timerInterval = null;
    let isTimerRunning = false;
    let timerMode = "focus"; // "focus" or "break"
    
    // Durations in seconds
    const focusDuration = 25 * 60;
    const breakDuration = 5 * 60;
    let timeRemaining = focusDuration;

    // --- DOM Elements ---

    
    const timeDigits = document.getElementById("time-digits");
    const timeStateLabel = document.getElementById("time-state-label");
    const btnModeFocus = document.getElementById("btn-mode-focus");
    const btnModeBreak = document.getElementById("btn-mode-break");
    const progressIndicator = document.getElementById("progress-indicator");
    
    const btnTimerToggle = document.getElementById("btn-timer-toggle");
    const btnTimerReset = document.getElementById("btn-timer-reset");
    
    const btnAudioGamma = document.getElementById("btn-audio-gamma");
    const btnAudioRain = document.getElementById("btn-audio-rain");
    const sliderVolume = document.getElementById("slider-volume");
    const volumeValDisplay = document.getElementById("volume-val-display");
    
    const formAddTask = document.getElementById("form-add-task");
    const inputTask = document.getElementById("input-task");
    const taskListContainer = document.getElementById("task-list-container");

    // SVG Circle Configuration
    const circlePerimeter = 754; // 2 * PI * r (r=120)
    progressIndicator.style.strokeDasharray = circlePerimeter;
    progressIndicator.style.strokeDashoffset = 0;

    // --- GSAP Loading Animation ---
    function initGSAPAnimations() {
        const tl = gsap.timeline();
        
        // Setup initial hidden states
        gsap.set(".app-header", { opacity: 0, y: -15 });
        gsap.set(".card", { opacity: 0, y: 30 });
        gsap.set(".app-footer", { opacity: 0 });

        // Build elegant flow sequence
        tl.to(".app-header", {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out"
        })
        .to(".card", {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.15
        }, "-=0.4")
        .to(".app-footer", {
            opacity: 1,
            duration: 0.6
        }, "-=0.6");
    }

    // --- Pomodoro Timer Functionality ---
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timeDigits.textContent = formattedTime;
        
        // Update browser tab title
        const modeEmoji = timerMode === "focus" ? "🧘" : "⚡";
        document.title = `${formattedTime} ${modeEmoji} Zenith Focus`;

        // Calculate progress ring circle offset
        const totalDuration = timerMode === "focus" ? focusDuration : breakDuration;
        const progressFraction = timeRemaining / totalDuration;
        const offset = circlePerimeter * (1 - progressFraction);
        progressIndicator.style.strokeDashoffset = offset;
    }

    function setMode(mode) {
        if (timerMode === mode) return;
        
        timerMode = mode;
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        // Update control button visuals
        btnTimerToggle.classList.remove("active");
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "DÉMARRER";

        // Dynamic theme switching
        if (timerMode === "focus") {
            btnModeFocus.classList.add("active");
            btnModeBreak.classList.remove("active");
            timeStateLabel.textContent = "FOCUS";
            timeRemaining = focusDuration;
            
            // Adjust design tokens
            document.documentElement.style.setProperty("--theme-color", "var(--color-primary)");
            document.documentElement.style.setProperty("--theme-glow", "var(--color-primary-glow)");
            

        } else {
            btnModeFocus.classList.remove("active");
            btnModeBreak.classList.add("active");
            timeStateLabel.textContent = "PAUSE";
            timeRemaining = breakDuration;
            
            // Adjust design tokens
            document.documentElement.style.setProperty("--theme-color", "var(--color-secondary)");
            document.documentElement.style.setProperty("--theme-glow", "var(--color-secondary-glow)");
            

        }
        
        // Quick visual effect on the ring stroke color during switch
        progressIndicator.style.stroke = `var(--theme-color)`;

        updateTimerDisplay();
    }

    function toggleTimer() {
        if (isTimerRunning) {
            // Pause
            clearInterval(timerInterval);
            isTimerRunning = false;
            btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
            btnTimerToggle.querySelector(".btn-text").textContent = "REPRENDRE";

            
            gsap.to(btnTimerToggle, { scale: 1, duration: 0.2 });
        } else {
            // Start/Resume
            isTimerRunning = true;
            btnTimerToggle.querySelector(".btn-icon").textContent = "❚❚";
            btnTimerToggle.querySelector(".btn-text").textContent = "PAUSE";

            
            timerInterval = setInterval(() => {
                if (timeRemaining > 0) {
                    timeRemaining--;
                    updateTimerDisplay();
                } else {
                    // Timer finished
                    handleTimerCompletion();
                }
            }, 1000);

            // Subtle button micro-interaction
            gsap.to(btnTimerToggle, { scale: 1.03, duration: 0.2 });
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        timeRemaining = timerMode === "focus" ? focusDuration : breakDuration;
        
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "DÉMARRER";
        

        updateTimerDisplay();

        gsap.fromTo(timeDigits, { opacity: 0.5 }, { opacity: 1, duration: 0.3 });
    }

    function handleTimerCompletion() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        // Play gentle audio notification using synthesized beep
        playSynthesizedBeep();

        if (timerMode === "focus") {

            // Auto switch to break mode
            setMode("break");
        } else {

            // Auto switch to focus mode
            setMode("focus");
        }
    }

    // --- Web Audio Engine & Sounds ---
    let audioCtx = null;
    let masterGainNode = null;
    let gammaNodes = null; // Holds Left/Right oscillators + panners
    let rainNodes = null;  // Holds Noise node + filters + LFO modulation

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create Master Gain
            masterGainNode = audioCtx.createGain();
            masterGainNode.gain.value = sliderVolume.value / 100;
            masterGainNode.connect(audioCtx.destination);
        }
        
        // Auto-resume context if suspended by browser security policy
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Gentle Beep for Timer End
    function playSynthesizedBeep() {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5 note
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Synthesized beep failed:", e);
        }
    }

    // Binaural Beats Generation (200Hz Left, 240Hz Right -> 40Hz Gamma waves)
    function startGammaBinaural() {
        const ctx = getAudioContext();
        
        // Left Oscillator (Carrier: 200 Hz)
        const leftOsc = ctx.createOscillator();
        leftOsc.type = "sine";
        leftOsc.frequency.value = 200;
        
        const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (leftPanner) leftPanner.pan.value = -1;

        // Right Oscillator (Carrier + 40Hz: 240 Hz)
        const rightOsc = ctx.createOscillator();
        rightOsc.type = "sine";
        rightOsc.frequency.value = 240;

        const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (rightPanner) rightPanner.pan.value = 1;

        // Visual low humming sound feel - keep volume cozy and low
        const trackGain = ctx.createGain();
        trackGain.gain.value = 0.08;

        // Chain Nodes
        if (leftPanner && rightPanner) {
            leftOsc.connect(leftPanner);
            leftPanner.connect(trackGain);

            rightOsc.connect(rightPanner);
            rightPanner.connect(trackGain);
        } else {
            leftOsc.connect(trackGain);
            rightOsc.connect(trackGain);
        }

        trackGain.connect(masterGainNode);

        // Start Oscillators
        leftOsc.start();
        rightOsc.start();

        gammaNodes = {
            leftOsc,
            rightOsc,
            trackGain
        };
    }

    function stopGammaBinaural() {
        if (gammaNodes) {
            const ctx = getAudioContext();
            
            // Fade out cleanly to avoid dynamic audio pops
            gammaNodes.trackGain.gain.setValueAtTime(gammaNodes.trackGain.gain.value, ctx.currentTime);
            gammaNodes.trackGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            
            setTimeout(() => {
                try {
                    gammaNodes.leftOsc.stop();
                    gammaNodes.rightOsc.stop();
                } catch (err) {}
                gammaNodes = null;
            }, 300);
        }
    }

    // Ambient space rain: White noise filtered through lowpass and modulated by a gentle LFO
    function startSpaceRain() {
        const ctx = getAudioContext();

        // 1. Generate White Noise Buffer
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 2; // 2 seconds of sound
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // 2. Buffer Source Node
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        // 3. Low Pass Filter (Removes high piercing white noise and transforms it to warm rain)
        const lowpassFilter = ctx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.setValueAtTime(450, ctx.currentTime);
        lowpassFilter.Q.value = 1.0;

        // 4. Peaking filter to simulate dynamic wind/wave rustles
        const peakFilter = ctx.createBiquadFilter();
        peakFilter.type = "peaking";
        peakFilter.frequency.setValueAtTime(250, ctx.currentTime);
        peakFilter.Q.value = 1.5;
        peakFilter.gain.setValueAtTime(8, ctx.currentTime);

        // 5. Volume Gain
        const trackGain = ctx.createGain();
        trackGain.gain.value = 0.12;

        // 6. LFO (Modulation oscillator to simulate swell cycles every 8 seconds)
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.125; // 1 / 8 seconds

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 120; // Modulates filter frequency by +/- 120Hz

        // Chain LFO to Filter frequency
        lfo.connect(lfoGain);
        lfoGain.connect(lowpassFilter.frequency);

        // Chain Audio nodes
        noiseSource.connect(lowpassFilter);
        lowpassFilter.connect(peakFilter);
        peakFilter.connect(trackGain);
        trackGain.connect(masterGainNode);

        // Start playing
        noiseSource.start();
        lfo.start();

        rainNodes = {
            noiseSource,
            lowpassFilter,
            peakFilter,
            trackGain,
            lfo
        };
    }

    function stopSpaceRain() {
        if (rainNodes) {
            const ctx = getAudioContext();
            
            // Clean fade out
            rainNodes.trackGain.gain.setValueAtTime(rainNodes.trackGain.gain.value, ctx.currentTime);
            rainNodes.trackGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            
            setTimeout(() => {
                try {
                    rainNodes.noiseSource.stop();
                    rainNodes.lfo.stop();
                } catch (err) {}
                rainNodes = null;
            }, 400);
        }
    }

    // --- Audio Control Listeners ---

    btnAudioGamma.addEventListener("click", () => {
        if (gammaNodes) {
            stopGammaBinaural();
            btnAudioGamma.classList.remove("playing");
            btnAudioGamma.textContent = "Jouer";
        } else {
            // Unlock Web Audio context first if browser is strict
            getAudioContext();
            startGammaBinaural();
            btnAudioGamma.classList.add("playing");
            btnAudioGamma.textContent = "Arrêter";
        }
    });

    btnAudioRain.addEventListener("click", () => {
        if (rainNodes) {
            stopSpaceRain();
            btnAudioRain.classList.remove("playing");
            btnAudioRain.textContent = "Jouer";
        } else {
            getAudioContext();
            startSpaceRain();
            btnAudioRain.classList.add("playing");
            btnAudioRain.textContent = "Arrêter";
        }
    });

    sliderVolume.addEventListener("input", (e) => {
        const val = e.target.value;
        volumeValDisplay.textContent = `${val}%`;
        
        if (masterGainNode) {
            masterGainNode.gain.setValueAtTime(val / 100, audioCtx.currentTime);
        }
    });

    // --- Zen Tasks / Planner Logic (LocalStorage CRUD) ---

    let tasks = [];

    function loadTasks() {
        const stored = localStorage.getItem("zenith_tasks");
        if (stored) {
            tasks = JSON.parse(stored);
        } else {
            // Seed a high quality starting task
            tasks = [
                { id: 1, text: "Focaliser sur ma tâche principale avec Zenith Focus", completed: false },
                { id: 2, text: "Écouter les ondes Gamma pour la concentration", completed: true }
            ];
            saveTasks();
        }
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem("zenith_tasks", JSON.stringify(tasks));
    }

    function renderTasks() {
        taskListContainer.innerHTML = "";
        
        if (tasks.length === 0) {
            const emptyEl = document.createElement("div");
            emptyEl.className = "empty-state";
            emptyEl.style.cssText = "text-align: center; color: var(--stardust-grey); font-size: 12px; padding: var(--space-medium) 0;";
            emptyEl.textContent = "Zenitude absolue... aucune tâche programmée.";
            taskListContainer.appendChild(emptyEl);
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement("li");
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute("data-id", task.id);

            li.innerHTML = `
                <div class="task-item-left">
                    <label class="task-checkbox-wrapper">
                        <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} aria-label="Marquer comme complété">
                        <span class="task-checkmark"></span>
                    </label>
                    <span class="task-title">${escapeHTML(task.text)}</span>
                </div>
                <button class="delete-task-btn" aria-label="Supprimer la tâche">×</button>
            `;

            // Click listener for complete checkbox
            li.querySelector(".task-checkbox-input").addEventListener("change", (e) => {
                toggleTaskComplete(task.id, e.target.checked);
            });

            // Click listener for delete action
            li.querySelector(".delete-task-btn").addEventListener("click", () => {
                deleteTask(task.id, li);
            });

            taskListContainer.appendChild(li);
        });
    }

    function addTask(text) {
        const cleanText = text.trim();
        if (!cleanText) return;

        const newTask = {
            id: Date.now(),
            text: cleanText,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        // Stagger load-in the newly added task using GSAP
        const newEl = taskListContainer.querySelector(`[data-id="${newTask.id}"]`);
        if (newEl) {
            gsap.from(newEl, {
                x: 30,
                opacity: 0,
                duration: 0.4,
                ease: "power2.out"
            });
        }
    }

    function toggleTaskComplete(id, completed) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed };
            }
            return task;
        });
        saveTasks();
        
        const taskEl = taskListContainer.querySelector(`[data-id="${id}"]`);
        if (taskEl) {
            if (completed) {
                taskEl.classList.add("completed");
                // Gentle pulse animation on checkbox click
                gsap.to(taskEl, { scale: 0.98, opacity: 0.5, duration: 0.2 });
            } else {
                taskEl.classList.remove("completed");
                gsap.to(taskEl, { scale: 1, opacity: 1, duration: 0.2 });
            }
        }
    }

    function deleteTask(id, element) {
        // Animate exit first with GSAP
        gsap.to(element, {
            x: -40,
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
            onComplete: () => {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
            }
        });
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Form Listener ---
    formAddTask.addEventListener("submit", (e) => {
        e.preventDefault();
        addTask(inputTask.value);
        inputTask.value = "";
    });

    // --- Timer Button Listeners ---
    btnTimerToggle.addEventListener("click", toggleTimer);
    btnTimerReset.addEventListener("click", resetTimer);

    btnModeFocus.addEventListener("click", () => setMode("focus"));
    btnModeBreak.addEventListener("click", () => setMode("break"));

    // --- Initialization ---

    
    updateTimerDisplay();
    loadTasks();
});
