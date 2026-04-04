document.getElementById('min').addEventListener('click', () => {
  window.electronAPI.windowMin()
})

// 最大化 / 还原
document.getElementById('max').addEventListener('click', () => {
  window.electronAPI.windowMax()
})

// 关闭
document.getElementById('close').addEventListener('click', () => {
  window.electronAPI.windowClose()
})


// 打开文件夹加载 markdown 文件
document.getElementById('folder').addEventListener('click',async () => {
  // 1. 打开文件夹选择
  const folderPath = await window.electronAPI.openFolder()
  if (!folderPath) return

  // 2. 读取所有 .md 文件
  const mdFiles = await window.electronAPI.readFiles(folderPath)
  
  // 3. 渲染到左侧列表
  const list = document.getElementById('note-list')
  list.innerHTML = ''

  mdFiles.forEach(item => {
    const div = document.createElement('div')
    div.className = 'note-item'
    div.innerHTML = `
      <div class="note-title">${item.file}</div>
      <div class="note-time">${new Date().toLocaleString()}</div>
    `
    div.addEventListener('click', () => {
       document.querySelectorAll('.note-item').forEach(el => {
        el.classList.remove('select')
      })
      div.classList.add('select')
      document.getElementById('editor').innerHTML = item.content
      document.getElementById('current-note-title').innerText = item.file
      // 如果你有预览，刷新预览
      // updatePreview()
    })
    list.appendChild(div)
  })
})











// 创建文件

// 预览
const editor = document.getElementById('editor')
const previewArea = document.getElementById('previewArea')
let isPreview = false

document.getElementById('preview').addEventListener('click',()=>{
  isPreview = !isPreview
  if (isPreview) {
    // 进入预览模式
    document.body.classList.add('preview-mode')
    renderMarkdown(editor.innerText)
  } else {
    // 回到编辑模式
    document.body.classList.remove('preview-mode')
  }
})

// 把 markdown 变成漂亮的页面
function renderMarkdown(text) {
  let html = text
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 加粗
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // 换行
    .replace(/\n/g, '<br>')

  previewArea.innerHTML = html
}






// 删除文件
document.getElementById('del').addEventListener('click',()=>{
  alert("待实现")
})