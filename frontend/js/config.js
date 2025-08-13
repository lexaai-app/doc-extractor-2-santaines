// js/config.js

// Detectar ambiente automaticamente
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// URL da API baseada no ambiente
export const API_BASE_URL = isProduction 
    ? 'http://31.97.20.232:8567'  // IP direto para produção
    : 'http://localhost:8567';   // Desenvolvimento



export const elements = {
    // File handling
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    
    // Upload area
    uploadArea: document.querySelector('.upload-area'),
    
    // API Section
    apiSection: document.getElementById('apiSection'),
    apiKeyInput: document.getElementById('apiKey'),
    geminiKeyInput: document.getElementById('geminiKey'),
    apiDisabledState: document.getElementById('apiDisabledState'),
    apiInputState: document.getElementById('apiInputState'),
    apiEnabledState: document.getElementById('apiEnabledState'),
    
    // API Buttons
    enableApiBtn: document.getElementById('enableApiBtn'),
    confirmApiBtn: document.getElementById('confirmApiBtn'),
    cancelApiBtn: document.getElementById('cancelApiBtn'),
    disableApiBtn: document.getElementById('disableApiBtn'),
    
    // Extract button
    extractBtn: document.getElementById('extractBtn'),
    
    // Loading
    loading: document.getElementById('loading'),
    loadingText: document.getElementById('loadingText'),
    
    // Content
    contentGrid: document.getElementById('contentGrid'),
    preview: document.getElementById('preview'),
    extractedData: document.getElementById('extractedData'),
    
    // Alerts
    alertContainer: document.getElementById('alertContainer'),
    
    // Provider status
    providerStatus: document.getElementById('providerStatus')
};

export let state = {
    currentFile: null,
    apiEnabled: false,
    apiKey: '',
    currentProvider: 'claude' // 'claude' or 'gemini'
};

export function updateState(updates) {
    state = { ...state, ...updates };
}
