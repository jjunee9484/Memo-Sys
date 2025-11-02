
// 🔹 폴더 구조 읽기
async function readDirectory(dirHandle) {
  const items = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'directory') {
      const children = await readDirectory(handle);
      items.push({ type: 'folder', name, handle, children });
    } else {
      items.push({ type: 'file', name, handle });
    }
  }
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// 🔹 DOM 생성
function renderTree(data) {
  const container = document.createElement('div');
  data.forEach(node => {
    if (node.type === 'folder') {
      const folder = document.createElement('div');
      folder.className = 'folder';
      folder.innerHTML = `<div class="icon">📁</div><div>${node.name}</div>`;
      const childContainer = document.createElement('div');
      childContainer.className = 'children';
      childContainer.appendChild(renderTree(node.children));
      const wrapper = document.createElement('div');
      wrapper.appendChild(folder);
      wrapper.appendChild(childContainer);
      folder.onclick = () => wrapper.classList.toggle('open');
      container.appendChild(wrapper);
    } else {
      const file = document.createElement('div');
      file.className = 'file';
      file.innerHTML = `<div class="icon">📄</div><div>${node.name}</div>`;
      file.onclick = () => previewFile(node.handle, node.name);
      container.appendChild(file);
    }
  });
  return container;
}

// 🔹 파일 내용 미리보기
async function previewFile(handle, name) {
  const preview = document.getElementById('preview');
  preview.innerHTML = `<h2 style="margin-top:0">${name}</h2>`;
  const contentEl = document.createElement('div');
  try {
    const file = await handle.getFile();
    const ext = name.split('.').pop().toLowerCase();

    if (['txt', 'md', 'mymd', 'json', 'js', 'css', 'html', 'log', 'py', 'cpp', 'cs'].includes(ext)) {
      const text = await file.text();
      contentEl.textContent = text;
    } else {
      contentEl.textContent = `이 파일 형식은 미리보기를 지원하지 않습니다.`;
    }
  } catch (err) {
    contentEl.textContent = `파일을 읽을 수 없습니다.`;
    console.error(err);
  }
  preview.appendChild(contentEl);
}

// 🔹 폴더 선택 버튼
document.getElementById('openFolder').onclick = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const data = await readDirectory(dirHandle);
    const treeContainer = document.getElementById('tree');
    treeContainer.innerHTML = '';
    treeContainer.appendChild(renderTree(data));
    document.getElementById('preview').innerHTML = '<em>파일을 선택하면 내용이 여기에 표시됩니다.</em>';
  } catch (err) {
    console.warn('폴더 선택 취소됨');
  }
};

// 🔹 다크모드 토글
document.getElementById('toggleDark').onclick = () =>
  document.body.classList.toggle('dark');

  // 🔹 리사이저 동작
const resizer = document.getElementById('resizer');
const treeContainer = document.getElementById('treeContainer');
let isResizing = false;

resizer.addEventListener('mousedown', e => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
});

window.addEventListener('mousemove', e => {
  if (!isResizing) return;
  const main = document.getElementById('main');
  const totalWidth = main.offsetWidth;
  let newWidth = (e.clientX / totalWidth) * 100;
  if (newWidth < 7.5) newWidth = 7.5;
  if (newWidth > 75) newWidth = 75;
  treeContainer.style.width = `${newWidth}%`;
});

window.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = 'default';
  }
});
