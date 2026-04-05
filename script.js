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
let currentFolder = null // 保存当前打开的文件夹
let currentFile = null // 当前打开的文件
let hasOpenedFolder = false // 标记是否已打开过文件夹

// Toast 提示函数
function showToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.style.display = 'block'
  setTimeout(() => {
    toast.style.display = 'none'
  }, 2000)
}

document.getElementById('folder').addEventListener('click',async () => {
  //打开文件夹选择
  const folderPath = await window.electronAPI.openFolder()
  if(!folderPath) return

  currentFolder = folderPath //记录当前文件夹
  
  // 显示文件列表
  const noteList = document.getElementById('note-list')
  noteList.style.display = 'block'
  
  // 如果之前显示的是 README.md，清空编辑器
  if (!hasOpenedFolder && currentFile && currentFile.file === 'README.md') {
    setEditorContent(editor, '')
    currentFile = null
  }
  
  hasOpenedFolder = true
  refreshNoteList() //首次加载
})

async function refreshNoteList() {
  if(!currentFolder) return

  //重新读取文件
  const mdFiles = await window.electronAPI.readFiles(currentFolder)

  const list = document.getElementById('note-list')
  list.innerHTML = ''

  mdFiles.forEach(item => {
    const div = document.createElement('div')
    div.className = "note-item"
    div.innerHTML = `
      <div class="note-title">${item.file}</div>
      <div class="note-time">${new Date().toLocaleString()}</div>
    `
    div.addEventListener('click',()=>{
      selectNote(item, div)
    })
    list.appendChild(div)
  });
  
}


// 预览
const editor = document.getElementById('editor')
const previewArea = document.getElementById('previewArea')
let isPreview = false

function getPlainTextWithNewlines(editor) {
  // 深克隆，避免影响原始编辑区
  const clone = editor.cloneNode(true);
  
  // 1. 将所有块级标签（div, p, h1-h6, li 等）替换成换行符
  const blockTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre'];
  blockTags.forEach(tag => {
    const elements = clone.querySelectorAll(tag);
    elements.forEach(el => {
      // 在元素内容的前面插入一个换行符（如果不是最开头）
      if (el.previousSibling || el.parentNode !== clone) {
        el.insertAdjacentText('beforebegin', '\n');
      }
      // 把标签本身去掉，内部子节点提升上来
      el.replaceWith(...el.childNodes);
    });
  });
  
  // 2. 处理孤立的 <br>
  const brs = clone.querySelectorAll('br');
  brs.forEach(br => br.replaceWith('\n'));
  
  // 3. 获取纯文本，并清理连续多个换行为单个（可选）
  let text = clone.textContent;
  // text = text.replace(/\n+/g, '\n');
  return text.trim();
}

// 将纯文本（带\n换行符）转换为编辑器的innerHTML
function setEditorContent(editor, text) {
  if (!text) {
    editor.innerHTML = '';  // 改用 innerHTML，避免锁住 contenteditable
    return;
  }
  // 将换行符转换为<br>，并转义HTML特殊字符
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  editor.innerHTML = html;
}


document.getElementById('preview').addEventListener('click',()=>{
  isPreview = !isPreview
  if (isPreview) {
    // 进入预览模式
    document.body.classList.add('preview-mode')
    renderMarkdown(getPlainTextWithNewlines(editor))
  } else {
    // 回到编辑模式
    document.body.classList.remove('preview-mode')
    // 强制刷新编辑器焦点
    editor.blur()
    editor.focus()
  }
})




// 把 markdown 变成漂亮的页面
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderMarkdown(text) {
  // 先处理代码块（```...```），避免内部内容被其他规则误解析
  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  })

  // 处理行内代码（单行）
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')

  // 处理标题
  html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // 处理无序列表
  html = html.replace(/^[*-] (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // 处理有序列表
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>')

  // 处理水平线
  html = html.replace(/^---+$/gm, '<hr>')
  html = html.replace(/^\*\*\*+$/gm, '<hr>')

  // 处理表格
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map(c => c.trim())
    return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')

  // 处理图片（支持可选的title：![alt](url "title")）- 必须先于链接处理
  // 使用平衡括号模式处理URL中的括号，必须在斜体/加粗之前处理，避免URL中的_和*被错误解析
  html = html.replace(/!\[([^\]]*)\]\(((?:[^()]|\([^)]*\))*?)(?:\s+"([^"]*)")?\)/g, '<img src="$2" alt="$1" title="$3" style="max-width:100%;">')

  // 处理链接（支持可选的title：[text](url "title")）
  // 使用平衡括号模式处理URL中的括号，必须在斜体/加粗之前处理
  html = html.replace(/\[([^\]]*)\]\(((?:[^()]|\([^)]*\))*?)(?:\s+"([^"]*)")?\)/g, '<a href="$2" target="_blank" title="$3">$1</a>')

  // 处理加粗
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/(?![^<]*>)_(.*?)_/g, '<em>$1</em>')

  // 处理删除线
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')

  // 处理换行
  html = html.replace(/\n/g, '<br>')

  previewArea.innerHTML = html
}






