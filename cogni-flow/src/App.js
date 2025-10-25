import React, { useEffect, useRef, useState } from "react";
import "./App.css";

// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDyy8AM0mc9oLi8ixywP4qo2dpJp2TYG6o",
  authDomain: "cogni-flow-d41db.firebaseapp.com",
  projectId: "cogni-flow-d41db",
  storageBucket: "cogni-flow-d41db.firebasestorage.app",
  messagingSenderId: "812584499671",
  appId: "1:812584499671:web:14516059d67a937ec47392",
  measurementId: "G-5W2RWBEHLE",
};

try {
  const app = initializeApp(firebaseConfig);
  getAnalytics(app);
} catch (e) {
  console.log("Firebase init error:", e);
}

// Gemini API configuration
const apiKey = "AIzaSyAaiJHfFeKRrF8Wy5rqUCwhN2l3-EEi-2Q";
const API_ENDPOINTS = [
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
];

export default function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [theme, setTheme] = useState("scheme1");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [mindmapContent, setMindmapContent] = useState("");
  const [quizContent, setQuizContent] = useState("");
  const [flashcardContent, setFlashcardContent] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 16,
    fontFamily: "Lexend, Arial, sans-serif",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0,
    bionic: false,
  });
  const [colors, setColors] = useState({
    headerBg: "#ffc107",
    background: "#7cccae",
    buttonBg: "#5bb5a2",
    tabBg: "#ffc107",
    textColor: "#000000",
  });
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const speechSentencesRef = useRef([]);
  const currentUtteranceRef = useRef(null);

  // Load saved settings and colors
  useEffect(() => {
    const saved = localStorage.getItem("cogniSet");
    if (saved) setSettings(JSON.parse(saved));
    
    const savedColors = localStorage.getItem("cogniColors");
    if (savedColors) setColors(JSON.parse(savedColors));
  }, []);

  // Apply settings
  useEffect(() => {
    document.body.style.fontSize = `${settings.fontSize}px`;
    document.body.style.fontFamily = settings.fontFamily;
    document.body.style.lineHeight = settings.lineHeight;
    document.body.style.letterSpacing = `${settings.letterSpacing}px`;
    localStorage.setItem("cogniSet", JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Apply colors dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--custom-header-bg', colors.headerBg);
    root.style.setProperty('--custom-background', colors.background);
    root.style.setProperty('--custom-button-bg', colors.buttonBg);
    root.style.setProperty('--custom-tab-bg', colors.tabBg);
    root.style.setProperty('--custom-text-color', colors.textColor);
    localStorage.setItem("cogniColors", JSON.stringify(colors));
  }, [colors]);

  const handleColorChange = (key, value) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    const defaultColors = {
      headerBg: "#ffc107",
      background: "#7cccae",
      buttonBg: "#5bb5a2",
      tabBg: "#ffc107",
      textColor: "#000000",
    };
    setColors(defaultColors);
  };

  const showErrorDialog = (msg, err) => {
    console.error(msg, err || "");
    setErrorMessage(msg + (err?.message ? `: ${err.message}` : ""));
    setShowError(true);
  };

  const cleanHtmlResponse = (response) => {
  if (!response) return "";
  let cleanedResponse = response;

  // Remove HTML code block markers
  cleanedResponse = cleanedResponse.replace(/```html/g, "");
  cleanedResponse = cleanedResponse.replace(/```/g, "");

  // Remove quotes at start and end
  while (
    cleanedResponse.startsWith('"') ||
    cleanedResponse.startsWith("'") ||
    cleanedResponse.startsWith("`")
  ) {
    cleanedResponse = cleanedResponse.substring(1);
  }
  while (
    cleanedResponse.endsWith('"') ||
    cleanedResponse.endsWith("'") ||
    cleanedResponse.endsWith("`")
  ) {
    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 1);
  }

  // Trim whitespace
  cleanedResponse = cleanedResponse.trim();

  // If still starts with backticks, remove first line
  if (cleanedResponse.indexOf("```") !== -1) {
    const lines = cleanedResponse.split("\n");
    lines.shift(); // Remove first line
    cleanedResponse = lines.join("\n");
  }

  return cleanedResponse;
};

