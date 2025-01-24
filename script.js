const API_KEY = "sk-f598e1c2ef704eb7880b2067af3bc32d"; // Your DeepSeek API key
const API_URL = "https://api.deepseek.com/chat/completions"; // Correct API endpoint

const chatDiv = document.getElementById("chat");
const inputField = document.getElementById("input");

// Load chat history from cookies
let chatHistory = getCookie("chatHistory") ? JSON.parse(getCookie("chatHistory")) : [];

// Display chat history
function displayChat() {
  chatDiv.innerHTML = chatHistory.map(msg => `<p><b>${msg.role}:</b> ${msg.content}</p>`).join("");
  chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to the bottom
}

// Send message to DeepSeek API
async function sendMessage(message) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat", // Model name (confirmed from the curl command)
      messages: [
        { role: "system", content: "You are a helpful assistant." }, // System message
        ...chatHistory, // Include chat history
        { role: "user", content: message } // User's new message
      ],
      stream: false // Disable streaming for simplicity
    })
  });

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  // Add user message and AI response to chat history
  chatHistory.push({ role: "user", content: message });
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
