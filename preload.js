const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  windowMin: () => ipcRenderer.send('window-min'),
  windowMax: () => ipcRenderer.send('window-max'),
  windowClose: () => ipcRenderer.send('window-close'),
    //文件操作
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFiles: (folderPath) => ipcRenderer.invoke('file:readMDFiles', folderPath)
})