const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const axios = require('axios');

let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);

  if (!config.OPENAI_API_KEY) {
    throw new Error("API key is missing in config.json");
  }

  // Set default model if not specified
  if (!config.model) {
    config.model = "gpt-4"; // Using GPT-4 as default
    console.log("Model not specified in config, using default:", config.model);
  }
} catch (err) {
  console.error("Error reading config:", err);
  app.quit();
}

let mainWindow;
let screenshots = [];
let multiPageMode = false;

function updateInstruction(instruction) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('update-instruction', instruction);
  }
}

function hideInstruction() {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('hide-instruction');
  }
}

// Step 1: Capture screenshot and extract text
async function captureScreenshot() {
  try {
    console.log("Capturing screenshot...");
    hideInstruction();
    mainWindow.hide();
    await new Promise(res => setTimeout(res, 200));

    const timestamp = Date.now();
    const imagePath = path.join(app.getPath('pictures'), `screenshot_${timestamp}.png`);
    await screenshot({ filename: imagePath });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log("Screenshot captured successfully and converted to base64.");

    // Returning image base64
    mainWindow.show();
    return base64Image;
  } catch (err) {
    mainWindow.show();
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message);
    }
    throw err;
  }
}

// Step 2: Process the screenshots and send extracted text to ChatGPT (OpenAI API)
async function processScreenshots() {
  try {
    console.log("Sending text to ChatGPT API...");
    for (const screenshotData of screenshots) {
      const extractedText = screenshotData.extractedText || "No text extracted"; // Get the text

      // Define the OpenAI API endpoint
      const endpoint = `https://api.openai.com/v1/completions`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`
      };

      // Prepare the request payload
      const data = {
        model: config.model,
        prompt: extractedText,
        max_tokens: 500,  // Limit the response length
      };

      console.log("Making API request to ChatGPT...");

      // Make the request
      const response = await axios.post(endpoint, data, { headers });

      console.log("API response received.");
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Extract and display the response from ChatGPT
      const content = response.data.choices[0].text;
      if (content) {
        console.log("Extracted content from response:", content);

        // Send the extracted content to the renderer
        mainWindow.webContents.send('analysis-result', content);
      } else {
        console.error("No content found in API response.");
        mainWindow.webContents.send('error', "No content found in API response.");
      }
    }
  } catch (err) {
    console.error("Error processing screenshots:", err);
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message);
    }
  }
}

// Reset everything
function resetProcess() {
  screenshots = [];
  multiPageMode = false;
  mainWindow.webContents.send('clear-result');
  updateInstruction("Ctrl+Shift+S: Screenshot | Ctrl+Shift+A: Multi-mode");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    transparent: true, // Make window transparent
    backgroundColor: 'rgba(0, 0, 0, 0)', // Set background to fully transparent
    alwaysOnTop: true,
    paintWhenInitiallyHidden: true,
    contentProtection: true,
    type: 'toolbar',
  });

  mainWindow.loadFile('index.html');
  mainWindow.setContentProtection(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  // Ctrl+Shift+S => single or final screenshot
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    try {
      const base64Image = await captureScreenshot();
      screenshots.push({ base64Image });
      await processScreenshots();
    } catch (error) {
      console.error("Ctrl+Shift+S error:", error);
    }
  });

  // Ctrl+Shift+A => multi-page mode
  globalShortcut.register('CommandOrControl+Shift+A', async () => {
    try {
      if (!multiPageMode) {
        multiPageMode = true;
        updateInstruction("Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize");
      }
      const base64Image = await captureScreenshot();
      screenshots.push({ base64Image });
      updateInstruction("Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize");
    } catch (error) {
      console.error("Ctrl+Shift+A error:", error);
    }
  });

  // Ctrl+Shift+R => reset
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    resetProcess();
  });

  // Command+H => Hide the window
  globalShortcut.register('CommandOrControl+H', () => {
    mainWindow.hide();
  });

  // Command+Shift+H => Show the window
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    mainWindow.show();
  });

  // Move window with large distance (Arrow keys with Ctrl or Shift)
  let moveSpeed = 100; // Increase the distance moved
  globalShortcut.register('CommandOrControl+Up', () => {
    let position = mainWindow.getBounds();
    mainWindow.setBounds({
      x: position.x,
      y: position.y - moveSpeed,
      width: position.width,
      height: position.height
    });
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    let position = mainWindow.getBounds();
    mainWindow.setBounds({
      x: position.x,
      y: position.y + moveSpeed,
      width: position.width,
      height: position.height
    });
  });

  globalShortcut.register('CommandOrControl+Left', () => {
    let position = mainWindow.getBounds();
    mainWindow.setBounds({
      x: position.x - moveSpeed,
      y: position.y,
      width: position.width,
      height: position.height
    });
  });

  globalShortcut.register('CommandOrControl+Right', () => {
    let position = mainWindow.getBounds();
    mainWindow.setBounds({
      x: position.x + moveSpeed,
      y: position.y,
      width: position.width,
      height: position.height
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
