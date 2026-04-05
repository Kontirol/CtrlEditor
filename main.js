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

// 🔥 保存文件
ipcMain.handle('file:saveFile', async (_, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8')
  return true
})

// 🔥 另存为对话框
ipcMain.handle('dialog:saveAs', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存 Markdown 文件',
    defaultPath: 'untitled.md',
    filters: [
      { name: 'Markdown', extensions: ['md'] }
    ]
  })
  if (canceled) return null
  return filePath
})

// 🔥 删除文件
ipcMain.handle('file:deleteFile', async (_, filePath) => {
  try {
    fs.unlinkSync(filePath)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

 // 🔥 创建新文件
ipcMain.handle('file:createFile', async (_, folderPath, fileName, content) => {
  try {
    const fullPath = path.join(folderPath, fileName)
    if (fs.existsSync(fullPath)) {
      return { success: false, error: '文件已存在' }
    }
    fs.writeFileSync(fullPath, content, 'utf8')
    return { success: true, path: fullPath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 🔥 读取单个文件
ipcMain.handle('file:readFile', async (_, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      return { success: true, content }
    }
    return { success: false, error: '文件不存在' }
  } catch (err) {
    return { success: false, error: err.message }
  }
})
}
app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())