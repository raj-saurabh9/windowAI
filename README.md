#To make it run and working connect with owner 

# WindowAI

WindowAI is an  application that was designed tp captures screenshots and leverages the OpenAI API to analyze them but currently it is  textbased Searching . It can solve questions, generate code, or provide detailed answers based on screenshots. The app supports both single screenshot processing and multi-page mode for capturing multiple images before analysis.

## Features

- **Screenshot Capture:** Use global keyboard shortcuts to capture the screen. (Upcoming) pls share open PRs for main branch if free
- **Global Shortcuts:** Easily control the application using keyboard shortcuts.
- - **Text based AI Searches :** Easily control the application using keyboard shortcuts.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- An OpenAI API key

## Installation

1. **Clone the repository:**

   ```
   git clone (https://github.com/raj-saurabh9/windowAI)
   ```
2. **Install the dependencies:**
   ```
   npm install
   ```
3. **Configure the application:**
   Create a config.json file in the project root with your OpenAI API key and (optionally) your desired model. For example:
    ```
    {
      "apiKey": "YOUR_OPENAI_API_KEY",
      "model": "gpt-4o-mini"
    }
    ```
  - Note: If the model field is omitted, the application defaults to "gpt-4o-mini".


## Usage

1. **Start the Application:**
    Run the following command 
    ```
    npm start
    ```
2. **Global Keyboard Shortcuts:**

    - Option+Shift+L: Hides the windowAI / shows the windowAI 
    - Option+Shift+K: Quit
    - Option+Shift+ <,>,^: move pannel


## Status

This program is still under development. Some features may not be fully implemented, and there might be bugs or incomplete functionality. Your feedback and contributions are welcome as we work towards a more stable release.

