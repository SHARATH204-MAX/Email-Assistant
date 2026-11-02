# AI Email Reply Generator (MailCraft)

A full-stack web application and Chrome extension that generates smart, context-aware email replies using Spring Boot, React, and Google's Gemini API.

I built this project to solve a simple everyday problem: writing repetitive emails and figuring out the right tone takes up too much time. This project combines a **Spring Boot backend**, a **React web interface**, and a **Chrome extension for Gmail** to generate quick email drafts in different tones (professional, casual, friendly, concise, etc.).

---

## System Architecture

Here is the simple block structure diagram showing how the frontend, backend, and AI service connect:

```mermaid
flowchart LR
    subgraph Clients ["1. Client Layer"]
        direction TB
        A["💻 React Web App<br/>(Vite + Material UI)"]
        B["🧩 Chrome Extension<br/>(Gmail Integration)"]
    end

    subgraph Backend ["2. Spring Boot Backend (:8080)"]
        direction TB
        C["🌐 REST Controller<br/>(/api/email/generate)"]
        D["⚙️ Email Service<br/>(Builds Prompt & Tone)"]
        E["⚡ WebClient<br/>(Spring WebFlux)"]
        C --> D
        D --> E
    end

    subgraph AI ["3. AI Cloud"]
        F["✨ Google Gemini API<br/>(gemini-3.5-flash-lite)"]
    end

    A -->|"1. Send Email & Tone"| C
    B -->|"1. Send Email & Tone"| C
    E -->|"2. Request AI Reply"| F
    F -->|"3. Return Generated Reply"| E
    C -->|"4. Display / Insert Reply"| A
    C -->|"4. Display / Insert Reply"| B
```

### How the Workflow Works in 4 Steps:
1. **User Action:** The user enters an email and chooses a tone (via the **React Web App** or the **Gmail Chrome Extension**).
2. **Backend Processing:** The **Spring Boot REST Controller** receives the request. The service layer formats the prompt with tone rules (*Professional, Casual, Concise, etc.*).
3. **AI Generation:** The backend uses **WebClient** to send an API request to **Google Gemini** (`gemini-3.5-flash-lite`).
4. **Result Delivery:** Gemini generates the response, the backend extracts the text, and returns it to be displayed in the web app or directly typed into Gmail.

---

## Tech Stack Used

### Backend
* **Java 17 (LTS):** Core programming language.
* **Spring Boot 4.0.9:** REST API framework, dependency injection, and server configuration.
* **Spring WebFlux (WebClient):** Non-blocking HTTP client used to call the Gemini API.
* **Jackson:** JSON serialization and deserialization.
* **Lombok:** Reduces boilerplate code (getters, setters, constructors).
* **Maven:** Dependency management and build tool.

### Frontend
* **React 19:** Component-based UI library.
* **Vite:** Fast development server and build bundler.
* **Material UI (MUI v9) & Emotion:** Clean UI components (Cards, Buttons, TextFields, Dark/Light theme).
* **Axios:** Handles HTTP requests to the backend.

### Chrome Extension
* **Manifest V3:** Modern Chrome extension standard.
* **Vanilla JavaScript:** DOM observer (`MutationObserver`) to detect Gmail compose windows and inject the AI button.
* **CSS:** Custom button styling matching Gmail's native UI.

### AI Engine
* **Google Gemini API (`gemini-3.5-flash-lite`):** Fast, low-latency LLM for email text generation.

---

## Project Structure

```text
Email-writer/
├── Email-Writer-SB/               # Spring Boot Backend
│   ├── src/main/java/com/email/writer/
│   │   ├── EmailWriterApplication.java      # Main entry point
│   │   ├── EmailGeneratorService.java       # Calls Gemini & parses output
│   │   └── app/
│   │       ├── EmailGeneratorController.java # Endpoints (/health, /generate)
│   │       └── EmailRequest.java            # Request DTO
│   ├── src/main/resources/
│   │   └── application.properties           # Server & API configuration
│   └── pom.xml                              # Maven dependencies
│
├── emali-writer-react/            # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                   # Top header with health check & theme toggle
│   │   │   ├── ToneSelector.jsx             # Tone chips (Professional, Casual, etc.)
│   │   │   ├── SettingsModal.jsx            # Configure API key & backend URL
│   │   │   ├── HistoryDrawer.jsx            # Drawer showing saved recent replies
│   │   │   └── Icons.jsx                    # SVG icon components
│   │   ├── App.jsx                          # Main application layout
│   │   ├── index.css                        # Global styling
│   │   └── main.jsx                         # React root entry
│   ├── package.json
│   └── vite.config.js
│
├── email-writer_ext/              # Chrome Extension for Gmail
│   ├── manifest.json                        # Extension manifest
│   ├── content.js                           # Gmail DOM injection script
│   └── content.css                          # Button styling
│
├── .env.example                             # Environment variables template
├── .gitignore                               # Git ignored files
└── README.md                                # Project documentation
```

