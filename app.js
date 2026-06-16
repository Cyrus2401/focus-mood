/* ==========================================================================
   APP.JS — FocusMood Application Logic
   Features: GSAP entry animations, Custom Timer (presets & custom), 12 Synth Tracks
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // --- Initial Entry Motion using GSAP ---
    initGSAPAnimations();

    // --- State Variables ---
    let timerInterval = null;
    let isTimerRunning = false;
    
    // Default duration in seconds (30 minutes)
    let timerDuration = 30 * 60;
    let timeRemaining = timerDuration;

    // --- DOM Elements ---
    const timeDigits = document.getElementById("time-digits");
    const progressIndicator = document.getElementById("progress-indicator");
    
    const btnTimerToggle = document.getElementById("btn-timer-toggle");
    const btnTimerReset = document.getElementById("btn-timer-reset");
    
    const presetBtns = document.querySelectorAll(".preset-btn");
    const inputCustomMinutes = document.getElementById("input-custom-minutes");
    
    // Audio buttons
    const btnAudioAlpha = document.getElementById("btn-audio-alpha");
    const btnAudioTheta = document.getElementById("btn-audio-theta");
    const btnAudioPink = document.getElementById("btn-audio-pink");
    const btnAudioBrown = document.getElementById("btn-audio-brown");
    const btnAudioOcean = document.getElementById("btn-audio-ocean");
    const btnAudioRain = document.getElementById("btn-audio-rain");
    const btnAudioStream = document.getElementById("btn-audio-stream");
    const btnAudioFire = document.getElementById("btn-audio-fire");
    const btnAudioCrickets = document.getElementById("btn-audio-crickets");
    const btnAudioHeart = document.getElementById("btn-audio-heart");
    const btnAudioDrone = document.getElementById("btn-audio-drone");
    const btnAudioViolin = document.getElementById("btn-audio-violin");
    
    const sliderVolume = document.getElementById("slider-volume");
    const volumeValDisplay = document.getElementById("volume-val-display");

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
    }

    // --- Timer Controls ---
    function startTimer() {
        isTimerRunning = true;
        btnTimerToggle.querySelector(".btn-icon").textContent = "❚❚";
        btnTimerToggle.querySelector(".btn-text").textContent = "Pause";
        
        updateTimerDisplay(); // immediate title update

        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                handleTimerCompletion();
            }
        }, 1000);

        // Subtle button micro-interaction
        gsap.to(btnTimerToggle, { scale: 1.03, duration: 0.2 });
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        updateTimerDisplay(); // restore base title

        gsap.to(btnTimerToggle, { scale: 1, duration: 0.2 });
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        timeRemaining = timerDuration;
        updateTimerDisplay(); // restores base title

        gsap.fromTo(timeDigits, { opacity: 0.5 }, { opacity: 1, duration: 0.3 });
    }

    function handleTimerCompletion() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        
        // Play beep notification
        playSynthesizedBeep();

        btnTimerToggle.querySelector(".btn-icon").textContent = "▶";
        btnTimerToggle.querySelector(".btn-text").textContent = "Démarrer";
        
        timeRemaining = timerDuration;
        updateTimerDisplay();
    }

    // --- Duration Selectors Events ---
    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active classes
            presetBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // Clear custom input
            inputCustomMinutes.value = "";
            
            // Pause timer if running
            if (isTimerRunning) {
                pauseTimer();
            }
            
            const minutes = parseInt(btn.getAttribute("data-minutes"), 10);
            timerDuration = minutes * 60;
            timeRemaining = timerDuration;
            updateTimerDisplay();
        });
    });

    inputCustomMinutes.addEventListener("input", () => {
        // Remove active class from preset buttons
        presetBtns.forEach(b => b.classList.remove("active"));
        
        let val = parseInt(inputCustomMinutes.value, 10);
        if (isNaN(val) || val <= 0) {
            val = 30; // fallback to default
        }
        
        // Cap duration to 720 minutes (12 hours)
        if (val > 720) {
            val = 720;
            inputCustomMinutes.value = 720;
        }

        // Pause timer if running
        if (isTimerRunning) {
            pauseTimer();
        }

        timerDuration = val * 60;
        timeRemaining = timerDuration;
        updateTimerDisplay();
    });

    btnTimerToggle.addEventListener("click", () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            // Unlock Web Audio Context if needed
            getAudioContext();
            startTimer();
        }
    });

    btnTimerReset.addEventListener("click", resetTimer);

    // --- Web Audio Engine ---
    let audioCtx = null;
    let masterGainNode = null;
    
    // Synth node references
    let alphaNodes = null;
    let thetaNodes = null;
    let pinkNodes = null;
    let brownNodes = null;
    let oceanNodes = null;
    let rainNodes = null;
    let streamNodes = null;
    let fireNodes = null;
    let cricketsNodes = null;
    let heartNodes = null;
    let droneNodes = null;
    
    // Violin scheduler variables
    let violinInterval = null;
    let violinOscs = [];
    let violinVibratos = [];
    let violinFilter = null;
    let violinGain = null;
    let violinIndex = 0;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create Master Gain node
            masterGainNode = audioCtx.createGain();
            masterGainNode.gain.value = sliderVolume.value / 100;
            masterGainNode.connect(audioCtx.destination);
        }
        
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Play Beep sound
    function playSynthesizedBeep() {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            
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

    // 1. Ondes Alpha (Binaural: 200Hz / 210Hz)
    function startAlpha() {
        const ctx = getAudioContext();
        const leftOsc = ctx.createOscillator(); leftOsc.type = "sine"; leftOsc.frequency.value = 200;
        const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (leftPanner) leftPanner.pan.value = -1;

        const rightOsc = ctx.createOscillator(); rightOsc.type = "sine"; rightOsc.frequency.value = 210;
        const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (rightPanner) rightPanner.pan.value = 1;

        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);

        if (leftPanner && rightPanner) {
            leftOsc.connect(leftPanner); leftPanner.connect(trackGain);
            rightOsc.connect(rightPanner); rightPanner.connect(trackGain);
        } else {
            leftOsc.connect(trackGain); rightOsc.connect(trackGain);
        }
        trackGain.connect(masterGainNode);

        leftOsc.start(); rightOsc.start();
        trackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        alphaNodes = { leftOsc, rightOsc, trackGain };
    }

    function stopAlpha() {
        if (alphaNodes) {
            const ctx = getAudioContext();
            const nodes = alphaNodes; alphaNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.leftOsc.stop(); nodes.rightOsc.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 2. Ondes Theta (Binaural: 200Hz / 206Hz)
    function startTheta() {
        const ctx = getAudioContext();
        const leftOsc = ctx.createOscillator(); leftOsc.type = "sine"; leftOsc.frequency.value = 200;
        const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (leftPanner) leftPanner.pan.value = -1;

        const rightOsc = ctx.createOscillator(); rightOsc.type = "sine"; rightOsc.frequency.value = 206;
        const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (rightPanner) rightPanner.pan.value = 1;

        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);

        if (leftPanner && rightPanner) {
            leftOsc.connect(leftPanner); leftPanner.connect(trackGain);
            rightOsc.connect(rightPanner); rightPanner.connect(trackGain);
        } else {
            leftOsc.connect(trackGain); rightOsc.connect(trackGain);
        }
        trackGain.connect(masterGainNode);

        leftOsc.start(); rightOsc.start();
        trackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        thetaNodes = { leftOsc, rightOsc, trackGain };
    }

    function stopTheta() {
        if (thetaNodes) {
            const ctx = getAudioContext();
            const nodes = thetaNodes; thetaNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.leftOsc.stop(); nodes.rightOsc.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 3. Bruit Rose (Pink Noise)
    function startPink() {
        const ctx = getAudioContext();
        const buffer = generatePinkNoiseBuffer(ctx, 2);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        pinkNodes = { source, trackGain };
    }

    function stopPink() {
        if (pinkNodes) {
            const ctx = getAudioContext();
            const nodes = pinkNodes; pinkNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 4. Bruit Brun (Deep Brownian Noise)
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
        trackGain.connect(masterGainNode);

        source.start();
        trackGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.5);

        brownNodes = { source, trackGain };
    }

    function stopBrown() {
        if (brownNodes) {
            const ctx = getAudioContext();
            const nodes = brownNodes; brownNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 5. Vagues (Modulated Pink Noise Ocean Waves)
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
        trackGain.connect(masterGainNode);

        source.start();
        lfo.start();
        
        trackGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.5);
        oceanNodes = { source, lfo, trackGain };
    }

    function stopOcean() {
        if (oceanNodes) {
            const ctx = getAudioContext();
            const nodes = oceanNodes; oceanNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); nodes.lfo.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 6. Pluie (Filtered Pink Noise with droplet character)
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
        trackGain.connect(masterGainNode);
        
        source.start();
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        
        rainNodes = { source, trackGain };
    }

    function stopRain() {
        if (rainNodes) {
            const ctx = getAudioContext();
            const nodes = rainNodes; rainNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 7. Ruisseau (Modulated Bubbling Water Stream)
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
        
        // Fast LFO to create rapid bubbling ripples
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
        trackGain.connect(masterGainNode);
        
        source.start();
        lfo.start();
        
        trackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        streamNodes = { source, lfo, trackGain };
    }

    function stopStream() {
        if (streamNodes) {
            const ctx = getAudioContext();
            const nodes = streamNodes; streamNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); nodes.lfo.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 8. Crépitement du Feu (Campfire: Pink base + transient click envelopes)
    function startFire() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 3; // 3 seconds loop
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate soft pink noise rumble
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
            
            // Soft base volume
            data[i] *= 0.08;
        }
        
        // Superimpose random high frequency click decay transients
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
        trackGain.connect(masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
        fireNodes = { source, trackGain };
    }

    function stopFire() {
        if (fireNodes) {
            const ctx = getAudioContext();
            const nodes = fireNodes; fireNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 9. Grillons (Night Crickets summer chirps)
    function startCrickets() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate * 4; // 4 seconds loop
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        const chirp = (startSec) => {
            const start = Math.floor(startSec * sampleRate);
            const duration = Math.floor(0.06 * sampleRate); // 60ms
            for (let i = 0; i < duration; i++) {
                const t = i / sampleRate;
                const ampMod = Math.sin(2 * Math.PI * 45 * t); // 45Hz flutter
                const sineVal = Math.sin(2 * Math.PI * 3950 * t); // 3.95kHz carrier
                const env = Math.exp(-t * 30);
                data[start + i] += sineVal * (0.5 + 0.5 * ampMod) * env * 0.12;
            }
        };
        
        // Summer night rhythmic scheduling
        chirp(0.4); chirp(0.55); chirp(0.7);
        chirp(1.6); chirp(1.75); chirp(1.9);
        chirp(2.8); chirp(2.95); chirp(3.1);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
        cricketsNodes = { source, trackGain };
    }

    function stopCrickets() {
        if (cricketsNodes) {
            const ctx = getAudioContext();
            const nodes = cricketsNodes; cricketsNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 10. Battement de Cœur (Calming rhythmic heart pulse at 60 BPM)
    function startHeart() {
        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate;
        const bufferSize = sampleRate; // 1 second (60 BPM)
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Lub thud
        const lubLen = Math.floor(sampleRate * 0.15);
        for (let i = 0; i < lubLen; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 52 * t) * Math.exp(-t * 22);
        }
        
        // Dub thud at 0.32s
        const dubStart = Math.floor(sampleRate * 0.32);
        const dubLen = Math.floor(sampleRate * 0.15);
        for (let i = 0; i < dubLen; i++) {
            const t = i / sampleRate;
            data[dubStart + i] = Math.sin(2 * Math.PI * 45 * t) * Math.exp(-t * 22) * 0.72;
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        source.connect(trackGain);
        trackGain.connect(masterGainNode);
        source.start();
        
        trackGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
        heartNodes = { source, trackGain };
    }

    function stopHeart() {
        if (heartNodes) {
            const ctx = getAudioContext();
            const nodes = heartNodes; heartNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
            setTimeout(() => {
                try { nodes.source.stop(); } catch (err) {}
            }, 400);
        }
    }

    // 11. Drone Zen (Warm major triad harmonic drone)
    function startDrone() {
        const ctx = getAudioContext();
        const frequencies = [110, 165, 220, 275]; // A2, E3, A3, C#4
        const oscs = [];
        
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(240, ctx.currentTime);
        
        const trackGain = ctx.createGain();
        trackGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        frequencies.forEach(f => {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = f;
            osc.connect(filter);
            osc.start();
            oscs.push(osc);
        });
        
        filter.connect(trackGain);
        trackGain.connect(masterGainNode);
        
        trackGain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.8);
        droneNodes = { oscs, filter, trackGain };
    }

    function stopDrone() {
        if (droneNodes) {
            const ctx = getAudioContext();
            const nodes = droneNodes; droneNodes = null;
            nodes.trackGain.gain.setValueAtTime(nodes.trackGain.gain.value, ctx.currentTime);
            nodes.trackGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.5);
            setTimeout(() => {
                nodes.oscs.forEach(osc => {
                    try { osc.stop(); } catch (err) {}
                });
            }, 500);
        }
    }

    // 12. Violon Calme (Generative soothing chord progression synthesizer)
    function playViolinChordStep() {
        if (!violinGain) return;
        const ctx = getAudioContext();
        
        const chords = [
            [110, 165, 220, 261.63],   // Am7 base (A2, E3, A3, C4)
            [98, 146.83, 196, 246.94],  // G (G2, D3, G3, B3)
            [87.31, 130.81, 174.61, 220], // F (F2, C3, F3, A3)
            [82.41, 123.47, 164.81, 196]  // Em (E2, B2, E3, G3)
        ];
        
        const freqList = chords[violinIndex];
        
        // Fade out previous oscillators
        violinOscs.forEach(o => {
            try {
                o.gainNode.gain.setValueAtTime(o.gainNode.gain.value, ctx.currentTime);
                o.gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.8);
                setTimeout(() => {
                    try { o.osc.stop(); } catch(e){}
                }, 2000);
            } catch(err){}
        });
        violinOscs = [];
        
        // Stop older vibrato nodes
        violinVibratos.forEach(v => {
            try { v.stop(); } catch(e){}
        });
        violinVibratos = [];
        
        // Play new chord
        freqList.forEach(f => {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = f;
            
            // Slow vibrato LFO (4.8 Hz)
            const vibrato = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            vibrato.frequency.value = 4.8;
            vibratoGain.gain.value = f * 0.008; // subtle vibrato depth
            
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.0, ctx.currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(violinFilter);
            
            osc.start();
            vibrato.start();
            
            // Slow envelope attack
            oscGain.gain.linearRampToValueAtTime(0.024, ctx.currentTime + 2.5);
            
            violinOscs.push({ osc, gainNode: oscGain });
            violinVibratos.push(vibrato);
        });
        
        violinIndex = (violinIndex + 1) % chords.length;
    }
    
    function startViolin() {
        const ctx = getAudioContext();
        
        violinFilter = ctx.createBiquadFilter();
        violinFilter.type = "lowpass";
        violinFilter.frequency.setValueAtTime(320, ctx.currentTime);
        
        violinGain = ctx.createGain();
        violinGain.gain.setValueAtTime(0.0, ctx.currentTime);
        
        violinFilter.connect(violinGain);
        violinGain.connect(masterGainNode);
        
        violinIndex = 0;
        playViolinChordStep();
        
        // Cycle notes every 6 seconds
        violinInterval = setInterval(playViolinChordStep, 6000);
        violinGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.8);
    }

    function stopViolin() {
        if (violinInterval) {
            clearInterval(violinInterval);
            violinInterval = null;
        }
        if (violinGain) {
            const ctx = getAudioContext();
            const activeGain = violinGain; violinGain = null;
            const activeOscs = violinOscs; violinOscs = [];
            const activeVibs = violinVibratos; violinVibratos = [];
            
            activeGain.gain.setValueAtTime(activeGain.gain.value, ctx.currentTime);
            activeGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.8);
            
            activeOscs.forEach(o => {
                try {
                    o.gainNode.gain.setValueAtTime(o.gainNode.gain.value, ctx.currentTime);
                    o.gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.8);
                } catch(e){}
            });
            
            setTimeout(() => {
                activeOscs.forEach(o => { try { o.osc.stop(); } catch(e){} });
                activeVibs.forEach(v => { try { v.stop(); } catch(e){} });
            }, 2000);
        }
    }

    // --- Audio Control Listeners ---
    btnAudioAlpha.addEventListener("click", () => {
        if (alphaNodes) {
            stopAlpha();
            btnAudioAlpha.classList.remove("playing");
            btnAudioAlpha.textContent = "Jouer";
        } else {
            getAudioContext();
            startAlpha();
            btnAudioAlpha.classList.add("playing");
            btnAudioAlpha.textContent = "Arrêter";
        }
    });

    btnAudioTheta.addEventListener("click", () => {
        if (thetaNodes) {
            stopTheta();
            btnAudioTheta.classList.remove("playing");
            btnAudioTheta.textContent = "Jouer";
        } else {
            getAudioContext();
            startTheta();
            btnAudioTheta.classList.add("playing");
            btnAudioTheta.textContent = "Arrêter";
        }
    });

    btnAudioPink.addEventListener("click", () => {
        if (pinkNodes) {
            stopPink();
            btnAudioPink.classList.remove("playing");
            btnAudioPink.textContent = "Jouer";
        } else {
            getAudioContext();
            startPink();
            btnAudioPink.classList.add("playing");
            btnAudioPink.textContent = "Arrêter";
        }
    });

    btnAudioBrown.addEventListener("click", () => {
        if (brownNodes) {
            stopBrown();
            btnAudioBrown.classList.remove("playing");
            btnAudioBrown.textContent = "Jouer";
        } else {
            getAudioContext();
            startBrown();
            btnAudioBrown.classList.add("playing");
            btnAudioBrown.textContent = "Arrêter";
        }
    });

    btnAudioOcean.addEventListener("click", () => {
        if (oceanNodes) {
            stopOcean();
            btnAudioOcean.classList.remove("playing");
            btnAudioOcean.textContent = "Jouer";
        } else {
            getAudioContext();
            startOcean();
            btnAudioOcean.classList.add("playing");
            btnAudioOcean.textContent = "Arrêter";
        }
    });

    btnAudioRain.addEventListener("click", () => {
        if (rainNodes) {
            stopRain();
            btnAudioRain.classList.remove("playing");
            btnAudioRain.textContent = "Jouer";
        } else {
            getAudioContext();
            startRain();
            btnAudioRain.classList.add("playing");
            btnAudioRain.textContent = "Arrêter";
        }
    });

    btnAudioStream.addEventListener("click", () => {
        if (streamNodes) {
            stopStream();
            btnAudioStream.classList.remove("playing");
            btnAudioStream.textContent = "Jouer";
        } else {
            getAudioContext();
            startStream();
            btnAudioStream.classList.add("playing");
            btnAudioStream.textContent = "Arrêter";
        }
    });

    btnAudioFire.addEventListener("click", () => {
        if (fireNodes) {
            stopFire();
            btnAudioFire.classList.remove("playing");
            btnAudioFire.textContent = "Jouer";
        } else {
            getAudioContext();
            startFire();
            btnAudioFire.classList.add("playing");
            btnAudioFire.textContent = "Arrêter";
        }
    });

    btnAudioCrickets.addEventListener("click", () => {
        if (cricketsNodes) {
            stopCrickets();
            btnAudioCrickets.classList.remove("playing");
            btnAudioCrickets.textContent = "Jouer";
        } else {
            getAudioContext();
            startCrickets();
            btnAudioCrickets.classList.add("playing");
            btnAudioCrickets.textContent = "Arrêter";
        }
    });

    btnAudioHeart.addEventListener("click", () => {
        if (heartNodes) {
            stopHeart();
            btnAudioHeart.classList.remove("playing");
            btnAudioHeart.textContent = "Jouer";
        } else {
            getAudioContext();
            startHeart();
            btnAudioHeart.classList.add("playing");
            btnAudioHeart.textContent = "Arrêter";
        }
    });

    btnAudioDrone.addEventListener("click", () => {
        if (droneNodes) {
            stopDrone();
            btnAudioDrone.classList.remove("playing");
            btnAudioDrone.textContent = "Jouer";
        } else {
            getAudioContext();
            startDrone();
            btnAudioDrone.classList.add("playing");
            btnAudioDrone.textContent = "Arrêter";
        }
    });

    btnAudioViolin.addEventListener("click", () => {
        if (violinGain) {
            stopViolin();
            btnAudioViolin.classList.remove("playing");
            btnAudioViolin.textContent = "Jouer";
        } else {
            getAudioContext();
            startViolin();
            btnAudioViolin.classList.add("playing");
            btnAudioViolin.textContent = "Arrêter";
        }
    });

    sliderVolume.addEventListener("input", (e) => {
        const val = e.target.value;
        volumeValDisplay.textContent = `${val}%`;
        
        if (masterGainNode) {
            masterGainNode.gain.setValueAtTime(val / 100, audioCtx.currentTime);
        }
    });

    // --- Initialization ---
    updateTimerDisplay();
});
