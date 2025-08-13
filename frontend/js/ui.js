// js/ui.js
import { elements, state } from './config.js';


if (!navigator.clipboard) {
    navigator.clipboard = {
        writeText: function(text) {
            return new Promise(function(resolve, reject) {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    resolve();
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            });
        }
    };
}


export function showAlert(message, type = 'info') {
    hideAlert();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in`;
    alertDiv.textContent = message;
    alertDiv.id = 'currentAlert';
    
    elements.alertContainer.appendChild(alertDiv);
    
    if (type === 'success' || type === 'info') {
        setTimeout(hideAlert, 5000);
    }
}

export function hideAlert() {
    const currentAlert = document.getElementById('currentAlert');
    if (currentAlert) {
        currentAlert.remove();
    }
}

export function updateAPIStatus(provider, enabled) {
    if (enabled) {
        elements.apiSection.classList.add('enabled');
        elements.providerStatus.textContent = provider === 'claude' 
            ? '✅ Claude API Habilitada - Extração Automática Ativa'
            : '✅ Gemini API Habilitada - Extração Automática Ativa';
    } else {
        elements.apiSection.classList.remove('enabled');
    }
}

export function showLoading(text = 'Processando...') {
    elements.loading.style.display = 'block';
    elements.loadingText.textContent = text;
}

export function hideLoading() {
    elements.loading.style.display = 'none';
}

export function displayExtractedData(data, isDemo = false, source = 'manual') {
    elements.extractedData.innerHTML = '';
    
    // Status banner
    let statusHtml = '';
    if (source === 'manual') {
        statusHtml = `
            <div class="status-banner status-manual">
                ✏️ <strong>Preenchimento Manual</strong> - Clique nos campos para editar
            </div>`;
    } else if (source === 'ai') {
        const provider = state.currentProvider === 'claude' ? 'Claude' : 'Gemini';
        statusHtml = `
            <div class="status-banner status-ai">
                🤖 <strong>Extração por ${provider}</strong> - Verifique e ajuste se necessário
            </div>`;
    }
    
    elements.extractedData.innerHTML = statusHtml;
    
    // Configuração dos campos com melhor organização
    const sections = [
        {
            title: "📋 Dados Pessoais",
            fields: [
                { key: 'nome', label: 'Nome Completo', required: true },
                { key: 'cpf', label: 'CPF', mask: '000.000.000-00' },
                { key: 'rg', label: 'RG' },
                { key: 'dataNascimento', label: 'Data de Nascimento', mask: '00/00/0000' },
                { key: 'estadoCivil', label: 'Estado Civil' }
            ]
        },
        {
            title: "👨‍👩‍👧 Filiação",
            fields: [
                { key: 'nomeDaMae', label: 'Nome da Mãe' },
                { key: 'nomeDoPai', label: 'Nome do Pai' }
            ]
        },
        {
            title: "📍 Origem e Endereço",
            fields: [
                { key: 'naturalidade', label: 'Naturalidade' },
                { key: 'uf', label: 'UF', maxLength: 2 },
                { key: 'nacionalidade', label: 'Nacionalidade' },
                { key: 'endereco', label: 'Endereço' },
                { key: 'cep', label: 'CEP', mask: '00000-000' }
            ]
        },
        {
            title: "📄 Dados do Documento",
            fields: [
                { key: 'tipoDocumento', label: 'Tipo de Documento', readonly: true },
                { key: 'numeroDocumento', label: 'Número do Documento' },
                { key: 'orgaoExpedidor', label: 'Órgão Expedidor' },
                { key: 'dataExpedicao', label: 'Data de Expedição', mask: '00/00/0000' },
                { key: 'dataVencimento', label: 'Data de Vencimento', mask: '00/00/0000' }
            ]
        }
    ];
    
    // Se for CNH, adicionar campos específicos
    if (data.tipoDocumento && data.tipoDocumento.includes('CNH')) {
        sections.push({
            title: "🚗 Dados da CNH",
            fields: [
                { key: 'categoria', label: 'Categoria' },
                { key: 'numeroRegistro', label: 'Número de Registro' },
                { key: 'validade', label: 'Validade', mask: '00/00/0000' },
                { key: 'primeiraHabilitacao', label: 'Primeira Habilitação', mask: '00/00/0000' }
            ]
        });
    }
    
    // Adicionar seção para outros dados se existirem
    if (data.observacoes || data.outrosDados) {
        sections.push({
            title: "📝 Informações Adicionais",
            fields: [
                { key: 'observacoes', label: 'Observações' },
                { key: 'outrosDados', label: 'Outros Dados' }
            ]
        });
    }
    
    // Renderizar seções
    sections.forEach(section => {
        const hasData = section.fields.some(field => data[field.key] && data[field.key] !== 'null');
        
        if (hasData) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'field-section';
            sectionDiv.innerHTML = `<h4>${section.title}</h4>`;
            
            section.fields.forEach(field => {
                const value = data[field.key];
                if (value && value !== 'null' && value !== null) {
                    sectionDiv.appendChild(createField(field, value, source));
                }
            });
            
            elements.extractedData.appendChild(sectionDiv);
        }
    });
    
    // Adicionar botões de ação no final
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'extraction-actions';
    actionsDiv.innerHTML = `
        <button class="btn btn-primary" onclick="copyAllData()">
            📋 Copiar Todos os Dados
        </button>
        <button class="btn btn-secondary" onclick="exportToJSON()">
            💾 Exportar JSON
        </button>
        <button class="btn btn-secondary" onclick="printData()">
            🖨️ Imprimir
        </button>
    `;
    
    elements.extractedData.appendChild(actionsDiv);
}

function createField(field, value, source) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'data-field';
    
    const isEditable = source === 'manual' && value.includes('[');
    
    if (isEditable || source === 'ai') {
        // Campo editável
        fieldDiv.innerHTML = `
            <label>${field.label}${field.required ? ' *' : ''}</label>
            <div class="field-wrapper">
                <input type="text" 
                       class="editable-field ${field.required && !value ? 'required' : ''}" 
                       value="${isEditable ? '' : value}" 
                       placeholder="${isEditable ? value : 'Digite aqui...'}"
                       ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                       ${field.readonly ? 'readonly' : ''}
                       ${field.mask ? `data-mask="${field.mask}"` : ''}
                       onchange="validateField(this)">
                <button class="copy-btn" onclick="copyFieldValue(this)">📋</button>
            </div>
        `;
    } else {
        // Campo somente leitura
        fieldDiv.innerHTML = `
            <label>${field.label}</label>
            <div class="field-wrapper">
                <div class="value">${value}</div>
                <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(value)}', this)">📋</button>
            </div>
        `;
    }
    
    return fieldDiv;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === FUNÇÕES GLOBAIS PARA OS BOTÕES ===

// Função para copiar texto para clipboard
window.copyToClipboard = function(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ Copiado!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        showAlert('Erro ao copiar. Use Ctrl+C para copiar manualmente.', 'error');
    });
}

// Função para copiar campo editável
window.copyEditableField = function(input, button) {
    const text = input.value;
    if (!text || (text.includes('[') && text.includes(']'))) {
        showAlert('Por favor, preencha o campo antes de copiar.', 'warning');
        input.focus();
        return;
    }
    copyToClipboard(text, button);
}

// Função para copiar valor de um campo específico
window.copyFieldValue = function(button) {
    const input = button.parentElement.querySelector('input');
    const value = input.value;
    
    if (!value || value.includes('[')) {
        showAlert('⚠️ Preencha o campo antes de copiar', 'warning');
        input.focus();
        return;
    }
    
    copyToClipboard(value, button);
}

// Função para copiar todos os dados
window.copyAllData = function() {
    const fields = document.querySelectorAll('.editable-field, .value');
    let allData = '';
    
    fields.forEach(field => {
        const label = field.closest('.data-field').querySelector('label').textContent.replace(' *', '');
        const value = field.value || field.textContent;
        if (value && !value.includes('[')) {
            allData += `${label}: ${value}\n`;
        }
    });
    
    if (!allData) {
        showAlert('⚠️ Nenhum dado para copiar. Preencha os campos primeiro.', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(allData).then(() => {
        showAlert('✅ Todos os dados foram copiados!', 'success');
    }).catch(() => {
        showAlert('❌ Erro ao copiar dados.', 'error');
    });
}

// Função para exportar dados para JSON
window.exportToJSON = function() {
    const data = {
        dataExtracao: new Date().toLocaleString('pt-BR'),
        documento: state.currentFile ? state.currentFile.name : 'Desconhecido',
        metodoExtracao: state.apiEnabled ? `API ${state.currentProvider}` : 'Manual',
        dados: {}
    };
    
    const fields = document.querySelectorAll('.data-field');
    
    fields.forEach(field => {
        const label = field.querySelector('label').textContent.replace(' *', '');
        const input = field.querySelector('input');
        const value = input ? input.value : field.querySelector('.value')?.textContent;
        
        if (value && !value.includes('[')) {
            // Criar chave normalizada
            const key = label.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '_');
            
            data.dados[key] = {
                label: label,
                valor: value
            };
        }
    });
    
    if (Object.keys(data.dados).length === 0) {
        showAlert('⚠️ Nenhum dado para exportar. Preencha os campos primeiro.', 'warning');
        return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlert('✅ Arquivo JSON exportado com sucesso!', 'success');
}

// Função para imprimir dados
window.printData = function() {
    const printWindow = window.open('', '_blank');
    const fields = document.querySelectorAll('.data-field');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dados Extraídos - ${new Date().toLocaleDateString('pt-BR')}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #666; }
                .value { margin-left: 10px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <h1>Dados Extraídos do Documento</h1>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Arquivo:</strong> ${state.currentFile ? state.currentFile.name : 'Não informado'}</p>
            <hr>
    `;
    
    fields.forEach(field => {
        const label = field.querySelector('label').textContent;
        const input = field.querySelector('input');
        const value = input ? input.value : field.querySelector('.value')?.textContent;
        
        if (value && !value.includes('[')) {
            htmlContent += `
                <div class="field">
                    <span class="label">${label}:</span>
                    <span class="value">${value}</span>
                </div>
            `;
        }
    });
    
    htmlContent += `
            <div class="footer">
                <p>Documento gerado pelo Sistema de Extração de Documentos</p>
                <p>Cartório Fernando Dias - 2º Tabelionato de Notas</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Função para validar campo
window.validateField = function(input) {
    if (input.classList.contains('required') && !input.value) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }
}

// Função auxiliar para aplicar máscaras (opcional - se quiser implementar máscaras)
window.applyMask = function(input) {
    const mask = input.dataset.mask;
    if (!mask) return;
    
    let value = input.value.replace(/\D/g, '');
    let masked = '';
    let valueIndex = 0;
    
    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
        if (mask[i] === '0') {
            masked += value[valueIndex];
            valueIndex++;
        } else {
            masked += mask[i];
        }
    }
    
    input.value = masked;
}

// Exportar funções para uso em outros módulos
export { showAlert as displayAlert };
