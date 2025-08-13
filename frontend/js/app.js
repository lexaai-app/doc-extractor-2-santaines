// js/app.js
import { elements, state, updateState } from './config.js';
import { initializeUploadHandlers } from './upload.js';
import { extractData } from './extractor.js';
import { showAlert, hideAlert, updateAPIStatus } from './ui.js';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Initialize upload handlers
    initializeUploadHandlers();
    
    // Initialize API controls
    initializeAPIControls();
    
    // Initialize extract button
    elements.extractBtn.addEventListener('click', extractData);
    
    // Show welcome message
    setTimeout(() => {
        showAlert('🎉 Ferramenta carregada com sucesso! Faça upload de um documento para começar.', 'info');
    }, 1000);
}

function initializeAPIControls() {
    // Enable API button
    elements.enableApiBtn.addEventListener('click', showApiInput);
    
    // Confirm API button
    elements.confirmApiBtn.addEventListener('click', confirmApi);
    
    // Cancel API button
    elements.cancelApiBtn.addEventListener('click', cancelApi);
    
    // Disable API button
    elements.disableApiBtn.addEventListener('click', disableApi);
    
    // API key input - Enter key
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmApi();
    });
    
    elements.geminiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmApi();
    });
    
    // Provider radio buttons
    const providerRadios = document.querySelectorAll('input[name="apiProvider"]');
    providerRadios.forEach(radio => {
        radio.addEventListener('change', handleProviderChange);
    });
}

function handleProviderChange(e) {
    const provider = e.target.value;
    updateState({ currentProvider: provider });
    
    if (provider === 'claude') {
        document.getElementById('claudeApiInput').style.display = 'block';
        document.getElementById('geminiApiInput').style.display = 'none';
    } else {
        document.getElementById('claudeApiInput').style.display = 'none';
        document.getElementById('geminiApiInput').style.display = 'block';
    }
}

function showApiInput() {
    elements.apiDisabledState.style.display = 'none';
    elements.apiInputState.style.display = 'block';
    
    if (state.currentProvider === 'claude') {
        elements.apiKeyInput.focus();
    } else {
        elements.geminiKeyInput.focus();
    }
}

function confirmApi() {
    const provider = state.currentProvider;
    const keyInput = provider === 'claude' ? elements.apiKeyInput : elements.geminiKeyInput;
    const key = keyInput.value.trim();
    
    if (!key) {
        showAlert(`Por favor, cole sua chave da API ${provider === 'claude' ? 'Claude' : 'Gemini'}.`, 'error');
        return;
    }
    
    // Validate API key format
    if (provider === 'claude' && !key.startsWith('sk-ant-api')) {
        showAlert('Chave da API Claude inválida. Deve começar com "sk-ant-api".', 'error');
        return;
    }
    
    if (provider === 'gemini' && !key.startsWith('AIza')) {
        showAlert('Chave da API Gemini inválida. Deve começar com "AIza".', 'error');
        return;
    }
    
    updateState({ 
        apiKey: key,
        apiEnabled: true 
    });
    
    elements.apiInputState.style.display = 'none';
    elements.apiEnabledState.style.display = 'block';
    elements.apiSection.classList.add('enabled');
    
    const providerName = provider === 'claude' ? 'Claude' : 'Gemini';
    updateAPIStatus(providerName, true);
    
    hideAlert();
    showAlert(`✅ ${providerName} API habilitada com sucesso! Agora você pode extrair dados automaticamente.`, 'success');
}

function cancelApi() {
    elements.apiKeyInput.value = '';
    elements.geminiKeyInput.value = '';
    elements.apiInputState.style.display = 'none';
    elements.apiDisabledState.style.display = 'block';
}

function disableApi() {
    updateState({ 
        apiEnabled: false,
        apiKey: ''
    });
    
    elements.apiKeyInput.value = '';
    elements.geminiKeyInput.value = '';
    
    elements.apiEnabledState.style.display = 'none';
    elements.apiDisabledState.style.display = 'block';
    elements.apiSection.classList.remove('enabled');
    
    showAlert('⚪ API desabilitada. Voltando ao modo manual.', 'info');
}