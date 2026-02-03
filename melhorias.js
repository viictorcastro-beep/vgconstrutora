// 🚀 VG CONSTRUTORA - Melhorias JavaScript (cole no final do script, antes do </script>)

// ========== 1. TOAST NOTIFICATIONS ==========
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn .3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== 2. MÁSCARA DE VALORES ==========
function maskMoney(input) {
  let value = input.value.replace(/\D/g, '');
  value = (parseInt(value || 0) / 100).toFixed(2);
  value = value.replace('.', ',');
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  input.value = value;
}

// Aplicar máscara nos campos de valor
['lanc-valor', 'acerto-valor', 'rat-valor', 'unid-new-vgv', 'ded-valor'].forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener('input', () => maskMoney(el));
    el.addEventListener('focus', function() {
      if (this.value === '0,00') this.value = '';
    });
  }
});

// ========== 3. EDIÇÃO DE LANÇAMENTOS ==========
let editingLancamentoId = null;

function editLancamento(lanc) {
  editingLancamentoId = lanc.id;
  
  // Preenche form
  $('lanc-dt').value = lanc.dt || '';
  $('lanc-desc').value = lanc.desc || '';
  $('lanc-valor').value = String(lanc.valor || 0).replace('.', ',');
  $('lanc-unidade').value = lanc.unidadeId || '';
  $('lanc-pagador').value = lanc.pagador || '';
  $('lanc-pa').value = lanc.pA || 0.5;
  $('lanc-pb').value = lanc.pB || 0.5;
  $('lanc-categoria').value = lanc.categoriaId || '';
  $('lanc-fornecedor').value = lanc.fornecedorId || '';
  $('lanc-link').value = lanc.anexoUrl || '';
  $('lanc-notas').value = lanc.notas || '';
  
  // Muda UI
  $('lanc-save-text').textContent = 'Atualizar Lançamento';
  $('lanc-cancel').classList.remove('hidden');
  
  // Scroll to form
  document.getElementById('lanc-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Editando lançamento...', false);
}

function cancelEdit() {
  editingLancamentoId = null;
  $('lanc-form').reset();
  $('lanc-dt').valueAsDate = new Date();
  $('lanc-pa').value = 0.5;
  $('lanc-pb').value = 0.5;
  $('lanc-save-text').textContent = 'Salvar Lançamento';
  $('lanc-cancel').classList.add('hidden');
}

// Hook no botão cancelar
if ($('lanc-cancel')) {
  $('lanc-cancel').onclick = cancelEdit;
}

// Modificar addLancamento para suportar update
// (cole isso SUBSTITUINDO a função addLancamento original)

async function addLancamento(e) {
  e.preventDefault();
  if (!OBRA_ID) return (showToast('Selecione uma obra.', true), false);

  const dt = $('lanc-dt').value;
  const desc = $('lanc-desc').value.trim();
  const valor = parseNum($('lanc-valor').value);
  const unidadeId = $('lanc-unidade').value;
  const pagador = $('lanc-pagador').value;
  const pA = Number($('lanc-pa').value);
  const pB = Number($('lanc-pb').value);
  const categoriaId = $('lanc-categoria').value || '';
  const fornecedorId = $('lanc-fornecedor').value || '';
  const anexoUrl = $('lanc-link').value.trim();
  const notas = $('lanc-notas').value.trim();

  if (!dt) return (showToast('Data obrigatória.', true), false);
  if (!desc) return (showToast('Descrição obrigatória.', true), false);
  if (valor <= 0) return (showToast('Valor deve ser positivo.', true), false);
  if (!unidadeId) return (showToast('Selecione uma unidade.', true), false);
  if (Math.abs((pA + pB) - 1) > 0.001) return (showToast('pA + pB precisa dar 100%.', true), false);

  const unidadeNome = state.unidades.find(u=>u.id===unidadeId)?.nome || '';
  const categoriaNome = categoriaId ? catLabelById(categoriaId) : '';
  const fornecedorNome = fornecedorId ? fornNomeById(fornecedorId) : '';

  const data = {
    dt, desc, valor,
    unidadeId, unidadeNome,
    pagador, pA, pB,
    categoriaId, categoriaNome,
    fornecedorId, fornecedorNome,
    anexoUrl, notas,
    updatedAt: serverTimestamp()
  };

  try {
    $('lanc-save-text').textContent = 'Salvando...';
    $('lanc-save-btn').disabled = true;

    if (editingLancamentoId) {
      // UPDATE
      await updateDoc(doc(db, 'obras', OBRA_ID, 'lancamentos', editingLancamentoId), data);
      showToast('✓ Lançamento atualizado!');
      cancelEdit();
    } else {
      // CREATE
      await addDoc(refs(OBRA_ID).lancamentosCol, {
        ...data,
        createdBy: currentUser.email,
        createdAt: serverTimestamp()
      });
      showToast('✓ Lançamento salvo!');
    }

    $('lanc-desc').value = '';
    $('lanc-valor').value = '';
    $('lanc-link').value = '';
    $('lanc-notas').value = '';
  } catch (err) {
    console.error('Erro ao salvar lançamento:', err);
    showToast('Erro ao salvar: ' + err.message, true);
  } finally {
    $('lanc-save-text').textContent = editingLancamentoId ? 'Atualizar Lançamento' : 'Salvar Lançamento';
    $('lanc-save-btn').disabled = false;
  }
}

