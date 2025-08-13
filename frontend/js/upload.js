// js/upload.js
import { elements, state, updateState } from './config.js';
import { showAlert } from './ui.js';

export function initializeUploadHandlers() {
    // File input change
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) processFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
}

export function processFile(file) {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showAlert(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB`, 'error');
        return;
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showAlert('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.', 'error');
        return;
    }
    
    updateState({ currentFile: file });
    
    // Show file info
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    elements.fileInfo.style.display = 'block';
    elements.fileInfo.classList.add('fade-in');
    
    // Create preview
    createPreview(file);
    
    elements.contentGrid.style.display = 'grid';
    elements.contentGrid.classList.add('fade-in');
}

function createPreview(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.preview.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="Documento">`;
        };
        reader.readAsDataURL(file);
    } else {
        elements.preview.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-muted); 
                        border: 2px dashed rgba(49, 115, 220, 0.3); border-radius: 12px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📄</div>
                <p>PDF carregado com sucesso</p>
            </div>`;
    }
}