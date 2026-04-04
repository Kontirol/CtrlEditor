const {app,BrowserWindow,ipcMain,dialog  } = require('electron')
const path = require('path')
const fs = require('fs')
function createWindow() {
    const win = new BrowserWindow({
        width:1000,
        height:700,
        autoHideMenuBar:true,
        frame:false,
        transparent: false,
        // 新增：允许网页样式控制拖动
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile('index.html')

    ipcMain.on('window-min', () => win.minimize())
  ipcMain.on('window-max', () => {
    if (win.isMaximized()) win.restore()
    else win.maximize()
  })
  ipcMain.on('window-close', () => win.close())

  // 打开文件夹选择
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (canceled) return null
  return filePaths[0]
})

// 读取文件夹里所有 .md 文件
ipcMain.handle('file:readMDFiles', async (_, folderPath) => {
  const files = fs.readdirSync(folderPath)
  const mdFiles = files
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const fullPath = path.join(folderPath, file)
      const content = fs.readFileSync(fullPath, 'utf8')
      return { file, path: fullPath, content }
    })
  return mdFiles
})
}
app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())