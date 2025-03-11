const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);

  if (!config.OPENAI_API_KEY) {
    throw new Error("API key is missing in config.json");
  }

  if (!config.model) {
    config.model = "gpt-4o-mini";
    console.log("Model not specified in config, using default:", config.model);
  }
} catch (err) {
  console.error("Error reading config:", err);
  app.quit();
}

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

let mainWindow;

function createWindow() {
  console.log("Creating main application window...");
  mainWindow = new BrowserWindow({
    width: 600,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  mainWindow.setContentProtection(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.loadFile('index.html');

  console.log("Registering global shortcuts...");
  globalShortcut.register('Option+Shift+Enter', async () => {
    mainWindow.webContents.send('submit-search');
    console.log("Shortcut triggered: Submit search");
  });

  globalShortcut.register('Option+Shift+K', () => {
    console.log("Terminating application...");
    app.quit();
  });

  globalShortcut.register('Option+Shift+L', () => {
    if (mainWindow.isVisible()) {
      console.log("Hiding window...");
      mainWindow.hide();
    } else {
      console.log("Showing window...");
      mainWindow.show();
    }
  });

  let moveSpeed = 50;
  globalShortcut.register('Option+Shift+Up', () => moveWindow(0, -moveSpeed));
  globalShortcut.register('Option+Shift+Down', () => moveWindow(0, moveSpeed));
  globalShortcut.register('Option+Shift+Left', () => moveWindow(-moveSpeed, 0));
  globalShortcut.register('Option+Shift+Right', () => moveWindow(moveSpeed, 0));

  function moveWindow(deltaX, deltaY) {
    let bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: bounds.x + deltaX,
      y: bounds.y + deltaY,
      width: bounds.width,
      height: bounds.height
    });
    console.log(`Window moved to: x=${bounds.x + deltaX}, y=${bounds.y + deltaY}`);
  }
}

ipcMain.on('user-input', async (event, prompt) => {
  try {
    console.log("Received search request:", prompt);
    let modifiedPrompt = `Analyze the following question: "${prompt}"\n\n`;

    if (prompt.toLowerCase().includes("design") || prompt.toLowerCase().includes("architecture")) {
      modifiedPrompt += "If it's a system design question, give a Low-Level Design (LLD) solution in Java with proper classes, methods, and relationships.";
    } else {
      modifiedPrompt += "If it's a coding problem, provide an optimized C++ using namespace std ,solution with comments and an explanation.";
    }

//    const response = await openai.chat.completions.create({
//      model: config.model,
//      messages: [{ role: "user", content: modifiedPrompt }],
//      max_tokens: 800,
//    });

const response = config;
    console.log("OpenAI response received" , response.choices[0].message.content);
    event.reply('chatgpt-response', response.choices[0].message.content);
  } catch (err) {
    console.error("Error processing search:", err);
    event.reply('chatgpt-response', "Error: " + err.message);
  }
});

app.whenReady().then(() => {
  console.log("Application is ready");
  createWindow();

  ipcMain.on('user-input', (event, text) => {
    console.log("User entered:", text);
    mainWindow.webContents.send('search-chatgpt', text);
  });
});

app.on('window-all-closed', () => {
  console.log("All windows closed, unregistering shortcuts...");
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log("Recreating main window...");
    createWindow();
  }
});
