/* ==========================================================================
   APP.JS — FocusMood Application Logic
   Features: GSAP entry animations, Custom Timer, 13 Synth Ambient Tracks
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- Initial Entry Motion using GSAP ---
    initGSAPAnimations();

    // --- State Variables ---
    let timerInterval = null;
    let completionInterval = null;
    let isTimerRunning = false;
    let timerEndTime = null; // Target end timestamp for robust sleep/wake calculations
    
    // Notifications state
    let notificationsEnabled = false;
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            const stored = localStorage.getItem("focusNotificationsEnabled");
            notificationsEnabled = stored !== null ? stored === "true" : true;
        } else {
            notificationsEnabled = localStorage.getItem("focusNotificationsEnabled") === "true";
        }
    }
    
    // Load duration and remaining time from localStorage or defaults
    let timerDuration = parseInt(localStorage.getItem("focusTimerDuration"), 10) || (30 * 60);
    let timeRemaining = parseInt(localStorage.getItem("focusTimeRemaining"), 10) || timerDuration;

    // --- DOM Elements ---
    const timeDigits = document.getElementById("time-digits");
    const progressIndicator = document.getElementById("progress-indicator");
    const timeStateLabel = document.getElementById("time-state-label");
    
    const btnTimerToggle = document.getElementById("btn-timer-toggle");
    const btnTimerReset = document.getElementById("btn-timer-reset");
    const toggleNotifBtn = document.getElementById("toggle-notifications");
    const notifWrapper = document.getElementById("notif-wrapper");
    
    const presetBtns = document.querySelectorAll(".preset-btn");
    const inputCustomMinutes = document.getElementById("input-custom-minutes");
    const logoLink = document.getElementById("logo-link");
    

    
    const sliderVolume = document.getElementById("slider-volume");
    const volumeValDisplay = document.getElementById("volume-val-display");

    // SVG Circle Configuration
    const circlePerimeter = 754; // 2 * PI * r (r=120)
    progressIndicator.style.strokeDasharray = circlePerimeter;
    progressIndicator.style.strokeDashoffset = 0;

    // --- Reload page on header logo click ---
    if (logoLink) {
        logoLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.reload();
        });
    }

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

    // Draw and update dynamic progress favicon via canvas
    function updateFaviconProgress() {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, 32, 32);

            // Faint background track circle
            ctx.beginPath();
            ctx.arc(16, 16, 12, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Progress arc
            const progressFraction = timeRemaining / timerDuration;
            const startAngle = -0.5 * Math.PI;
            const endAngle = startAngle + (2 * Math.PI * progressFraction);
            
            ctx.beginPath();
            ctx.arc(16, 16, 12, startAngle, endAngle);
            
            // Color based on active theme
            ctx.strokeStyle = isTimerRunning ? "#ff5b8f" : (document.body.classList.contains("theme-paused") ? "#00d2c4" : "#ff5b8f");
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.stroke();

            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
            }
            link.href = canvas.toDataURL("image/x-icon");
        } catch (e) {
            console.error("Dynamic favicon draw failed:", e);
        }
    }

    // --- Timer Display Updates ---
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        timeDigits.textContent = formattedTime;
        
        // Tab title logic: "FocusMood - MM:SS" if running, otherwise "FocusMood - Concentration et Relaxation"
        if (isTimerRunning) {
            document.title = `FocusMood - ${formattedTime}`;
        } else {
            document.title = "FocusMood - Concentration et Relaxation";
        }

        // Calculate progress ring circle offset
        const progressFraction = timeRemaining / timerDuration;
        const offset = circlePerimeter * (1 - progressFraction);
        progressIndicator.style.strokeDashoffset = offset;

        updateFaviconProgress();
    }

    function stopTitleFlashing() {
        if (completionInterval) {
            clearInterval(completionInterval);
            completionInterval = null;
        }
        updateTimerDisplay(); // Restores original or custom active title
    }

    // --- Timer Controls ---
    function startTimer() {
        isTimerRunning = true;
        btnTimerToggle.querySelector(".btn-icon").textContent = "❚❚";
        btnTimerToggle.querySelector(".btn-text").textContent = "Pause";
        
        if (timeStateLabel) timeStateLabel.textContent = "Concentration";
        document.body.classList.remove("theme-paused");

        stopTitleFlashing();
        updateTimerDisplay(); // immediate title update

        // Calculate absolute end time for sleep-mode/veille robustness
        timerEndTime = Date.now() + timeRemaining * 1000;

        // Save state to localStorage
        localStorage.setItem("focusTimerDuration", timerDuration);
        localStorage.setItem("focusTimeRemaining", timeRemaining);

        timerInterval = setInterval(() => {
            // Recalculate remaining time relative to end timestamp
            const calculatedRemaining = Math.max(0, Math.floor((timerEndTime - Date.now()) / 1000));
            timeRemaining = calculatedRemaining;
            localStorage.setItem("focusTimeRemaining", timeRemaining);
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                handleTimerCompletion();
            }
        }, 1000);

        // Resume AudioContext if it exists and is suspended
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        // Update Media Session State
        updateMediaSessionState();

        // Subtle button micro-interaction
        gsap.to(btnTimerToggle, { scale: 1.03, duration: 0.2 });
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        if (timeStateLabel) timeStateLabel.textContent = "En pause";
        document.body.classList.add("theme-paused");

        // Save state to localStorage
        localStorage.setItem("focusTimeRemaining", timeRemaining);

        stopTitleFlashing();
        updateTimerDisplay(); // restore base title

        // Update Media Session State
        updateMediaSessionState();

        gsap.to(btnTimerToggle, { scale: 1, duration: 0.2 });
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        if (timeStateLabel) timeStateLabel.textContent = "Concentration";
        document.body.classList.remove("theme-paused");

        stopTitleFlashing();
        timeRemaining = timerDuration;

        // Save state to localStorage
        localStorage.setItem("focusTimeRemaining", timeRemaining);

        updateTimerDisplay(); // restores base title

        // Update Media Session State
        updateMediaSessionState();

        gsap.fromTo(timeDigits, { opacity: 0.5 }, { opacity: 1, duration: 0.3 });
    }

    function handleTimerCompletion() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        if (timeStateLabel) timeStateLabel.textContent = "Concentration";
        document.body.classList.remove("theme-paused");

        // Play warm Zen bowl chime notification
        playSynthesizedBeep();

        // Send native desktop notification if permitted and enabled by user
        if ("Notification" in window && Notification.permission === "granted" && notificationsEnabled) {
            const minutes = Math.round(timerDuration / 60);
            new Notification("Focus terminé ! 🎉", {
                body: `Félicitations ! Vous avez complété votre session de ${minutes} minutes.`,
            });
        }

        // Start tab title flashing to draw attention
        let flashToggle = false;
        if (completionInterval) clearInterval(completionInterval);
        completionInterval = setInterval(() => {
            flashToggle = !flashToggle;
            document.title = flashToggle ? "Session terminée ! 🎉" : "FocusMood - Terminé";
        }, 1000);

        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        timeRemaining = timerDuration;

        // Reset remaining in localStorage
        localStorage.setItem("focusTimeRemaining", timeRemaining);

        updateTimerDisplay();
    }

    // --- Duration Selectors Events ---
    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            presetBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            inputCustomMinutes.value = "";
            
            if (isTimerRunning) {
                pauseTimer();
            }
            
            stopTitleFlashing();
            
            const minutes = parseInt(btn.getAttribute("data-minutes"), 10);
            timerDuration = minutes * 60;
            timeRemaining = timerDuration;

            // Save state to localStorage
            localStorage.setItem("focusTimerDuration", timerDuration);
            localStorage.setItem("focusTimeRemaining", timeRemaining);

            updateTimerDisplay();
        });
    });

    inputCustomMinutes.addEventListener("input", () => {
        presetBtns.forEach(b => b.classList.remove("active"));
        
        let val = parseInt(inputCustomMinutes.value, 10);
        if (isNaN(val) || val <= 0) {
            val = 30; // fallback to default
        }
        
        if (val > 720) {
            val = 720;
            inputCustomMinutes.value = 720;
        }

        if (isTimerRunning) {
            pauseTimer();
        }

        stopTitleFlashing();

        timerDuration = val * 60;
        timeRemaining = timerDuration;

        // Save state to localStorage
        localStorage.setItem("focusTimerDuration", timerDuration);
        localStorage.setItem("focusTimeRemaining", timeRemaining);

        updateTimerDisplay();
    });

    btnTimerToggle.addEventListener("click", () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            getAudioContext();
            startTimer();
        }
    });

    btnTimerReset.addEventListener("click", resetTimer);

    // --- Web Audio Engine ---
    let audioCtx = null;
    let masterGainNode = null;
    let masterCompressorNode = null;
    
    // Synth node references
    let pinkNodes = null;
    let rainNodes = null;
    let whiteNodes = null;
    let fanNodes = null;
    let brownNodes = null;
    let oceanNodes = null;
    let streamNodes = null;
    let windNodes = null;
    let forestNodes = null;
    let fireNodes = null;
    let cafeNodes = null;
    
    // Interval based synthesizers (Bowl & Piano)
    let bowlInterval = null;
    let bowlOscs = [];
    let bowlGain = null;

    let harpInterval = null;
    let harpOscs = [];
    let harpGain = null;
    let harpIndex = 0;

    // Ondes Alpha
    let alphaOscL = null;
    let alphaOscR = null;
    let alphaGain = null;
    let alphaLfo = null;

    // Ondes Theta
    let thetaOscL = null;
    let thetaOscR = null;
    let thetaGain = null;
    let thetaLfo = null;

    // Campfire
    let campNodes = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            masterCompressorNode = audioCtx.createDynamicsCompressor();
            masterCompressorNode.threshold.setValueAtTime(-12, audioCtx.currentTime);
            masterCompressorNode.knee.setValueAtTime(10, audioCtx.currentTime);
            masterCompressorNode.ratio.setValueAtTime(3, audioCtx.currentTime);
            masterCompressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
            masterCompressorNode.release.setValueAtTime(0.15, audioCtx.currentTime);
            
            masterGainNode = audioCtx.createGain();
            masterGainNode.gain.value = sliderVolume.value / 100;
            
            masterCompressorNode.connect(masterGainNode);
            masterGainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Play Zen Chime sound (harmonic Tibetan bowl simulation)
    function playSynthesizedBeep() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            
            // Warm Tibetan bowl harmonics
            const freqs = [150, 332, 571, 812];
            const gains = [0.12, 0.08, 0.05, 0.03];
            
            const masterChimeGain = ctx.createGain();
            masterChimeGain.gain.setValueAtTime(0.0, now);
            masterChimeGain.connect(masterCompressorNode || masterGainNode);
            
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);
                
                const noteGain = ctx.createGain();
                noteGain.gain.setValueAtTime(0.0, now);
                noteGain.gain.linearRampToValueAtTime(gains[idx], now + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5); // long decay
                
                osc.connect(noteGain);
                noteGain.connect(masterChimeGain);
                osc.start(now);
                osc.stop(now + 2.8);
            });
            
            masterChimeGain.gain.linearRampToValueAtTime(0.85, now + 0.01);
            masterChimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
        } catch (e) {
            console.error("Synthesized chime failed:", e);
        }
    }

    // Helper to generate Pink Noise Buffer
    function generatePinkNoiseBuffer(ctx, seconds = 2) {
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * seconds;
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // Gain compensation
            b6 = white * 0.115926;
        }
        return buffer;
    }

    // Stop standard buffer-based ambient tracks with fadeout
    function stopTrack(nodes, additionalSources) {
        if (!nodes) return;
        const ctx = getAudioContext();
        nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
        nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
        setTimeout(() => {
            if (additionalSources) {
                additionalSources.forEach(src => { try { src.stop(); } catch(e){} });
            } else if (nodes.source) {
                try { nodes.source.stop(); } catch(e){}
            }
        }, 400);
    }

    // 1. Bruit rose
    function startPink() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 2);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        pinkNodes = { source, trackGain };
    }

    function stopPink() {
        if (pinkNodes) {
            stopTrack(pinkNodes);
            pinkNodes = null;
        }
    }

    // 2. Pluie douce
    function startRain() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 2);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
        bandpass.Q.setValueAtTime(0.8, ctx.currentTime);
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(bandpass);
        bandpass.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        
        source.start();
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        
        rainNodes = { source, trackGain };
    }

    function stopRain() {
        if (rainNodes) {
            stopTrack(rainNodes);
            rainNodes = null;
        }
    }

    // 3. Bruit blanc
    function startWhite() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.08;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
        whiteNodes = { source, trackGain };
    }

    function stopWhite() {
        if (whiteNodes) {
            stopTrack(whiteNodes);
            whiteNodes = null;
        }
    }

    // 4. Ventilateur
    function startFan() {
        const ctx = getAudioContext();
        
        const osc1 = ctx.createOscillator(); osc1.type = "sine"; osc1.frequency.value = 52;
        const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 104;
        
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.14;
        }
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 170;
        
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 25;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.07;
        
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.05;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.11;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(noiseGain.gain);
        
        osc1.connect(motorGain);
        osc2.connect(motorGain);
        motorGain.connect(trackGain);
        
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(trackGain);
        
        trackGain.connect(masterCompressorNode || masterGainNode);
        
        osc1.start(); osc2.start(); noiseSource.start(); lfo.start();
        trackGain.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 0.5);
        
        fanNodes = { osc1, osc2, noiseSource, lfo, trackGain };
    }

    function stopFan() {
        if (fanNodes) {
            stopTrack(fanNodes, [fanNodes.osc1, fanNodes.osc2, fanNodes.noiseSource, fanNodes.lfo]);
            fanNodes = null;
        }
    }

    // 5. Bruit brun
    function startBrown() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const lowpassFilter = ctx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.setValueAtTime(320, ctx.currentTime);

        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);

        source.connect(lowpassFilter);
        lowpassFilter.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);

        source.start();
        trackGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.5);

        brownNodes = { source, trackGain };
    }

    function stopBrown() {
        if (brownNodes) {
            stopTrack(brownNodes);
            brownNodes = null;
        }
    }

    // 6. Vagues de la mer
    function startOcean() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 4);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const lowpassFilter = ctx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.setValueAtTime(300, ctx.currentTime);

        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.08; // 12.5s wave cycle

        const lfoFilterGain = ctx.createGain();
        lfoFilterGain.gain.value = 180;
        
        lfo.connect(lfoFilterGain);
        lfoFilterGain.connect(lowpassFilter.frequency);

        const lfoGainNode = ctx.createGain();
        lfoGainNode.gain.value = 0.04;
        
        lfo.connect(lfoGainNode);
        lfoGainNode.connect(trackGain.gain);

        source.connect(lowpassFilter);
        lowpassFilter.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);

        source.start();
        lfo.start();
        
        trackGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.5);
        oceanNodes = { source, lfo, trackGain };
    }

    function stopOcean() {
        if (oceanNodes) {
            stopTrack(oceanNodes, [oceanNodes.source, oceanNodes.lfo]);
            oceanNodes = null;
        }
    }

    // 7. Rivière ou ruisseau
    function startStream() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 2);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(850, ctx.currentTime);
        bandpass.Q.setValueAtTime(3.5, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 3.8;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 240;
        
        lfo.connect(lfoGain);
        lfoGain.connect(bandpass.frequency);
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(bandpass);
        bandpass.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        
        source.start();
        lfo.start();
        
        trackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        streamNodes = { source, lfo, trackGain };
    }

    function stopStream() {
        if (streamNodes) {
            stopTrack(streamNodes, [streamNodes.source, streamNodes.lfo]);
            streamNodes = null;
        }
    }

    // 8. Vent dans les arbres
    function startWind() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 4);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(350, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.12; 
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 180; 
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        source.connect(filter);
        filter.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        
        source.start();
        lfo.start();
        
        trackGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.8);
        windNodes = { source, lfo, trackGain };
    }

    function stopWind() {
        if (windNodes) {
            stopTrack(windNodes, [windNodes.source, windNodes.lfo]);
            windNodes = null;
        }
    }

    // 9. Bruits de forêt (oiseaux, feuilles)
    function startForest() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 5; 
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
            
            const t = i / sampleRate;
            const rustleMod = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.2 * t);
            data[i] = pink * 0.02 * rustleMod;
        }
        
        const drawBirdChirp = (startSec, baseFreq, sweepRange, durationSec) => {
            const startIdx = Math.floor(startSec * sampleRate);
            const len = Math.floor(durationSec * sampleRate);
            for (let i = 0; i < len; i++) {
                if (startIdx + i >= bufferSize) break;
                const t = i / len;
                const freq = baseFreq + sweepRange * Math.sin(Math.PI * t);
                const env = Math.sin(Math.PI * t) * Math.exp(-t * 3);
                const val = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * env * 0.04;
                data[startIdx + i] += val;
            }
        };
        
        drawBirdChirp(0.5, 3200, 800, 0.12);
        drawBirdChirp(0.65, 3500, 600, 0.1);
        drawBirdChirp(1.8, 2800, 1000, 0.15);
        drawBirdChirp(2.0, 3000, 800, 0.12);
        drawBirdChirp(3.5, 4000, 500, 0.08);
        drawBirdChirp(3.6, 4200, 400, 0.08);
        drawBirdChirp(4.2, 3100, 900, 0.18);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        forestNodes = { source, trackGain };
    }

    function stopForest() {
        if (forestNodes) {
            stopTrack(forestNodes);
            forestNodes = null;
        }
    }

    // 10. Bols tibétains
    function triggerBowlStroke() {
        if (!bowlGain) return;
        const ctx = getAudioContext();
        
        const root = 146.83; 
        const overtones = [1.0, 2.008, 3.018, 4.032, 5.051];
        const amplitudes = [0.24, 0.12, 0.06, 0.03, 0.015];
        
        overtones.forEach((ratio, idx) => {
            const f = root * ratio;
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = f;
            
            const tremolo = ctx.createOscillator();
            tremolo.frequency.value = 2.2;
            const tremoloGain = ctx.createGain();
            tremoloGain.gain.value = 0.006 * amplitudes[idx];
            
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.0, ctx.currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(bowlGain);
            
            tremolo.connect(tremoloGain);
            tremoloGain.connect(oscGain.gain);
            
            osc.start();
            tremolo.start();
            
            oscGain.gain.linearRampToValueAtTime(amplitudes[idx], ctx.currentTime + 0.25);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7.8);
            
            bowlOscs.push(osc);
            setTimeout(() => {
                try {
                    osc.stop();
                    tremolo.stop();
                } catch(e){}
            }, 8000);
        });
    }

    function startBowl() {
        const ctx = getAudioContext();
        bowlGain = ctx.createGain();
        bowlGain.gain.setValueAtTime(0.0, ctx.currentTime);
        bowlGain.connect(masterCompressorNode || masterGainNode);
        
        triggerBowlStroke();
        bowlInterval = setInterval(triggerBowlStroke, 7000);
        bowlGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.6);
    }

    function stopBowl() {
        if (bowlInterval) {
            clearInterval(bowlInterval);
            bowlInterval = null;
        }
        if (bowlGain) {
            const ctx = getAudioContext();
            const activeGain = bowlGain; bowlGain = null;
            const activeOscs = bowlOscs; bowlOscs = [];
            
            activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime);
            activeGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.5);
            
            setTimeout(() => {
                activeOscs.forEach(o => { try { o.stop(); } catch(e){} });
            }, 1800);
        }
    }

    // 11. Bruit de cheminée (Feu de camp)
    function startFire() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 3; 
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
            
            data[i] *= 0.08;
        }
        
        const numCrackles = 32;
        for (let c = 0; c < numCrackles; c++) {
            const pos = Math.floor(Math.random() * (bufferSize - 1000));
            const duration = Math.floor(Math.random() * 450) + 80;
            const amplitude = Math.random() * 0.45 + 0.15;
            for (let i = 0; i < duration; i++) {
                const t = i / duration;
                const click = (Math.random() * 2 - 1) * amplitude * Math.exp(-t * 24);
                data[pos + i] += click;
            }
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        fireNodes = { source, trackGain };
    }

    function stopFire() {
        if (fireNodes) {
            stopTrack(fireNodes);
            fireNodes = null;
        }
    }

    // 12. Bruits de café
    function startCafe() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 5; 
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / sampleRate;
            const voice1 = Math.sin(2 * Math.PI * 180 * t + Math.sin(2 * Math.PI * 1.5 * t));
            const voice2 = Math.sin(2 * Math.PI * 220 * t + Math.sin(2 * Math.PI * 0.9 * t));
            const voice3 = Math.sin(2 * Math.PI * 140 * t + Math.sin(2 * Math.PI * 2.3 * t));
            data[i] = (voice1 + voice2 + voice3) * 0.005;
        }
        
        const drawCupClink = (startSec, pitchFreq) => {
            const startIdx = Math.floor(startSec * sampleRate);
            const duration = Math.floor(0.08 * sampleRate);
            for (let i = 0; i < duration; i++) {
                if (startIdx + i >= bufferSize) break;
                const t = i / sampleRate;
                const val = Math.sin(2 * Math.PI * pitchFreq * t) * Math.exp(-t * 85) * 0.08;
                data[startIdx + i] += val;
            }
        };
        
        drawCupClink(0.4, 2500);
        drawCupClink(1.2, 2800);
        drawCupClink(2.8, 2200);
        drawCupClink(3.9, 2900);
        drawCupClink(4.5, 2600);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
        cafeNodes = { source, trackGain };
    }

    function stopCafe() {
        if (cafeNodes) {
            stopTrack(cafeNodes);
            cafeNodes = null;
        }
    }

    // 13. Harpe (Apaisante arpeggiator synthesis)
    const harpChords = [
        [130.81, 196.00, 261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
        [87.31, 130.81, 174.61, 220.00, 261.63, 349.23, 440.00],   // Fmaj9
        [110.00, 164.81, 220.00, 261.63, 329.63, 440.00, 523.25],  // Am9
        [98.00, 146.83, 196.00, 246.94, 293.66, 392.00, 493.88]    // G9
    ];

    function triggerHarpArpeggio() {
        if (!harpGain) return;
        const ctx = getAudioContext();
        const chord = harpChords[harpIndex];
        
        chord.forEach((freq, noteIdx) => {
            const delay = noteIdx * 0.085; // Arpeggiation delay
            
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;
            
            const overtone = ctx.createOscillator();
            overtone.type = "sine";
            overtone.frequency.value = freq * 3; // high frequency resonance pluck
            
            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
            
            osc.connect(noteGain);
            overtone.connect(noteGain);
            noteGain.connect(harpGain);
            
            osc.start(ctx.currentTime + delay);
            overtone.start(ctx.currentTime + delay);
            
            noteGain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + delay + 0.01);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 3.8);
            
            harpOscs.push(osc, overtone);
            
            setTimeout(() => {
                try {
                    osc.stop();
                    overtone.stop();
                } catch(e){}
            }, (delay + 4.2) * 1000);
        });
        
        harpIndex = (harpIndex + 1) % harpChords.length;
    }

    function startHarp() {
        const ctx = getAudioContext();
        harpGain = ctx.createGain();
        harpGain.gain.setValueAtTime(0.0, ctx.currentTime);
        harpGain.connect(masterCompressorNode || masterGainNode);
        
        harpIndex = 0;
        triggerHarpArpeggio();
        harpInterval = setInterval(triggerHarpArpeggio, 4000);
        
        harpGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.6);
    }

    function stopHarp() {
        if (harpInterval) {
            clearInterval(harpInterval);
            harpInterval = null;
        }
        if (harpGain) {
            const ctx = getAudioContext();
            const activeGain = harpGain; harpGain = null;
            const activeOscs = harpOscs; harpOscs = [];
            
            activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime);
            activeGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.5);
            
            setTimeout(() => {
                activeOscs.forEach(o => { try { o.stop(); } catch(e){} });
            }, 1800);
        }
    }

    // 14. Ondes Alpha
    function startAlpha() {
        const ctx = getAudioContext();
        
        alphaOscL = ctx.createOscillator();
        alphaOscL.type = "sine";
        alphaOscL.frequency.value = 140;
        
        alphaOscR = ctx.createOscillator();
        alphaOscR.type = "sine";
        alphaOscR.frequency.value = 150; // 10Hz difference
        
        const panL = ctx.createStereoPanner();
        panL.pan.value = -1;
        
        const panR = ctx.createStereoPanner();
        panR.pan.value = 1;
        
        alphaGain = ctx.createGain();
        alphaGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        alphaOscL.connect(panL);
        panL.connect(alphaGain);
        
        alphaOscR.connect(panR);
        panR.connect(alphaGain);
        
        alphaLfo = ctx.createOscillator();
        alphaLfo.frequency.value = 0.15;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.15;
        
        alphaLfo.connect(lfoGain);
        lfoGain.connect(alphaGain.gain);
        
        alphaGain.connect(masterCompressorNode || masterGainNode);
        
        alphaOscL.start();
        alphaOscR.start();
        alphaLfo.start();
        
        alphaGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);
    }

    function stopAlpha() {
        if (alphaGain) {
            const ctx = getAudioContext();
            const g = alphaGain;
            const oL = alphaOscL;
            const oR = alphaOscR;
            const lfo = alphaLfo;
            
            alphaGain = null;
            alphaOscL = null;
            alphaOscR = null;
            alphaLfo = null;
            
            g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);
            
            setTimeout(() => {
                try { oL.stop(); } catch(e){}
                try { oR.stop(); } catch(e){}
                try { lfo.stop(); } catch(e){}
            }, 1200);
        }
    }

    // 15. Ondes Theta
    function startTheta() {
        const ctx = getAudioContext();
        
        thetaOscL = ctx.createOscillator();
        thetaOscL.type = "sine";
        thetaOscL.frequency.value = 90;
        
        thetaOscR = ctx.createOscillator();
        thetaOscR.type = "sine";
        thetaOscR.frequency.value = 96; // 6Hz difference
        
        const panL = ctx.createStereoPanner();
        panL.pan.value = -1;
        
        const panR = ctx.createStereoPanner();
        panR.pan.value = 1;
        
        thetaGain = ctx.createGain();
        thetaGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        thetaOscL.connect(panL);
        panL.connect(thetaGain);
        
        thetaOscR.connect(panR);
        panR.connect(thetaGain);
        
        thetaLfo = ctx.createOscillator();
        thetaLfo.frequency.value = 0.1;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.12;
        
        thetaLfo.connect(lfoGain);
        lfoGain.connect(thetaGain.gain);
        
        thetaGain.connect(masterCompressorNode || masterGainNode);
        
        thetaOscL.start();
        thetaOscR.start();
        thetaLfo.start();
        
        thetaGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5);
    }

    function stopTheta() {
        if (thetaGain) {
            const ctx = getAudioContext();
            const g = thetaGain;
            const oL = thetaOscL;
            const oR = thetaOscR;
            const lfo = thetaLfo;
            
            thetaGain = null;
            thetaOscL = null;
            thetaOscR = null;
            thetaLfo = null;
            
            g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);
            
            setTimeout(() => {
                try { oL.stop(); } catch(e){}
                try { oR.stop(); } catch(e){}
                try { lfo.stop(); } catch(e){}
            }, 1200);
        }
    }

    // 16. Feu de camp
    function startCampfire() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 4; 
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
            
            data[i] *= 0.14;
        }
        
        const numCrackles = 24;
        for (let c = 0; c < numCrackles; c++) {
            const pos = Math.floor(Math.random() * (bufferSize - 1200));
            const duration = Math.floor(Math.random() * 600) + 120;
            const amplitude = Math.random() * 0.6 + 0.2;
            for (let i = 0; i < duration; i++) {
                const t = i / duration;
                const click = (Math.random() * 2 - 1) * amplitude * Math.exp(-t * 20);
                data[pos + i] += click;
            }
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterCompressorNode || masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.5);
        campNodes = { source, trackGain };
    }

    function stopCampfire() {
        if (campNodes) {
            stopTrack(campNodes);
            campNodes = null;
        }
    }

    // --- Audio Control Listeners ---
    const tracks = [
        { id: "btn-audio-pink", start: startPink, stop: stopPink, isActive: () => !!pinkNodes },
        { id: "btn-audio-rain", start: startRain, stop: stopRain, isActive: () => !!rainNodes },
        { id: "btn-audio-white", start: startWhite, stop: stopWhite, isActive: () => !!whiteNodes },
        { id: "btn-audio-fan", start: startFan, stop: stopFan, isActive: () => !!fanNodes },
        { id: "btn-audio-brown", start: startBrown, stop: stopBrown, isActive: () => !!brownNodes },
        { id: "btn-audio-ocean", start: startOcean, stop: stopOcean, isActive: () => !!oceanNodes },
        { id: "btn-audio-stream", start: startStream, stop: stopStream, isActive: () => !!streamNodes },
        { id: "btn-audio-wind", start: startWind, stop: stopWind, isActive: () => !!windNodes },
        { id: "btn-audio-forest", start: startForest, stop: stopForest, isActive: () => !!forestNodes },
        { id: "btn-audio-bowl", start: startBowl, stop: stopBowl, isActive: () => !!bowlGain },
        { id: "btn-audio-fire", start: startFire, stop: stopFire, isActive: () => !!fireNodes },
        { id: "btn-audio-cafe", start: startCafe, stop: stopCafe, isActive: () => !!cafeNodes },
        { id: "btn-audio-harp", start: startHarp, stop: stopHarp, isActive: () => !!harpGain },
        { id: "btn-audio-alpha", start: startAlpha, stop: stopAlpha, isActive: () => !!alphaGain },
        { id: "btn-audio-theta", start: startTheta, stop: stopTheta, isActive: () => !!thetaGain },
        { id: "btn-audio-camp", start: startCampfire, stop: stopCampfire, isActive: () => !!campNodes }
    ];

    tracks.forEach(track => {
        const btn = document.getElementById(track.id);
        if (btn) {
            btn.addEventListener("click", () => {
                if (track.isActive()) {
                    track.stop();
                    btn.classList.remove("playing");
                    btn.textContent = "Jouer";
                } else {
                    getAudioContext();
                    track.start();
                    btn.classList.add("playing");
                    btn.textContent = "Arrêter";
                }
            });
        }
    });

    sliderVolume.addEventListener("input", (e) => {
        const val = e.target.value;
        volumeValDisplay.textContent = `${val}%`;
        if (masterGainNode) {
            masterGainNode.gain.setValueAtTime(val / 100, audioCtx.currentTime);
        }
    });

    // Stop completion notifications/flashing on click anywhere on page
    document.addEventListener("click", () => {
        if (completionInterval) {
            stopTitleFlashing();
        }
    });

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        // Ignore typing inside input/textarea fields
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
            return;
        }
        if (e.code === "Space") {
            e.preventDefault();
            if (isTimerRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        } else if (e.key === "r" || e.key === "R") {
            e.preventDefault();
            resetTimer();
        }
    });

    // --- Notification Switch Logic ---
    function updateNotifToggleUI() {
        if (!toggleNotifBtn || !notifWrapper) return;
        const isEnabled = notificationsEnabled && ("Notification" in window) && (Notification.permission === "granted");
        toggleNotifBtn.setAttribute("aria-checked", isEnabled ? "true" : "false");
        if (isEnabled) {
            notifWrapper.classList.add("active");
        } else {
            notifWrapper.classList.remove("active");
        }
    }

    if (toggleNotifBtn) {
        toggleNotifBtn.addEventListener("click", () => {
            if (!("Notification" in window)) {
                alert("Les notifications ne sont pas supportées par votre navigateur.");
                return;
            }

            if (Notification.permission === "denied") {
                alert("Vous avez désactivé les notifications pour FocusMood. Pour les réactiver, veuillez modifier les permissions du site dans la barre d'adresse de votre navigateur.");
                return;
            }

            if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        notificationsEnabled = true;
                        localStorage.setItem("focusNotificationsEnabled", "true");
                    } else {
                        notificationsEnabled = false;
                        localStorage.setItem("focusNotificationsEnabled", "false");
                    }
                    updateNotifToggleUI();
                });
            } else if (Notification.permission === "granted") {
                notificationsEnabled = !notificationsEnabled;
                localStorage.setItem("focusNotificationsEnabled", notificationsEnabled ? "true" : "false");
                updateNotifToggleUI();
            }
        });
    }

    // --- Media Session API ---
    function updateMediaSessionState() {
        if (!("mediaSession" in navigator)) return;
        
        navigator.mediaSession.playbackState = isTimerRunning ? "playing" : "paused";
        navigator.mediaSession.metadata = new MediaMetadata({
            title: isTimerRunning ? "Concentration active" : "FocusMood en pause",
            artist: "FocusMood",
            album: "Concentration et Relaxation",
            artwork: [
                { src: "favicon.png", sizes: "512x512", type: "image/png" }
            ]
        });
    }

    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => {
            if (!isTimerRunning) {
                startTimer();
            }
        });
        navigator.mediaSession.setActionHandler("pause", () => {
            if (isTimerRunning) {
                pauseTimer();
            }
        });
    }

    // --- Sleep/Veille Wakeup Listeners ---
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && isTimerRunning && timerEndTime !== null) {
            const calculatedRemaining = Math.max(0, Math.floor((timerEndTime - Date.now()) / 1000));
            timeRemaining = calculatedRemaining;
            localStorage.setItem("focusTimeRemaining", timeRemaining);
            updateTimerDisplay();
            if (timeRemaining <= 0) {
                handleTimerCompletion();
            }
        }
    });

    window.addEventListener("focus", () => {
        if (isTimerRunning && timerEndTime !== null) {
            const calculatedRemaining = Math.max(0, Math.floor((timerEndTime - Date.now()) / 1000));
            timeRemaining = calculatedRemaining;
            localStorage.setItem("focusTimeRemaining", timeRemaining);
            updateTimerDisplay();
            if (timeRemaining <= 0) {
                handleTimerCompletion();
            }
        }
    });

    // Restore preset active class based on loaded timerDuration
    const durationMinutes = Math.round(timerDuration / 60);
    let matchedPreset = false;
    presetBtns.forEach(btn => {
        if (parseInt(btn.getAttribute("data-minutes"), 10) === durationMinutes) {
            btn.classList.add("active");
            matchedPreset = true;
        } else {
            btn.classList.remove("active");
        }
    });
    if (!matchedPreset) {
        inputCustomMinutes.value = durationMinutes;
    }

    // --- Initialization ---
    const yearEl = document.getElementById("current-year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
    updateNotifToggleUI();
    updateTimerDisplay();
});
