// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyy8AM0mc9oLi8ixywP4qo2dpJp2TYG6o",
  authDomain: "cogni-flow-d41db.firebaseapp.com",
  projectId: "cogni-flow-d41db",
  storageBucket: "cogni-flow-d41db.firebasestorage.app",
  messagingSenderId: "812584499671",
  appId: "1:812584499671:web:14516059d67a937ec47392",
  measurementId: "G-5W2RWBEHLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Configuration & Constants
        const apiKey = "AIzaSyAaiJHfFeKRrF8Wy5rqUCwhN2l3-EEi-2Q";
        
        const API_ENDPOINTS = [
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`
        ];

        // Elements
        const tabs = [...document.querySelectorAll(".tab-btn")];
        const panels = ["notes", "mindmap", "quiz", "flashcard"].map(id => document.getElementById(id + "Content"));
        const themeBtn = document.getElementById("themeToggle");
        const settingsBtn = document.getElementById("settingsBtn");
        const modalBg = document.getElementById("settingsModal");
        const closeSet = document.getElementById("closeSet");
        const errorModal = document.getElementById("errorModal");
        const errorContent = document.getElementById("errorContent");
        const closeError = document.getElementById("closeError");
        const generateBtn = document.getElementById("generateBtn");
        
        // Speech Controls
        const playBtn = document.getElementById("playBtn");
        const pauseBtn = document.getElementById("pauseBtn");
        const rewindBtn = document.getElementById("rewindBtn");
        const skipBtn = document.getElementById("skipBtn");
        const speedSlider = document.getElementById("speedSlider");
        const speedValue = document.getElementById("speedValue");

        let settings = { fontSize: 16, fontFamily: "Lexend, Arial, sans-serif", textAlign: "left", lineHeight: 1.5, letterSpacing: 0, bionic: false };

        // Fixed Text-to-Speech functionality
        let speechSynthesis = window.speechSynthesis;
        let currentUtterance = null;
        let speechText = "";
        let speechSentences = [];
        let currentSentenceIndex = 0;
        let isPaused = false;
        let isPlaying = false;

        function initializeSpeech() {
            const notesContent = document.getElementById('notesContent');
            speechText = notesContent.textContent || notesContent.innerText;
            
            if (!speechText.trim()) {
                showError("No content to read. Generate some notes first!");
                return false;
            }

            speechSentences = speechText.split(/[.!?]+/).filter(s => s.trim().length > 0);
            currentSentenceIndex = 0;
            return true;
        }

        function createUtterance(text) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.rate = parseFloat(speedSlider.value);
            utterance.pitch = 1;
            utterance.volume = 1;
            
            const voices = speechSynthesis.getVoices();
            const preferredVoices = voices.filter(voice => 
                voice.lang.startsWith('en') && 
                (voice.name.includes('Natural') || 
                 voice.name.includes('Premium') || 
                 voice.name.includes('Enhanced') ||
                 voice.name.includes('Google') ||
                 voice.name.includes('Microsoft'))
            );
            
            if (preferredVoices.length > 0) {
                utterance.voice = preferredVoices[0];
            } else if (voices.length > 0) {
                const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
                if (englishVoices.length > 0) {
                    utterance.voice = englishVoices[0];
                }
            }
            
            return utterance;
        }

        function speakCurrentSentence() {
            if (currentSentenceIndex >= speechSentences.length) {
                resetSpeechControls();
                return;
            }

            const sentence = speechSentences[currentSentenceIndex].trim();
            if (!sentence) {
                currentSentenceIndex++;
                speakCurrentSentence();
                return;
            }

            currentUtterance = createUtterance(sentence);
            
            currentUtterance.onstart = function() {
                isPlaying = true;
                playBtn.textContent = "⏹️ Stop";
                pauseBtn.disabled = false;
                rewindBtn.disabled = false;
                skipBtn.disabled = false;
            };

            currentUtterance.onend = function() {
                currentSentenceIndex++;
                if (currentSentenceIndex < speechSentences.length && isPlaying && !isPaused) {
                    setTimeout(() => speakCurrentSentence(), 200);
                } else {
                    resetSpeechControls();
                }
            };

            currentUtterance.onerror = function() {
                console.error("Speech synthesis error");
                resetSpeechControls();
            };

            speechSynthesis.speak(currentUtterance);
        }

        function resetSpeechControls() {
            playBtn.textContent = "🔊 Read Aloud";
            pauseBtn.disabled = true;
            rewindBtn.disabled = true;
            skipBtn.disabled = true;
            isPaused = false;
            isPlaying = false;
            currentUtterance = null;
        }

        // Fixed speech control event handlers
        playBtn.onclick = function() {
            if (isPlaying && !isPaused) {
                // Stop current speech
                speechSynthesis.cancel();
                resetSpeechControls();
                return;
            }

            if (isPaused) {
                // Resume
                speechSynthesis.resume();
                isPaused = false;
                isPlaying = true;
                playBtn.textContent = "⏹️ Stop";
                pauseBtn.disabled = false;
                return;
            }

            // Start new speech
            if (!initializeSpeech()) return;
            
            isPlaying = true;
            speakCurrentSentence();
        };

        pauseBtn.onclick = function() {
            if (speechSynthesis.speaking && !isPaused && isPlaying) {
                speechSynthesis.pause();
                isPaused = true;
                isPlaying = false;
                playBtn.textContent = "▶️ Resume";
                pauseBtn.disabled = true;
            }
        };

        rewindBtn.onclick = function() {
            if (isPlaying) {
                speechSynthesis.cancel();
                currentSentenceIndex = Math.max(0, currentSentenceIndex - 2);
                setTimeout(() => speakCurrentSentence(), 100);
            }
        };

        skipBtn.onclick = function() {
            if (isPlaying) {
                speechSynthesis.cancel();
                currentSentenceIndex++;
                setTimeout(() => speakCurrentSentence(), 100);
            }
        };

        speedSlider.oninput = function() {
            speedValue.textContent = this.value + "x";
            // Only restart if currently playing
            if (isPlaying && currentUtterance) {
                speechSynthesis.cancel();
                setTimeout(() => speakCurrentSentence(), 100);
            }
        };

        speechSynthesis.onvoiceschanged = function() {
            const voices = speechSynthesis.getVoices();
            console.log("Available voices loaded:", voices.length);
        };

        function showError(message, error = null) {
            console.error("Error:", message, error);
            errorContent.textContent = message + (error ? '\n\n' + error.message : '');
            errorModal.classList.add('active');
            generateBtn.disabled = false;
            document.getElementById("genStatus").textContent = "Error occurred.";
        }

        closeError.onclick = () => errorModal.classList.remove('active');
        errorModal.onclick = (e) => { if (e.target === errorModal) errorModal.classList.remove('active'); };

        function saveSetting() { 
            localStorage.setItem("cogniSet", JSON.stringify(settings)); 
            applySettings(); 
        }

        function applySettings() {
            document.body.style.fontSize = settings.fontSize + "px";
            document.body.style.fontFamily = settings.fontFamily;
            panels.forEach(p => {
                if (!p) return;
                p.style.lineHeight = settings.lineHeight;
                p.style.letterSpacing = settings.letterSpacing + "px";
            });
            if (settings.bionic) {
                makeBionic();
            } else {
                [...document.querySelectorAll("#notesContent *, #quizContent .q, .card-face p")].forEach(el => {
                    if (el.dataset.original) {
                        el.innerHTML = el.dataset.original;
                        delete el.dataset.original;
                    }
                });
            }
        }

        function makeBionic() {
            [...document.querySelectorAll("#notesContent *, #quizContent .q, .card-face p")].forEach(el => {
                if (el.tagName && ['H1','H2','H3','H4','H5','H6'].includes(el.tagName)) return;
                if (!el.dataset.original) {
                    el.dataset.original = el.innerHTML;
                }
                el.innerHTML = el.innerText.replace(/\b(\w+)/g, m => {
                    const splitPoint = Math.ceil(m.length / 2);
                    return `<b>${m.slice(0, splitPoint)}</b>${m.slice(splitPoint)}`;
                });
            });
        }
        
        function openSet(e) { modalBg.classList.add('active'); }
        function closeSetF() { modalBg.classList.remove('active'); }

        // Theme Switching
        themeBtn.onclick = () => {
            const t = document.body.getAttribute("data-theme");
            document.body.setAttribute("data-theme", t === "scheme1" ? "scheme2" : "scheme1");
        }

        // Tabs
        tabs.forEach((b, i) => {
            b.onclick = () => {
                speechSynthesis.cancel();
                resetSpeechControls();
                
                tabs.forEach(b2 => b2.classList.remove("active"));
                b.classList.add("active");
                
                document.querySelectorAll(".tab-panel").forEach((p, j) => {
                    if (i === j) {
                        p.classList.add("active");
                    } else {
                        p.classList.remove("active");
                    }
                });
                
                if (settings.bionic) applySettings();
            }
        });

        // Modal Events
        settingsBtn.onclick = openSet;
        closeSet.onclick = closeSetF;
        modalBg.onclick = e => { if (e.target === modalBg) closeSetF(); };
        document.getElementById("fontSz").oninput = e => { settings.fontSize = +e.target.value; saveSetting(); };
        document.getElementById("fontFam").onchange = e => { settings.fontFamily = e.target.value; saveSetting(); };
        document.getElementById("txtAlign").onchange = e => { settings.textAlign = e.target.value; saveSetting(); };
        document.getElementById("lineHeight").oninput = e => { settings.lineHeight = +e.target.value; saveSetting(); };
        document.getElementById("letterSpacing").oninput = e => { settings.letterSpacing = +e.target.value; saveSetting(); };
        document.getElementById("bionic").onchange = e => { 
            settings.bionic = e.target.checked; 
            saveSetting(); 
        };

        // Initialization
        if (localStorage.cogniSet) {
            settings = JSON.parse(localStorage.cogniSet);
            document.getElementById("fontSz").value = settings.fontSize;
            document.getElementById("fontFam").value = settings.fontFamily;
            document.getElementById("txtAlign").value = settings.textAlign;
            document.getElementById("lineHeight").value = settings.lineHeight;
            document.getElementById("letterSpacing").value = settings.letterSpacing;
            document.getElementById("bionic").checked = settings.bionic;
        }
        applySettings();
        resetSpeechControls();

        function showContent(tab, html) {
            const element = document.getElementById(tab + "Content");
            element.innerHTML = html;
        }
        
        function setLoading(tab) {
            showContent(tab, `<div class="loading-spinner"></div><p style="text-align: center; margin-top: 20px; font-size: 1.1em; color: var(--accent);">Generating amazing ${tab}...</p>`);
        }

        function cleanHtmlResponse(response) {
            response = response.replace(/```html\s*/gi, '');
            response = response.replace(/```\s*$/gi, '');
            response = response.replace(/^['"`]+|['"`]+$/g, '');
            response = response.trim();
            
            if (response.startsWith('```')) {
                response = response.split('\n').slice(1).join('\n');
            }
            
            return response;
        }

        // Improved URL content fetching without pre-loaded content
        async function fetchUrlContent(url) {
            console.log("Fetching URL content for:", url);
            
            // Try direct fetch first (for CORS-enabled sites)
            try {
                console.log("Trying direct fetch...");
                const response = await fetch(url, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (compatible; Cogni-Flow/1.0)'
                    }
                });
                
                if (response.ok) {
                    const text = await response.text();
                    const content = extractTextFromHtml(text);
                    if (content && content.length > 100) {
                        console.log("Direct fetch successful");
                        return content;
                    }
                }
            } catch (error) {
                console.log("Direct fetch failed:", error.message);
            }
            
            // Try CORS proxies
            const corsProxies = [
                'https://api.allorigins.win/get?url=',
                'https://thingproxy.freeboard.io/fetch/'
            ];

            for (let proxy of corsProxies) {
                try {
                    console.log(`Trying proxy: ${proxy}`);
                    let fetchUrl;
                    
                    if (proxy.includes('allorigins')) {
                        fetchUrl = `${proxy}${encodeURIComponent(url)}`;
                    } else {
                        fetchUrl = proxy + url;
                    }
                    
                    const response = await fetch(fetchUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    let data;
                    if (proxy.includes('allorigins')) {
                        const jsonData = await response.json();
                        data = jsonData.contents;
                    } else {
                        data = await response.text();
                    }
                    
                    if (data) {
                        const content = extractTextFromHtml(data);
                        if (content && content.length > 50) {
                            return content;
                        }
                    }
                    
                    throw new Error('No readable content found');
                    
                } catch (error) {
                    console.log(`Proxy ${proxy} failed:`, error.message);
                    continue;
                }
            }
            
            // Final fallback - suggest manual copy-paste
            throw new Error('Could not fetch URL automatically. Please copy and paste the content into the text area instead.');
        }
        
        function extractTextFromHtml(htmlString) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            
            // Remove unwanted elements
            ['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'iframe', 'object', 'embed'].forEach(tag => {
                const elements = tempDiv.getElementsByTagName(tag);
                for (let i = elements.length - 1; i >= 0; i--) {
                    elements[i].remove();
                }
            });
            
            // Try to find main content areas
            let content = '';
            const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.article', '.entry-content'];
            
            for (let selector of mainSelectors) {
                const element = tempDiv.querySelector(selector);
                if (element && element.textContent.trim().length > content.length) {
                    content = element.textContent.trim();
                }
            }
            
            // Fallback to full body text
            if (!content || content.length < 100) {
                content = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            // Clean up the text
            content = content.replace(/\s+/g, ' ').trim();
            
            return content;
        }

        async function generateContentFromGemini(prompt) {
            console.log("Making Gemini API call...");
            
            const payload = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            };

            for (let endpointIndex = 0; endpointIndex < API_ENDPOINTS.length; endpointIndex++) {
                const endpoint = API_ENDPOINTS[endpointIndex];
                console.log(`Trying endpoint ${endpointIndex + 1}/${API_ENDPOINTS.length}`);
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        if (endpointIndex < API_ENDPOINTS.length - 1) continue;
                        throw new Error(`All endpoints failed. Last error: ${result.error?.message || 'Unknown error'}`);
                    }

                    const candidate = result.candidates?.[0];
                    if (candidate && candidate.content?.parts?.[0]?.text) {
                        console.log("Success!");
                        return cleanHtmlResponse(candidate.content.parts[0].text);
                    } else {
                        if (endpointIndex < API_ENDPOINTS.length - 1) continue;
                        throw new Error("Invalid response structure from all endpoints.");
                    }

                } catch (error) {
                    console.log(`Endpoint ${endpointIndex + 1} failed:`, error.message);
                    if (endpointIndex === API_ENDPOINTS.length - 1) throw error;
                }
            }
            return null;
        }

        async function generateSmartNotes(text) {
            setLoading("notes");
            try {
                const prompt = `Create study notes from this content. Return ONLY clean HTML without any markdown code blocks, backticks, emojis, or formatting symbols:

${text}

Structure:
- <h2>[Title]</h2>
- <h3>Section headings</h3>
- <ul><li>Key points</li></ul>
- <strong>Important terms</strong>
- No emojis or special characters

Return clean HTML only.`;

                const response = await generateContentFromGemini(prompt);
                showContent("notes", response);
                if (settings.bionic) makeBionic();

            } catch (e) {
                console.error("Smart Notes failed:", e);
                showError("Failed to generate Smart Notes: " + e.message, e);
            }
        }

        async function generateMindMap(text) {
            setLoading("mindmap");
            try {
                const prompt = `Create a mind map from this content. Return ONLY clean HTML without markdown blocks, emojis, or special symbols. Keep sub-points SHORT (max 8 words each):

${text}

Use this EXACT structure:
<h2>[MAIN TOPIC]</h2>
<ul>
  <li>[BRANCH 1 - Short Title]
    <ul>
      <li>[Short sub-point 1]</li>
      <li>[Short sub-point 2]</li>
      <li>[Short sub-point 3]</li>
    </ul>
  </li>
  <li>[BRANCH 2 - Short Title]
    <ul>
      <li>[Short sub-point 1]</li>
      <li>[Short sub-point 2]</li>
    </ul>
  </li>
</ul>

Keep ALL text short and concise. Return clean HTML only. No emojis or special characters.`;

                const response = await generateContentFromGemini(prompt);
                showContent("mindmap", response);

            } catch (e) {
                console.error("Mind Map failed:", e);
                showError("Failed to generate Mind Map: " + e.message, e);
            }
        }

        async function generateQuiz(text) {
            setLoading("quiz");
            try {
                const prompt = `Create a quiz from this content. Return ONLY clean HTML without markdown blocks, emojis, or special symbols:

${text}

Structure:
<h2>Quiz Time!</h2>
<div class="q">Question 1 text</div>
<ul>
  <li>A) Option A</li>
  <li>B) Option B</li>
  <li>C) Option C</li>
  <li>D) Option D</li>
</ul>
<div class="answer" style="display:none">Correct: A) Option A</div>

Return clean HTML only. No emojis or special characters.`;

                const response = await generateContentFromGemini(prompt);
                showContent("quiz", response);
                if (settings.bionic) makeBionic();

                setTimeout(() => {
                    const quizContent = document.getElementById('quizContent');
                    if (quizContent.querySelector('.answer')) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.textContent = 'Show Answers';
                        toggleBtn.style.cssText = `
                            margin-top:25px; padding:12px 25px; 
                            background:var(--accent); color:white; 
                            border:none; border-radius:25px; cursor:pointer;
                            font-weight:600; transition: all 0.3s ease;
                            display: block; margin: 25px auto;
                        `;
                        toggleBtn.onmouseover = () => toggleBtn.style.transform = 'translateY(-2px)';
                        toggleBtn.onmouseout = () => toggleBtn.style.transform = 'translateY(0)';
                        toggleBtn.onclick = function() {
                            const answers = document.querySelectorAll('#quizContent .answer');
                            const isHidden = answers[0]?.style.display === 'none';
                            
                            answers.forEach(a => a.style.display = isHidden ? 'block' : 'none');
                            this.textContent = isHidden ? 'Hide Answers' : 'Show Answers';
                        };
                        quizContent.appendChild(toggleBtn);
                    }
                }, 500);

            } catch (e) {
                console.error("Quiz failed:", e);
                showError("Failed to generate Quiz: " + e.message, e);
            }
        }
        
        async function generateFlashcards(text) {
            setLoading("flashcard");
            try {
                const prompt = `Create 8 flashcards from this content. Return ONLY clean HTML without markdown blocks, emojis, or special symbols:

${text}

Use this exact structure:
<div class="flashcard-deck">
<div class="flashcard" onclick="this.classList.toggle('flipped')">
    <div class="card-inner">
        <div class="card-face card-front">
            <p>[QUESTION]</p>
        </div>
        <div class="card-face card-back">
            <p>[ANSWER]</p>
        </div>
    </div>
</div>
</div>

Return clean HTML only. No emojis or special characters.`;

                const response = await generateContentFromGemini(prompt);
                showContent("flashcard", response);
                if (settings.bionic) makeBionic();
                
            } catch (e) {
                console.error("Flashcards failed:", e);
                showError("Failed to generate Flashcards: " + e.message, e);
            }
        }

        // Main Generation Handler
        document.getElementById("generateBtn").onclick = async () => {
            console.log("Starting generation...");
            generateBtn.disabled = true;
            generateBtn.innerHTML = "Generating...";
            
            document.getElementById("genStatus").innerHTML = "Preparing your content...";
            
            let text = document.getElementById("textInput").value.trim();
            const file = document.getElementById("fileInput").files[0];
            const url = document.getElementById("urlInput").value.trim();

            // Handle URL input with better error messaging
            if (url && !text && !file) {
                try {
                    document.getElementById("genStatus").innerHTML = "Fetching content from URL...";
                    text = await fetchUrlContent(url);
                    if (!text.trim()) {
                        throw new Error("No readable content found at the URL");
                    }
                    document.getElementById("genStatus").innerHTML = "URL content loaded successfully!";
                } catch (e) {
                    // Provide more helpful error message
                    let errorMsg = e.message;
                    if (errorMsg.includes("Could not fetch URL automatically")) {
                        errorMsg = "Unable to fetch URL content due to CORS restrictions. Please copy and paste the content directly into the text area above.";
                    }
                    showError(errorMsg, e);
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = "Generate Learning Materials";
                    return;
                }
            }

            // Handle file input
            if (!text && file) {
                try {
                    text = await file.text();
                    document.getElementById("genStatus").innerHTML = "File loaded successfully!";
                } catch (e) {
                    showError("Could not read file content.", e);
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = "Generate Learning Materials";
                    return;
                }
            }

            if (!text) {
                showError("Please provide some content to work with!");
                generateBtn.disabled = false;
                generateBtn.innerHTML = "Generate Learning Materials";
                return;
            }

            document.getElementById("genStatus").innerHTML = "AI is working its magic...";

            try {
                document.getElementById("genStatus").innerHTML = "Creating smart notes...";
                await generateSmartNotes(text);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                document.getElementById("genStatus").innerHTML = "Building mind map...";
                await generateMindMap(text);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                document.getElementById("genStatus").innerHTML = "Crafting quiz questions...";
                await generateQuiz(text);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                document.getElementById("genStatus").innerHTML = "Designing flashcards...";
                await generateFlashcards(text);

                document.getElementById("genStatus").innerHTML = `
                    <div class="success-message">
                        All learning materials generated successfully! 
                        <br>Explore the tabs above to view your content.
                    </div>
                `;
                
                console.log("Generation completed!");
                
            } catch (error) {
                console.error("Generation failed:", error);
                showError("Generation failed: " + error.message, error);
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = "Generate Learning Materials";
            }
        };

        console.log("Cogni-Flow loaded!");