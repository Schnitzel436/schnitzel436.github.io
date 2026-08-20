const STORAGE_KEY = 'shareflow-files-v1';
const fileInput = document.getElementById('fileInput');
const filesContainer = document.getElementById('filesDisplay');
const dropzone = document.getElementById('dropzone');
const browseButton = document.getElementById('browseButton');
const clearFilesButton = document.getElementById('clearFiles');
const statFiles = document.getElementById('stat-files');
const statSize = document.getElementById('stat-size');

let files = loadFiles();

function loadFiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveFiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

function formatBytes(bytes) {
  if (!bytes) return '0';
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return mb === '0.0' ? '0' : mb;
}

function updateStats() {
  const total = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  statFiles.textContent = String(files.length);
  statSize.textContent = formatBytes(total);
}

function renderFiles() {
  updateStats();

  if (!files.length) {
    filesContainer.innerHTML = '<div class="no-files">No files yet</div>';
    return;
  }

  filesContainer.innerHTML = files
    .map((file) => `
      <div class="file-item" data-id="${file.id}">
        <div class="file-info">
          <span class="file-name" title="${file.name}">${file.name}</span>
          <span class="file-size">${formatBytes(file.size)} MB</span>
        </div>
        <div class="file-actions">
          <a class="file-dl" href="${file.dataUrl}" download="${file.name}" title="Download">↓</a>
          <button class="file-rm" data-delete-id="${file.id}" type="button" title="Delete">✕</button>
        </div>
      </div>
    `)
    .join('');
}

function addFiles(selectedFiles) {
  const filesToAdd = [...selectedFiles].filter((file) => file && file.name);
  if (!filesToAdd.length) return;

  const readers = filesToAdd.map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  Promise.all(readers)
    .then((newFiles) => {
      files = [...newFiles, ...files];
      saveFiles();
      renderFiles();
      fileInput.value = '';
    })
    .catch(() => {
      alert('Error uploading file');
    });
}

browseButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => addFiles(event.target.files));

['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (event) => {
  addFiles(event.dataTransfer.files);
});

filesContainer.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-id]');
  if (!deleteButton) return;

  const { deleteId } = deleteButton.dataset;
  files = files.filter((file) => file.id !== deleteId);
  saveFiles();
  renderFiles();
});

clearFilesButton.addEventListener('click', () => {
  if (!files.length) return;
  if (!window.confirm('Delete all files?')) return;
  files = [];
  saveFiles();
  renderFiles();
});

// Canvas background animation - soft particles
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.size = Math.random() * 2 + 0.5;
    this.opacity = Math.random() * 0.3 + 0.1;
    this.color = [
      'rgba(0, 102, 255, ',
      'rgba(100, 150, 200, ',
      'rgba(120, 170, 220, '
    ][Math.floor(Math.random() * 3)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.fillStyle = this.color + this.opacity + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < 30; i++) {
  particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  requestAnimationFrame(animate);
}

animate();
renderFiles();

