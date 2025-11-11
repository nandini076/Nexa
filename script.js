//  Nexa — Smart Frontend AI Chatbot with Voice & Weather

const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendBtn = document.querySelector(".send-btn");
const chatbotToggler = document.querySelector(".chatbot-toggler");
const chatbot = document.querySelector(".chatbot");
const typingIndicator = document.querySelector(".typing-indicator");
const micBtn = document.querySelector(".mic-btn");

let voiceEnabled = false; // Only speak when true

// Speech Recognition setup
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    handleOutgoingMessage();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
  };
}

// Toggle chatbot visibility
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});

// Mic button click: toggle voice input
micBtn.addEventListener("click", () => {
  // Toggle listening mode
  micBtn.classList.toggle("listening");
  const isListening = micBtn.classList.contains("listening");

  if (isListening && recognition) {
    recognition.start();
    console.log("🎤 Listening...");
  } else if (recognition) {
    recognition.stop();
    console.log("🛑 Stopped listening");
  }
});

// Restart recognition automatically if mic is still active
if (recognition) {
  recognition.onend = () => {
    if (micBtn.classList.contains("listening")) {
      recognition.start();
    }
  };
}


// Create chat message element
function createChatLi(message, className) {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);

  const chatContent = document.createElement("div");
  chatContent.classList.add("chat-content");

  if (className === "incoming") {
    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    icon.textContent = "smart_toy";
    chatContent.appendChild(icon);
  }

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatContent.appendChild(messageDiv);
  chatLi.appendChild(chatContent);

  const time = document.createElement("time");
  time.classList.add("chat-time");
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  chatLi.appendChild(time);

  return chatLi;
}

// Text-to-Speech
function speakMessage(message) {
  if (!voiceEnabled) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

// Handle user message
function handleOutgoingMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatInput.value = "";
  chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });
    generateSmartResponse(userMessage, incomingChatLi);
  }, 600);
}

// Fetch weather for a city or current location
async function getWeather(city = "") {
  const apiKey = "00d33d88f82323c81f95b0d583126e67"; // <-- replace with your API key
  let url = "";

  if (!city) {
    // Use current location
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    const { latitude, longitude } = position.coords;
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather not found");
    const data = await response.json();
    return `Weather in ${data.name}: ${data.weather[0].description}, ${data.main.temp}°C 🌡️`;
  } catch {
    return "Sorry, I couldn't fetch the weather.";
  }
}