// ========== 4. FILTRO POR DATA ==========
let filterDateStart = '';
let filterDateEnd = '';
let filterPeriod = 'all';

// Atualizar função viewLancamentos para incluir filtro de data
// (adicione esse código no início da função viewLancamentos existente)

function viewLancamentos() {
  let list = state.lancamentos || [];

  // Filtro por visão
  if (VIEW !== 'OBRA_TODA') list = list.filter(l => l.unidadeId === VIEW);

  // Filtro por categoria
  if (filterCategoria !== 'TODAS') list = list.filter(l => l.categoriaId === filterCategoria);
  
  // Filtro por fornecedor
  if (filterFornecedor !== 'TODOS') list = list.filter(l => l.fornecedorId === filterFornecedor);

  // Filtro por texto
  if (filterText) {
    list = list.filter(l => {
      const hay = `${l.desc||''} ${l.notas||''}`.toLowerCase();
      return hay.includes(filterText);
    });
  }

  // NOVO: Filtro por data
  if (filterDateStart || filterDateEnd) {
    list = list.filter(l => {
      const dt = l.dt || '';
      if (filterDateStart && dt < filterDateStart) return false;
      if (filterDateEnd && dt > filterDateEnd) return false;
      return true;
    });
  }

  return list;
}

// Handlers para filtro de período
if ($('filter-period')) {
  $('filter-period').onchange = (e) => {
    filterPeriod = e.target.value;
    const today = new Date();
    const startInput = $('filter-date-start');
    const endInput = $('filter-date-end');

    switch(filterPeriod) {
      case 'today':
        filterDateStart = filterDateEnd = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        filterDateStart = weekStart.toISOString().split('T')[0];
        filterDateEnd = today.toISOString().split('T')[0];
        break;
      case 'month':
        filterDateStart = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`;
        filterDateEnd = today.toISOString().split('T')[0];
        break;
      case 'all':
        filterDateStart = filterDateEnd = '';
        break;
      case 'custom':
        // deixa o usuário escolher
        return;
    }

    if (startInput) startInput.value = filterDateStart;
    if (endInput) endInput.value = filterDateEnd;
    
    if (filterPeriod !== 'custom') rerender();
  };
}

if ($('apply-date-filter')) {
  $('apply-date-filter').onclick = () => {
    filterDateStart = $('filter-date-start').value;
    filterDateEnd = $('filter-date-end').value;
    rerender();
    showToast('Filtro de data aplicado!');
  };
}

if ($('clear-all-filters')) {
  $('clear-all-filters').onclick = () => {
    $('filter-text').value = '';
    $('filter-categoria').value = 'TODAS';
    $('filter-fornecedor').value = 'TODOS';
    $('filter-period').value = 'all';
    $('filter-date-start').value = '';
    $('filter-date-end').value = '';
    filterText = '';
    filterCategoria = 'TODAS';
    filterFornecedor = 'TODOS';
    filterDateStart = '';
    filterDateEnd = '';
    filterPeriod = 'all';
    rerender();
    showToast('Filtros limpos!');
  };
}

// ========== 5. BOTÕES DE EDITAR NA TABELA ==========
// Modificar rerender() para adicionar botão editar
// (adicione no HTML da tabela de lançamentos, substitua a linha do botão X)

// De:
// <td><button class="l-del btn btn-danger" data-id="${l.id}" type="button">X</button></td>

// Para:
// <td class="flex gap-1">
//   <button class="l-edit btn btn-soft" data-id="${l.id}" type="button" title="Editar">✏️</button>
//   <button class="l-del btn btn-danger" data-id="${l.id}" type="button" title="Deletar">🗑️</button>
// </td>

// E adicionar o handler no wireUI():
document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('l-edit')) {
    const id = e.target.dataset.id;
    const lanc = state.lancamentos.find(l => l.id === id);
    if (lanc) editLancamento(lanc);
  }
});

console.log('✓ Melhorias aplicadas: Toast, Máscara, Edição, Filtro Data');
