const API_KEY = "sk-f598e1c2ef704eb7880b2067af3bc32d"; // Your DeepSeek API key
const API_URL = "https://api.deepseek.com/chat/completions"; // Correct API endpoint

const chatDiv = document.getElementById("chat");
const inputField = document.getElementById("input");
const themeToggle = document.getElementById("theme-toggle");
const nameModal = document.getElementById("name-modal");
const nameInput = document.getElementById("name-input");
const nameSubmit = document.getElementById("name-submit");

let userName = "";
let isDarkMode = false;

// Load chat history from cookies
let chatHistory = getCookie("chatHistory") ? JSON.parse(getCookie("chatHistory")) : [];

// Show name prompt if no name is set
if (!getCookie("userName")) {
  nameModal.classList.remove("hidden");
} else {
  userName = getCookie("userName"); // Load saved name
}

// Handle name submission
nameSubmit.addEventListener("click", () => {
  userName = nameInput.value.trim();
  if (userName) {
    setCookie("userName", userName, 365); // Save name for 1 year
    nameModal.classList.add("hidden"); // Hide the modal
  } else {
    alert("Please enter a valid name.");
  }
});

// Display chat history
function displayChat() {
  chatDiv.innerHTML = chatHistory
    .map(msg => `
      <div class="mb-4">
        <div class="${msg.role === "user" ? "text-right" : "text-left"}">
          <span class="inline-block px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white message-user" : "bg-gray-200 text-gray-800 message-ai"}">
            <strong>${msg.role === "user" ? userName : "AI"}:</strong> ${msg.content}
          </span>
        </div>
      </div>
    `)
    .join("");
  chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to the bottom
}

// Send message to DeepSeek API
async function sendMessage(message) {
  // Add user message to chat history and display it immediately
  chatHistory.push({ role: "user", content: message });
  displayChat();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat", // Model name
      messages: [
        { role: "system", content: "You are a helpful assistant." }, // System message
        ...chatHistory, // Include chat history
      ],
      stream: false // Disable streaming for simplicity
    })
  });

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  // Add AI response to chat history
  chatHistory.push({ role: "assistant", content: aiResponse });

  // Save chat history to cookies
  setCookie("chatHistory", JSON.stringify(chatHistory), 7); // Expires in 7 days

  // Display updated chat
  displayChat();
}

// Handle Enter key press
function handleKeyPress(event) {
  if (event.key === "Enter") {
    const message = inputField.value.trim();
    if (message) {
      sendMessage(message);
      inputField.value = ""; // Clear input field
    }
  }
}

// Toggle dark/light mode
themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  document.querySelector(".chat-box").classList.toggle("dark-mode", isDarkMode);
  document.querySelector(".input-box").classList.toggle("dark-mode", isDarkMode);
  document.querySelector("#input").classList.toggle("dark-mode", isDarkMode);
  themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
});

// Cookie functions
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
  const cookieName = name + "=";
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return "";
}

// Display initial chat history
displayChat();