// 删除文件
document.getElementById('del').addEventListener('click', async () => {
  if (!currentFile) {
    showToast('请先选择一个文件')
    return
  }
  // if (!confirm(`确定要删除文件 "${currentFile.file}" 吗？`)) {
  //   return
  // }
  const result = await window.electronAPI.deleteFile(currentFile.path)
  if (result.success) {
    // 1. 清空当前文件状态
    currentFile = null
    
    // 2. 刷新文件列表（异步，不阻塞）
    refreshNoteList()
    showToast('文件已删除')
    
    // 3. 用 setTimeout 延迟恢复焦点，等文件列表渲染完成
    setTimeout(() => {
      editor.focus()
    }, 50)
  } else {
    showToast('删除失败')
  }
})

// 新建文件
document.getElementById('create').addEventListener('click', async () => {
  if (!currentFolder) {
    alert('请先打开一个文件夹')
    return
  }
  // 显示弹窗
  document.getElementById('newFileDialog').style.display = 'flex'
  document.getElementById('newFileName').focus()
})

// 弹窗确定按钮
document.getElementById('newFileConfirm').addEventListener('click', async () => {
  const fileName = document.getElementById('newFileName').value.trim()
  if (!fileName) {
    alert('请输入文件名')
    return
  }
  
  const fullName = fileName.endsWith('.md') ? fileName : fileName + '.md'
  const result = await window.electronAPI.createFile(currentFolder, fullName, '')
  
  document.getElementById('newFileDialog').style.display = 'none'
  document.getElementById('newFileName').value = 'untitled'
  
    if (result.success) {
      currentFile = { file: fullName, path: result.path, content: '' }
    setEditorContent(editor, '')
      refreshNoteList()
    } else {
    alert('创建失败: ' + result.error)
  }
})

// 弹窗取消按钮
document.getElementById('newFileCancel').addEventListener('click', () => {
  document.getElementById('newFileDialog').style.display = 'none'
  document.getElementById('newFileName').value = 'untitled'
})

// 保存文件
function getBaseName(filePath) {
  return filePath.split(/[\\/]/).pop()
}

document.getElementById('save').addEventListener('click', async () => {
    const content = getPlainTextWithNewlines(document.getElementById('editor'))
  
  if (!currentFile) {
    // 未打开文件，弹出另存为
    const filePath = await window.electronAPI.saveFileAs()
    if (!filePath) return
    
    const result = await window.electronAPI.saveFile(filePath, content)
    if (result) {
      currentFile = { 
        file: getBaseName(filePath), 
        path: filePath, 
        content: content 
      }
      refreshNoteList()
      showToast('保存成功')
      editor.focus()
    }
  } else {
    // 保存到当前文件
    const result = await window.electronAPI.saveFile(currentFile.path, content)
    if (result) {
      // 更新 currentFile 的内容
      currentFile.content = content
      refreshNoteList()
      showToast('保存成功')
       // 恢复焦点
       editor.focus()
    } else {
      showToast('保存失败')
    }
  }
})

// 更新文件点击事件，记录当前文件
async function selectNote(item, div) {
  // 重新读取文件内容（确保获取最新内容）
  const mdFiles = await window.electronAPI.readFiles(currentFolder)
  const updatedFile = mdFiles.find(f => f.file === item.file)
  
  document.querySelectorAll('.note-item').forEach(el => {
    el.classList.remove('select')
  })
  div.classList.add('select')
  currentFile = updatedFile || item
  setEditorContent(editor, currentFile.content || '')
  // 直接恢复编辑器焦点
  editor.focus()
}

// Ctrl+S 快捷键保存
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (!currentFile) {
      showToast('请先选择或创建一个文件')
      return
    }
  const content = getPlainTextWithNewlines(document.getElementById('editor'))
    const result = await window.electronAPI.saveFile(currentFile.path, content)
    if (result) {
      currentFile.content = content
      showToast('已保存')
    } else {
      showToast('保存失败')
    }
  }
})

// 自动保存（每10秒）
setInterval(async () => {
  if (!currentFile) return
  const editorEl = document.getElementById('editor')
  const content = getPlainTextWithNewlines(editorEl) || ''
  // 只在内容和当前文件不一致时保存
  if (content !== currentFile.content) {
    const result = await window.electronAPI.saveFile(currentFile.path, content)
    if (result) {
      currentFile.content = content
      console.log('自动保存成功')
    }
  }
}, 10000)

// 初始化：页面加载完成后显示 README.md
async function initializeApp() {
  // 初始时隐藏文件列表
  const noteList = document.getElementById('note-list')
  noteList.style.display = 'none'
  
  // 尝试读取 README.md 文件
  try {
    // 这里使用相对路径假设 README.md 与 index.html 在同一目录
    const readmePath = 'README.md'
    const result = await window.electronAPI.readFile(readmePath)
    
    if (result.success) {
      // 将 README.md 内容显示在编辑器中
      setEditorContent(editor, result.content)
      // 标记当前文件为 README.md
      currentFile = { file: 'README.md', path: readmePath, content: result.content }
    } else {
      console.log('README.md 未找到，编辑器保持为空')
    }
  } catch (error) {
    console.log('读取 README.md 失败:', error)
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM 已经加载完成，直接初始化
  initializeApp()
}