// Smart AI-like responses
async function generateSmartResponse(userMessage, chatLi) {
  const messageElement = chatLi.querySelector(".message p");
  typingIndicator.hidden = false;

  setTimeout(async () => {
    typingIndicator.hidden = true;
    const userMsg = userMessage.toLowerCase();
    let reply = "";

    // Common responses
    if (userMsg.includes("hello") || userMsg.includes("hi") || userMsg.includes("hey")) {
      reply = "Hey there! 👋 I'm Nexa, your virtual assistant. How are you today?";
    } 
    else if (userMsg.includes("how are you")) {
      reply = "I’m just a bunch of code, but chatting with you makes me happy 😊";
    } 
    else if (userMsg.includes("your name")) {
      reply = "My name’s Nexa — your friendly chatbot assistant 💬";
    } 
    else if (userMsg.includes("who made you")) {
      reply = "I was built by a developer using JavaScript!";
    } 

    /*// 🔹 Nexa explaining her features
    else if (
      userMsg.includes("what can you do") ||
      userMsg.includes("your features") ||
      userMsg.includes("abilities") ||
      userMsg.includes("what do you do")
    ) {
      reply = `I can do quite a few things! 💫  
    - 🗣️ Chat with you naturally  
    - 🌦️ Tell you the weather (any city or your location)  
    - 🧮 Solve simple math problems  
    - 🎮 Play small games like "Guess the Number" or "Rock Paper Scissors"  
    - ⏰ Tell you the time and date  
    - 💬 Give motivation, jokes, and general help  

    I’m always learning — so the more you talk to me, the smarter I get! 🤖💖`;
    }*/

    else if (userMsg.includes("help")) {
      reply = "Sure! You can ask me about general topics, study help, coding, or chat casually 💡";
    } 
    else if (userMsg.includes("time")) {
      reply = `It’s currently ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
    } 
    else if (userMsg.includes("date") || userMsg.includes("day")) {
      reply = `Today is ${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}.`;
    } 
   else if (userMsg.includes("weather")) {
      let city = "";

      // Detect "weather in city"
      const matchIn = userMessage.match(/weather in\s([a-zA-Z\s]+)/i);
      if (matchIn) {
        city = matchIn[1].trim();
      } else {
        // Detect "city weather" pattern
        const matchReverse = userMessage.match(/([a-zA-Z\s]+)\sweather/i);
        if (matchReverse) {
          city = matchReverse[1].trim();
        }
      }

      reply = await getWeather(city);
    }
    else if (userMsg.includes("bye") || userMsg.includes("goodnight")) {
      reply = "Goodbye! 💫 Take care and talk to you soon!";
    } 
    else if (userMsg.includes("thank you") || userMsg.includes("thanks")) {
      reply = "You’re very welcome! 💖";
    } 
    else if (userMsg.includes("joke")) {
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "Why did the computer show up late? It had a hard drive! 💻",
        "I told my AI friend a joke, but it didn’t get it… literally 🤖"
      ];
      reply = jokes[Math.floor(Math.random() * jokes.length)];
    } 
     
    else if (userMsg.includes("study") || userMsg.includes("motivate")) {
      reply = "You’ve got this! 📚 Every small step counts.";
    } 
    else if (userMsg.includes("code") || userMsg.includes("program")) {
      reply = "Coding is like magic — you type spells and computers obey 🪄!";
    } 
    
        // --- Mathematical Calculations & Conversions ---
    else if (
      userMsg.match(/(\d+)\s*[\+\-\*x\/]\s*(\d+)/) ||
      userMsg.includes("plus") ||
      userMsg.includes("minus") ||
      userMsg.includes("times") ||
      userMsg.includes("divided") ||
      userMsg.includes("multiply") ||
      userMsg.includes("add") ||
      userMsg.includes("subtract") ||
      userMsg.includes("calculate") ||
      userMsg.includes("square root") ||
      userMsg.includes("percent") ||
      userMsg.includes("%") ||
      userMsg.includes("^") ||
      userMsg.includes("to celsius") ||
      userMsg.includes("to fahrenheit")
    ) {
      try {
        // Handle temperature conversions
        if (userMsg.includes("to celsius")) {
          const match = userMsg.match(/(\d+(\.\d+)?)/);
          if (match) {
            const f = parseFloat(match[0]);
            const c = ((f - 32) * 5) / 9;
            reply = `${f}°F is approximately ${c.toFixed(2)}°C 🌡️`;
          } else reply = "Please provide a valid temperature to convert.";
        }

        else if (userMsg.includes("to fahrenheit")) {
          const match = userMsg.match(/(\d+(\.\d+)?)/);
          if (match) {
            const c = parseFloat(match[0]);
            const f = (c * 9) / 5 + 32;
            reply = `${c}°C is approximately ${f.toFixed(2)}°F 🌡️`;
          } else reply = "Please provide a valid temperature to convert.";
        }

        // Handle square roots
        else if (userMsg.includes("square root")) {
          const num = parseFloat(userMsg.match(/\d+/)?.[0]);
          if (!isNaN(num)) reply = `The square root of ${num} is ${Math.sqrt(num).toFixed(2)}.`;
          else reply = "Please provide a valid number for square root.";
        }

        // Handle percentages
        else if (userMsg.includes("percent") || userMsg.includes("%")) {
          const num = parseFloat(userMsg.match(/\d+(\.\d+)?/)?.[0]);
          if (!isNaN(num)) reply = `${num}% of 100 is ${num}.`;
          else reply = "Please provide a valid percentage.";
        }

        // Handle powers like 2^5 or 2 raised to 5
        else if (userMsg.includes("^") || userMsg.includes("raised to")) {
          const match = userMsg.match(/(\d+)\s*(?:\^|raised to)\s*(\d+)/);
          if (match) {
            const base = parseFloat(match[1]);
            const exp = parseFloat(match[2]);
            reply = `${base} raised to the power ${exp} is ${Math.pow(base, exp)}.`;
          } else reply = "Please provide a valid power expression like 2^5.";
        }

        // Handle regular arithmetic
        else {
          let expression = userMsg
            .replace(/what is|calculate|equals|result|answer/gi, "")
            .replace(/plus/gi, "+")
            .replace(/minus/gi, "-")
            .replace(/times|multiply|into/gi, "*")
            .replace(/divided by|divide/gi, "/")
            .replace(/\^/g, "**") // JS power operator
            .replace(/x/gi, "*")
            .replace(/–/gi, "-")
            .trim();

          const result = Function(`"use strict"; return (${expression})`)();
          reply = isNaN(result) ? "I couldn’t calculate that properly 😅" : `The result is ${result}.`;
        }
      } catch {
        reply = "Oops! That expression seems invalid 😅";
      }
    }

      // --- 🎮 Mini Games ---
/*
      // Guess the Number Game
      else if (userMsg.includes("guess number")) {
        if (!window.secretNumber) {
          window.secretNumber = Math.floor(Math.random() * 10) + 1;
          reply = "I've picked a number between 1 and 10. Can you guess it?";
        } else {
          const guess = parseInt(userMsg.match(/\d+/)?.[0]);
          if (!isNaN(guess)) {
            if (guess === window.secretNumber) {
              reply = `🎉 You got it! My number was ${window.secretNumber}. Type 'play again' to start over!`;
              window.secretNumber = null;
            } else if (guess < window.secretNumber) {
              reply = "Too low! Try a higher number 🔼";
            } else {
              reply = "Too high! Try a smaller number 🔽";
            }
          } else {
            reply = "Please enter a number between 1 and 10.";
          }
        }
      }

      // Restart Guess Game
      else if (userMsg.includes("play again")) {
        window.secretNumber = Math.floor(Math.random() * 10) + 1;
        reply = "Alright! I’ve picked a new number between 1 and 10. Guess again!";
      }

      // Rock Paper Scissors Game
      else if (userMsg.includes("rock") || userMsg.includes("paper") || userMsg.includes("scissors")) {
        const userChoice = userMsg.match(/rock|paper|scissors/)[0];
        const choices = ["rock", "paper", "scissors"];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result = "";
        if (userChoice === botChoice) result = "It's a tie! 😅";
        else if (
          (userChoice === "rock" && botChoice === "scissors") ||
          (userChoice === "paper" && botChoice === "rock") ||
          (userChoice === "scissors" && botChoice === "paper")
        ) result = "You win! 🎉";
        else result = "I win! 🤖";

        reply = `You chose ${userChoice}, I chose ${botChoice}. ${result}`;
      }
*/

    else {
      reply = "Interesting! I’m still learning, but I’d love to hear more about that.";
    }

    messageElement.textContent = reply;
    chatbox.scrollTo({ top: chatbox.scrollHeight, behavior: "smooth" });

    // Speak only if voice mode is enabled
    speakMessage(reply);

  }, 1200);
}

// Event listeners
sendBtn.addEventListener("click", handleOutgoingMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleOutgoingMessage();
  }
});
