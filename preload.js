const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  windowMin: () => ipcRenderer.send('window-min'),
  windowMax: () => ipcRenderer.send('window-max'),
  windowClose: () => ipcRenderer.send('window-close'),
  // 文件操作
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFiles: (folderPath) => ipcRenderer.invoke('file:readMDFiles', folderPath),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:saveFile', filePath, content),
  saveFileAs: () => ipcRenderer.invoke('dialog:saveAs'),
  deleteFile: (filePath) => ipcRenderer.invoke('file:deleteFile', filePath),
  createFile: (folderPath, fileName, content) => ipcRenderer.invoke('file:createFile', folderPath, fileName, content),
  readFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath)
})