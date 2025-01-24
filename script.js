const API_KEY = "sk-f598e1c2ef704eb7880b2067af3bc32d"; // Your DeepSeek API key
const API_URL = "https://api.deepseek.com/chat/completions"; // Correct API endpoint

const chatDiv = document.getElementById("chat");
const inputField = document.getElementById("input");
const themeToggle = document.getElementById("theme-toggle");
const customPopup = document.getElementById("custom-popup");
const nameInput = document.getElementById("name-input");
const nameSubmit = document.getElementById("name-submit");

let userName = "";
let isDarkMode = localStorage.getItem("darkMode") === "true"; // Load dark mode preference

// Load chat history from localStorage
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Show custom popup if no name is set
if (!localStorage.getItem("userName")) {
  customPopup.style.display = "flex"; // Show the popup
} else {
  userName = localStorage.getItem("userName"); // Load saved name
}

// Apply dark mode on page load
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  document.querySelector(".chat-box").classList.add("dark-mode");
  document.querySelector(".input-box").classList.add("dark-mode");
  document.querySelector(".chat-window").classList.add("dark-mode");
  document.querySelector("#input").classList.add("dark-mode");
  themeToggle.textContent = "☀️"; // Sun icon for dark mode
}

// Handle name submission
nameSubmit.addEventListener("click", () => {
  userName = nameInput.value.trim();
  console.log("Submitting name:", userName); // Debugging

  if (userName) {
    localStorage.setItem("userName", userName); // Save name to localStorage
    console.log("Name saved to localStorage:", userName); // Debugging

    customPopup.style.display = "none"; // Hide the popup
    console.log("Popup hidden"); // Debugging
  } else {
    alert("Please enter a valid name.");
  }
});

// Function to format the AI's response
function formatResponse(response) {
  // Replace code blocks (```) with <pre><code> tags
  response = response.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
    return `
      <div class="code-block">
        <button class="copy-button" onclick="copyCode(this)">
          <span>Copy</span>
        </button>
        <pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>
      </div>
    `;
  });

  // Replace headers (###) with <h3> tags
  response = response.replace(/### (.*)/g, "<h3 class='text-lg font-bold mt-4 mb-2'>$1</h3>");

  // Replace bold text (**) with <strong> tags
  response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace bullet points (-) with <li> tags
  response = response.replace(/^- (.*)/gm, "<li>$1</li>");

  // Wrap groups of <li> tags in <ul> tags
  response = response.replace(/(<li>.*<\/li>)/g, "<ul class='list-disc pl-6'>$1</ul>");

  // Replace line breaks with <br> tags
  response = response.replace(/\n/g, "<br>");

  // Replace --- with <hr> tags for horizontal rules
  response = response.replace(/---/g, "<hr class='my-4 border-t border-gray-300'>");

  // Preserve LaTeX expressions (e.g., \( \text{Zn} \rightarrow \text{Zn}^{2+} + 2e^- \))
  response = response.replace(/\\\((.*?)\\\)/g, "\\($1\\)");

  return response;
}

// Function to copy code to clipboard
function copyCode(button) {
  const codeBlock = button.nextElementSibling.textContent;
  navigator.clipboard.writeText(codeBlock).then(() => {
    button.innerHTML = "<span>Copied!</span>";
    setTimeout(() => {
      button.innerHTML = "<span>Copy</span>";
    }, 2000);
  });
}

// Display chat history
function displayChat() {
  chatDiv.innerHTML = chatHistory
    .map(msg => `
      <div class="mb-4">
        <div class="${msg.role === "user" ? "text-right" : "text-left"}">
          <span class="inline-block px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white message-user" : "bg-gray-200 text-gray-800 message-ai"}">
            <strong>${msg.role === "user" ? userName : "Munir"}:</strong> ${msg.role === "user" ? msg.content : formatResponse(msg.content)}
          </span>
        </div>
      </div>
    `)
    .join("");

  // Highlight code blocks
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block);
  });

  // Trigger MathJax to render LaTeX expressions
  if (window.MathJax) {
    MathJax.typesetPromise();
  }

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
        { role: "system", content: "You are a helpful assistant. Your name is Munir, your wife is Rita, she works as a cleaner. You have 3 kids, Lord, Lion, and Theresa. Lord has autism and loves lea. Lion is cool and Theresa is very beautiful." }, // System message
        ...chatHistory, // Include chat history
      ],
      stream: false // Disable streaming for simplicity
    })
  });

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  // Add AI response to chat history
  chatHistory.push({ role: "assistant", content: aiResponse });

  // Save chat history to localStorage
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

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
  document.querySelector(".chat-window").classList.toggle("dark-mode", isDarkMode);
  document.querySelector("#input").classList.toggle("dark-mode", isDarkMode);
  themeToggle.textContent = isDarkMode ? "☀️" : "🌙";

  // Save dark mode preference to localStorage
  localStorage.setItem("darkMode", isDarkMode);
});

// Display initial chat history
displayChat();