---

## Features

* **Multiple Tone Options:** Professional, Casual, Friendly, Concise, Persuasive, and Apologetic.
* **Length Selection:** Short/Concise, Balanced, or Comprehensive reply.
* **Quick Templates:** 1-click test templates (Reschedule Meeting, Project Inquiry, Polite Decline, Job Offer).
* **In-place Editing:** Edit the generated reply right inside the card before copying.
* **1-Click Copy:** Copy button with instant toast notification.
* **Quick Refinement Chips:** Buttons like *Make Shorter*, *More Formal*, *Add Gratitude*, or *Request Call*.
* **Drafts History:** Saves recently generated replies in browser storage so you don't lose them.
* **Dark / Light Mode:** Built-in theme switcher.
* **Live Backend Health Status:** Green/Red connection pill in the navbar showing whether the Spring Boot server is online.
* **Safe API Key Setup:** You can set the Gemini key in the environment or directly in the app's Settings modal.

---

## How to Run This Project Locally

### Prerequisites
Make sure you have installed:
1. **JDK 17 or higher** (`java -version`)
2. **Node.js (v18+) & npm** (`node -v`)
3. **Maven** (`mvn -version`)
4. A free **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/Email-writer.git
cd Email-writer
```

---

### Step 2: Run the Spring Boot Backend

1. Navigate to the backend folder:
   ```bash
   cd Email-Writer-SB
   ```
2. Build the project:
   ```bash
   mvn clean package -DskipTests
   ```
3. Set your Gemini API key and start the server:
   * **On Windows (PowerShell):**
     ```powershell
     $env:GEMINI_KEY = "YOUR_GEMINI_API_KEY"
     java -jar target/Email-writer-0.0.1-SNAPSHOT.jar
     ```
   * **On Linux / Mac:**
     ```bash
     GEMINI_KEY="YOUR_GEMINI_API_KEY" java -jar target/Email-writer-0.0.1-SNAPSHOT.jar
     ```
4. The backend will start on **`http://localhost:8080`**.  
   You can verify it by opening `http://localhost:8080/api/email/health` in your browser.

---

### Step 3: Run the React Frontend

1. Open a new terminal tab and go to the frontend directory:
   ```bash
   cd emali-writer-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open **`http://localhost:5173`** in your browser.

---

### Step 4: Install the Chrome Extension (Optional)

If you want to use it directly in Gmail:
1. Open Google Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `email-writer_ext` folder from this repo.
4. Go to [Gmail](https://mail.google.com/), open any email thread, and hit **Reply**.
5. You will see an **AI Reply** button added to the compose toolbar.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/email/health` | Health check returning server status and whether API key is configured. |
| `POST` | `/api/email/generate` | Generates email reply based on content and tone. |

### Example Request Body
```json
{
  "emailContent": "Hi, can you send the updated project report by 4 PM?",
  "tone": "professional",
  "length": "concise"
}
```

### Example Response
```text
Hi [Name],

I am finalizing the updated project report now and will send it over before 4 PM.

Best regards,
[Your Name]
```

---

## What I Learned from Building This

* How to integrate Spring Boot with third-party AI APIs using non-blocking **Spring WebFlux `WebClient`**.
* Handling CORS between a Spring Boot API, a React frontend, and a browser extension.
* Writing Chrome content scripts with `MutationObserver` to interact with dynamically rendered Gmail elements.
* Designing a clean dual-pane UI in React using Material UI and managing dark/light mode state.
* Implementing fallback error handling so the app doesn't crash if an API key is missing or invalid.

---

## Future Improvements

* Add user accounts and cloud history storage (e.g., using Firebase or PostgreSQL).
* Add support for generating replies in multiple languages.
* Support file attachment summaries before replying.

---

## License

This project is licensed under the [MIT License](LICENSE).