const extractTextFromHtml = (htmlString) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;

  const unwantedTags = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    "noscript",
    "iframe",
    "object",
    "embed"
  ];
  unwantedTags.forEach((tag) => {
    const elements = tempDiv.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].remove();
    }
  });

  let content = "";
  const mainSelectors = [
    "main",
    "article",
    "[role='main']",
    ".content",
    "#content",
    ".post",
    ".article",
    ".entry-content"
  ];

  for (const selector of mainSelectors) {
    const element = tempDiv.querySelector(selector);
    if (element && element.textContent.trim().length > content.length) {
      content = element.textContent.trim();
    }
  }

  if (!content || content.length < 100) {
    content = tempDiv.textContent || tempDiv.innerText || "";
  }

  return content.replace(/\s+/g, " ").trim();
};


  const fetchUrlContent = async (url) => {
    try {
      const directResponse = await fetch(url, {
        mode: "cors",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; Cogni-Flow/1.0)",
        },
      });
      if (directResponse.ok) {
        const textContent = await directResponse.text();
        const extractedContent = extractTextFromHtml(textContent);
        if (extractedContent && extractedContent.length > 100) return extractedContent;
      }
    } catch (error) {
      console.log("Direct fetch failed:", error);
    }
    const proxies = ["https://api.allorigins.win/get?url=", "https://thingproxy.freeboard.io/fetch/"];
    for (const proxy of proxies) {
      try {
        const proxyUrl = proxy.includes("allorigins") ? proxy + encodeURIComponent(url) : proxy + url;
        const response = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let responseData;
        if (proxy.includes("allorigins")) {
          const jsonResponse = await response.json();
          responseData = jsonResponse.contents;
        } else {
          responseData = await response.text();
        }
        if (responseData) {
          const extractedContent = extractTextFromHtml(responseData);
          if (extractedContent && extractedContent.length > 50) return extractedContent;
        }
      } catch (error) {
        console.log(`Proxy ${proxy} failed:`, error);
      }
    }
    throw new Error("Failed to fetch content from URL");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileInput(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setTextInput(content);
    };
    reader.onerror = () => {
      showErrorDialog("Failed to read file");
    };
    reader.readAsText(file);
  };

  const callGeminiAPI = async (endpoint, prompt) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 8192 },
      }),
    });
    if (!response.ok) throw new Error(`API failed: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  const handleGenerate = async () => {
    if (!textInput && !urlInput) {
      showErrorDialog("Please provide text, a file, or a URL");
      return;
    }
    setIsGenerating(true);
    setGenStatus("Processing input...");
    let sourceText = textInput;
    try {
      if (urlInput && !sourceText) {
        setGenStatus("Fetching content from URL...");
        sourceText = await fetchUrlContent(urlInput);
        if (!sourceText) {
          showErrorDialog("Could not extract content from the URL");
          return;
        }
        setTextInput(sourceText);
      }
      if (!sourceText) {
        showErrorDialog("No valid content to process");
        return;
      }
      const truncatedText = sourceText.substring(0, 30000);
      const prompts = {
        notes: `Convert this content into comprehensive, well-structured study notes in HTML format. Use semantic HTML5 elements, headings (h2, h3, h4), lists (ul/ol), and paragraphs. Include <strong> for emphasis, <mark> for highlights, and <blockquote> for important concepts. Make it educational and easy to scan: ${truncatedText}`,
        mindmap: `Create an interactive, colorful mind map HTML visualization of this content. Use nested divs with CSS for styling. Center the main topic, branch out key concepts, and include sub-branches for details. Use colors, borders, and padding to create visual hierarchy: ${truncatedText}`,
        quiz: `Generate an interactive quiz in HTML format with 10 multiple-choice questions based on this content. Include radio buttons, a submit button, and JavaScript for scoring. Show correct answers on submission with explanations: ${truncatedText}`,
        flashcard: `Create interactive flashcards in HTML format. Generate 10 cards with question on front and answer on back. Use CSS transforms for flip animation. Include navigation buttons and card counter: ${truncatedText}`
      };

      for (const [type, prompt] of Object.entries(prompts)) {
        setGenStatus(`Generating ${type}...`);
        let success = false;
        for (const endpoint of API_ENDPOINTS) {
          try {
            const response = await callGeminiAPI(endpoint, prompt);
            const cleanedResponse = cleanHtmlResponse(response);
            switch (type) {
              case "notes": setNotesContent(cleanedResponse); break;
              case "mindmap": setMindmapContent(cleanedResponse); break;
              case "quiz": setQuizContent(cleanedResponse); break;
              case "flashcard": setFlashcardContent(cleanedResponse); break;
            }
            success = true;
            break;
          } catch (error) {
            console.log(`Endpoint failed: ${endpoint}`, error);
          }
        }
        if (!success) throw new Error(`Failed to generate ${type} with all endpoints`);
      }
      setGenStatus("All materials generated successfully!");
      setActiveTab("notes");
      setTimeout(() => setGenStatus(""), 3000);
    } catch (error) {
      showErrorDialog("Failed to generate materials", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetSpeechControls = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
    speechSentencesRef.current = [];
    currentUtteranceRef.current = null;
  };

  const extractTextFromContent = (htmlContent) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.trim();
  };

  const splitIntoSentences = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  };

  const initializeSpeech = () => {
    if (!notesContent) {
      showErrorDialog("No notes to read. Please generate content first.");
      return false;
    }
    const textToSpeak = extractTextFromContent(notesContent);
    if (!textToSpeak) {
      showErrorDialog("No readable text found in notes.");
      return false;
    }
    const sentences = splitIntoSentences(textToSpeak);
    if (sentences.length === 0) {
      showErrorDialog("Could not parse text into sentences.");
      return false;
    }
    speechSentencesRef.current = sentences;
    return true;
  };

  const speakCurrentSentence = () => {
    const sentences = speechSentencesRef.current;
    const index = currentSentenceIndex;
    if (index >= sentences.length) {
      resetSpeechControls();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentences[index]);
    utterance.rate = speechSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => {
      setCurrentSentenceIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        if (newIndex < sentences.length) {
          setTimeout(speakCurrentSentence, 100);
        } else {
          resetSpeechControls();
        }
        return newIndex;
      });
    };
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      resetSpeechControls();
    };
    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isPlaying && !isPaused) {
      resetSpeechControls();
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    if (!initializeSpeech()) return;
    setIsPlaying(true);
    speakCurrentSentence();
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleRewind = () => {
    if (isPlaying || isPaused) {
      window.speechSynthesis.cancel();
      setCurrentSentenceIndex((prevIndex) => Math.max(0, prevIndex - 2));
      setTimeout(speakCurrentSentence, 120);
    }
  };

  const handleSkip = () => {
    if (isPlaying || isPaused) {
      window.speechSynthesis.cancel();
      setCurrentSentenceIndex((prevIndex) => prevIndex + 1);
      setTimeout(speakCurrentSentence, 120);
    }
  };

  const onChangeSpeed = (value) => {
    const speedValue = parseFloat(value);
    setSpeechSpeed(speedValue);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setTimeout(speakCurrentSentence, 120);
    }
  };

  const handleTabChange = (tab) => {
    window.speechSynthesis.cancel();
    resetSpeechControls();
    setActiveTab(tab);
  };

  return (
    <div className="App" data-theme={theme}>
      {/* Main Image Header */}
      <div className="main-image-header">
        <img 
          src="/Main-Image.png" 
          alt="Cogni-Flow Main Visual" 
          className="main-header-image" 
        />
      </div>

      <header className="header">
        <div className="logo-space">
          <img 
            src="/Header-logo.png" 
            alt="Logo" 
            style={{
              width: '64px', 
              height: '64px',
            }} 
          />
        </div>
        <div className="right">
          <button onClick={() => setShowColorPicker(true)} title="Color Picker">🎨</button>
          <button onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        </div>
      </header>

      <main>
        <nav>
          <button className={activeTab === "input" ? "tab-btn active" : "tab-btn"} onClick={() => handleTabChange("input")}>📝 Input</button>
          <button className={activeTab === "notes" ? "tab-btn active" : "tab-btn"} onClick={() => handleTabChange("notes")}>📚 Smart Notes</button>
          <button className={activeTab === "mindmap" ? "tab-btn active" : "tab-btn"} onClick={() => handleTabChange("mindmap")}>🧠 Mind Map</button>
          <button className={activeTab === "quiz" ? "tab-btn active" : "tab-btn"} onClick={() => handleTabChange("quiz")}>❓ Quiz</button>
          <button className={activeTab === "flashcard" ? "tab-btn active" : "tab-btn"} onClick={() => handleTabChange("flashcard")}>🎴 Flashcards</button>
        </nav>

        {activeTab === "input" && (
          <section className="tab-panel active">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text here and watch the magic happen! Upload a file or enter a link to get started..."
            />
            <input type="file" onChange={handleFileChange} accept=".txt,.md" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a public article link here"
            />
            <div className="center-btn">
              <button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Learning Materials"}
              </button>
            </div>
            <div id="genStatus">{genStatus}</div>
          </section>
        )}

        {activeTab === "notes" && (
          <section className="tab-panel active">
            <div className="speech-controls">
              <button onClick={handlePlay} className="speech-btn primary">
                {isPlaying && !isPaused ? "Stop" : isPaused ? "Resume" : "Read Aloud"}
              </button>
              <button onClick={handlePause} disabled={!isPlaying || isPaused} className="speech-btn">Pause</button>
              <button onClick={handleRewind} disabled={!isPlaying && !isPaused} className="speech-btn">Rewind</button>
              <button onClick={handleSkip} disabled={!isPlaying && !isPaused} className="speech-btn">Skip</button>
              <label htmlFor="speedSlider" className="ml-2">Speed</label>
              <input
                id="speedSlider"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechSpeed}
                onChange={(e) => onChangeSpeed(e.target.value)}
              />
              <span>{speechSpeed.toFixed(1)}x</span>
            </div>
            <div className="notesContent" style={{ textAlign: settings.textAlign }} dangerouslySetInnerHTML={{ __html: notesContent }} />
          </section>
        )}

        {activeTab === "mindmap" && (
          <section className="tab-panel active">
            <div className="mindmapContent" dangerouslySetInnerHTML={{ __html: mindmapContent }} />
          </section>
        )}

        {activeTab === "quiz" && (
          <section className="tab-panel active">
            <div className="quizContent" dangerouslySetInnerHTML={{ __html: quizContent }} />
          </section>
        )}

        {activeTab === "flashcard" && (
          <section className="tab-panel active">
            <div
              className="flashcard-host"
              onClick={(e) => {
                const card = e.target.closest(".flashcard");
                if (card) card.classList.toggle("flipped");
              }}
              dangerouslySetInnerHTML={{ __html: flashcardContent }}
            />
          </section>
        )}
      </main>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="modal-bg" onClick={() => setShowColorPicker(false)}>
          <div className="modal color-picker-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎨 Customize Colors</h2>
            
            <div className="color-picker-grid">
              <div className="color-picker-item">
                <label>Header Background</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={colors.headerBg}
                    onChange={(e) => handleColorChange('headerBg', e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors.headerBg}
                    onChange={(e) => handleColorChange('headerBg', e.target.value)}
                    placeholder="#ffc107"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label>Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    placeholder="#7cccae"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label>Button Background</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={colors.buttonBg}
                    onChange={(e) => handleColorChange('buttonBg', e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors.buttonBg}
                    onChange={(e) => handleColorChange('buttonBg', e.target.value)}
                    placeholder="#5bb5a2"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label>Tab Background</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={colors.tabBg}
                    onChange={(e) => handleColorChange('tabBg', e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors.tabBg}
                    onChange={(e) => handleColorChange('tabBg', e.target.value)}
                    placeholder="#ffc107"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label>Text Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={colors.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="color-picker-preview">
              <h4>Preview:</h4>
              <div className="preview-items">
                <div className="preview-header" style={{ background: colors.headerBg }}>Header</div>
                <div className="preview-bg" style={{ background: colors.background }}>Background</div>
                <button className="preview-button" style={{ background: colors.buttonBg }}>Button</button>
                <div className="preview-tab" style={{ background: colors.tabBg }}>Tab</div>
                <div className="preview-text" style={{ color: colors.textColor, background: '#ffffff' }}>Text Sample</div>
              </div>
            </div>

            <div className="actions">
              <button onClick={resetColors} style={{ marginRight: '10px' }}>Reset to Default</button>
              <button onClick={() => setShowColorPicker(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-bg" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="form-row">
              <label>Font Size</label>
              <input type="range" min="12" max="24" value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })} />
            </div>
            <div className="form-row">
              <label>Font Family</label>
              <select value={settings.fontFamily} onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}>
                <option>Lexend, Arial, sans-serif</option>
                <option>Inter, Arial, sans-serif</option>
                <option>OpenDyslexic, Arial, sans-serif</option>
              </select>
            </div>
            <div className="form-row">
              <label>Text Align</label>
              <select value={settings.textAlign} onChange={(e) => setSettings({ ...settings, textAlign: e.target.value })}>
                <option value="left">Left</option>
                <option value="justify">Justify</option>
                <option value="center">Center</option>
              </select>
            </div>
            <div className="form-row">
              <label>Line Height</label>
              <input type="range" min="1.2" max="2.5" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} />
            </div>
            <div className="form-row">
              <label>Letter Spacing</label>
              <input type="range" min="0" max="3" step="0.1" value={settings.letterSpacing} onChange={(e) => setSettings({ ...settings, letterSpacing: parseFloat(e.target.value) })} />
            </div>
            <div className="form-row">
              <label>
                <input type="checkbox" checked={settings.bionic} onChange={(e) => setSettings({ ...settings, bionic: e.target.checked})} />
                Bionic Reading
              </label>
            </div>
            <div className="actions">
              <button onClick={() => setShowSettings(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showError && (
        <div className="modal-bg" onClick={() => setShowError(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--color-red-500)" }}>Error</h2>
            <p className="mb-4">{errorMessage}</p>
            <button onClick={() => setShowError(false)}>Got It!</button>
          </div>
        </div>
      )}
    </div>
  );
}