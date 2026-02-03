
    // Firebase imports
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js");
    const { getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");

    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyCOrMx8Hv2qRkoIBwBBVq4V2DONUa7T0lU",
      authDomain: "qd20-lt2-a-b.firebaseapp.com",
      projectId: "qd20-lt2-a-b",
      storageBucket: "qd20-lt2-a-b.firebasestorage.app",
      messagingSenderId: "648174167866",
      appId: "1:648174167866:web:98fb10be18b73fcc7a9203"
    };

    // Initialize
    console.log("🔥 Inicializando Firebase...");
    console.log("Project ID:", firebaseConfig.projectId);
    console.log("Auth Domain:", firebaseConfig.authDomain);
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();
    
    console.log("✓ Firebase inicializado");
    console.log("✓ Auth configurado");
    console.log("✓ Firestore configurado");

    // Whitelist
    const ALLOWED_EMAILS = ["viictor.castro@gmail.com", "gcm.conceicao@gmail.com"];

    // Utils
    const $ = (id) => document.getElementById(id);
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function showToast(message, type = 'info') {
      const container = $('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      };
      
      toast.innerHTML = `<span style="font-size: 20px;">${icons[type]}</span><span>${escapeHtml(message)}</span>`;
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // Helper para desabilitar base quando valor é fixo
    function toggleDeducaoBase() {
      const tipo = $("ded-tipo").value;
      const baseSelect = $("ded-base");
      
      if (tipo === "fixo") {
        baseSelect.disabled = true;
        baseSelect.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        baseSelect.disabled = false;
        baseSelect.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }

    // Theme Toggle
    function toggleTheme() {
      const body = document.body;
      const currentTheme = body.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      const btn = $("theme-toggle");
      btn.textContent = newTheme === 'light' ? '🌙' : '☀️';
      
      // Recriar gráficos com tema novo
      if (VIEW === "DASHBOARD") {
        renderCharts();
      }
    }

    // Export to Excel
    async function exportToExcel() {
      if (typeof XLSX === 'undefined') {
        showToast('Biblioteca Excel não carregada', 'error');
        return;
      }

      const wb = XLSX.utils.book_new();
      
      // Lançamentos
      const lancData = state.lancamentos.map(l => ({
        'Data': l.data,
        'Descrição': l.descricao,
        'Categoria': state.categorias.find(c => c.id === l.categoriaId)?.nome || '',
        'Fornecedor': state.fornecedores.find(f => f.id === l.fornecedorId)?.nome || '',
        'Unidade': state.unidades.find(u => u.id === l.unidadeId)?.nome || '',
        'Valor': l.valor,
        'Status': l.status || 'pendente'
      }));
      const wsLanc = XLSX.utils.json_to_sheet(lancData);
      XLSX.utils.book_append_sheet(wb, wsLanc, 'Lançamentos');
      
      // Rateios
      const ratData = state.rateios.map(r => ({
        'Data': r.data,
        'Descrição': r.descricao,
        'Categoria': state.categorias.find(c => c.id === r.categoriaId)?.nome || '',
        'Fornecedor': state.fornecedores.find(f => f.id === r.fornecedorId)?.nome || '',
        'Valor Total': r.valorTotal,
        'Status': r.status || 'pendente'
      }));
      const wsRat = XLSX.utils.json_to_sheet(ratData);
      XLSX.utils.book_append_sheet(wb, wsRat, 'Rateios');
      
      // Recebimentos
      const recData = state.recebimentos.map(r => ({
        'Data': r.data,
        'Unidade': state.unidades.find(u => u.id === r.unidadeId)?.nome || '',
        'Tipo': r.tipo,
        'Forma Pagamento': r.formaPagamento,
        'Valor': r.valor,
        'Observação': r.observacao || ''
      }));
      const wsRec = XLSX.utils.json_to_sheet(recData);
      XLSX.utils.book_append_sheet(wb, wsRec, 'Recebimentos');
      
      // Dashboard Summary
      const lucroData = computeLucro();
      const summary = [{
        'Indicador': 'Custo Total',
        'Valor': lucroData.custoTotal
      }, {
        'Indicador': 'VGV',
        'Valor': lucroData.vgvTotal
      }, {
        'Indicador': 'Lucro Bruto',
        'Valor': lucroData.lucroBruto
      }, {
        'Indicador': 'Lucro Líquido',
        'Valor': lucroData.lucroLiquido
      }];
      const wsSummary = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Dashboard');
      
      const obra = state.obras.find(o => o.id === OBRA_ID);
      const filename = `VG_${obra?.nome || 'Obra'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast('Excel exportado com sucesso!', 'success');
    }

    // Global state
    let VIEW = "OBRAS";  // Começa no dashboard de obras
    let OBRA_ID = null;
    let filterText = "";
    let filterCategoria = "TODAS";
    let filterFornecedor = "TODOS";
    let filterPeriodo = "TODOS";
    let filterStatus = "TODOS";
    let rateioDestCount = 0;

    const state = {
      user: null,
      obras: [],
      socios: [],  // Lista de sócios personalizados
      unidades: [],
      categorias: [],
      fornecedores: [],
      deducoes: [],
      lancamentos: [],
      rateios: [],
      recebimentos: [],
      acertos: [],
      config: {}
    };

    const listeners = [];

    // SISTEMA DE PERMISSÕES
    const ROLES = {
      ADMIN: 'admin',
      SOCIO: 'socio'
    };

    const ADMIN_EMAIL = 'viictor.castro@gmail.com';

    function isAdmin() {
      return state.user && state.user.email === ADMIN_EMAIL;
    }

    function hasAccessToObra(obraId) {
      if (isAdmin()) return true;
      
      const obra = state.obras.find(o => o.id === obraId);
      if (!obra) return false;
      
      // Verificar se o usuário está vinculado à obra
      const usuarios = obra.usuarios || [];
      return usuarios.some(u => u.email === state.user.email);
    }

    function getUserRoleInObra(obraId) {
      if (isAdmin()) return ROLES.ADMIN;
      
      const obra = state.obras.find(o => o.id === obraId);
      if (!obra) return null;
      
      const usuarios = obra.usuarios || [];
      const usuario = usuarios.find(u => u.email === state.user.email);
      return usuario ? usuario.role : null;
    }

    function getSocioIdForUser(obraId) {
      const obra = state.obras.find(o => o.id === obraId);
      if (!obra) return null;
      
      const usuarios = obra.usuarios || [];
      const usuario = usuarios.find(u => u.email === state.user.email);
      return usuario ? usuario.socioId : null;
    }

    // Firestore refs
    function refs(obraId) {
      return {
        obrasCol: collection(db, "obras"),
        sociosCol: collection(db, "socios"),  // Coleção global de sócios
        obraDoc: doc(db, "obras", obraId),
        unidadesCol: collection(db, "obras", obraId, "unidades"),
        categoriasCol: collection(db, "obras", obraId, "categorias"),
        fornecedoresCol: collection(db, "obras", obraId, "fornecedores"),
        deducoesCol: collection(db, "obras", obraId, "deducoes"),
        lancamentosCol: collection(db, "obras", obraId, "lancamentos"),
        rateiosCol: collection(db, "obras", obraId, "rateios"),
        recebimentosCol: collection(db, "obras", obraId, "recebimentos"),
        acertosCol: collection(db, "obras", obraId, "acertos"),
        configDoc: doc(db, "obras", obraId, "config", "main")
      };
    }

    // AUTH
    onAuthStateChanged(auth, async (user) => {
      console.log("→ Auth state:", user?.email || "deslogado");
      
      if (user) {
        if (!ALLOWED_EMAILS.includes(user.email)) {
          alert("⛔ Acesso negado. E-mail não autorizado.");
          await signOut(auth);
          return;
        }
        
        state.user = user;
        console.log("🔐 User logged in:", user.email);
        console.log("👑 Is Admin?", user.email === ADMIN_EMAIL);
        console.log("📧 Expected admin:", ADMIN_EMAIL);
        
        $("user-email").textContent = user.email;
        $("login-screen").classList.add("hidden");
        $("app").classList.remove("hidden");
        
        subscribeSocios();
        subscribeObrasList();
        setupEventListeners();
        
        // Inicializar estado do formulário de deduções
        toggleDeducaoBase();
        
        // Restaurar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        $("theme-toggle").textContent = savedTheme === 'light' ? '🌙' : '☀️';
        
        showToast(`Bem-vindo, ${user.email}!`, 'success');
      } else {
        state.user = null;
        $("login-screen").classList.remove("hidden");
        $("app").classList.add("hidden");
        listeners.forEach(unsub => unsub());
        listeners.length = 0;
      }
    });

    // Check redirect result
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("✓ Login via redirect:", result.user.email);
      }
    }).catch((error) => {
      console.error("✗ Erro redirect result:", error);
    });

    // Setup login buttons (needs to be before auth state changes)
    $("login-btn").onclick = handleLogin;
    $("login-redirect-btn").onclick = async () => {
      console.log("🔐 Login via redirect");
      $("login-msg").textContent = "Redirecionando...";
      try {
        await signInWithRedirect(auth, provider);
      } catch (err) {
        console.error("✗ Erro redirect:", err);
        showLoginError(err);
      }
    };

    function setupEventListeners() {
      // Modal triggers
      $("menu-obras").onclick = () => openModal("modal-obras");
      $("menu-unidades").onclick = () => openModal("modal-unidades");
      $("menu-fornecedores").onclick = () => openModal("modal-fornecedores");
      $("menu-categorias").onclick = () => openModal("modal-categorias");

      // View switching
      document.querySelectorAll(".view-btn").forEach(btn => {
        btn.onclick = () => {
          VIEW = btn.dataset.view;
          localStorage.setItem("view", VIEW);
          rerender();
        };
      });

      // Filters
      $("filters-clear").onclick = () => {
        $("filter-text").value = "";
        $("filter-categoria").value = "TODAS";
        $("filter-fornecedor").value = "TODOS";
        $("filter-periodo").value = "TODOS";
        $("filter-status").value = "TODOS";
        filterText = "";
        filterCategoria = "TODAS";
        filterFornecedor = "TODOS";
        filterPeriodo = "TODOS";
        filterStatus = "TODOS";
        rerender();
      };

      // CRUD buttons
      $("obra-create").onclick = () => openModal("modal-obra");
      document.getElementById("obra-form").onsubmit = createObra;
      $("unid-create").onclick = createUnidade;
      $("forn-create").onclick = createFornecedor;
      $("cat-create").onclick = createCategoria;
      $("ded-create").onclick = createDeducao;

      // Deduções: controlar estado da base quando tipo mudar
      $("ded-tipo").onchange = toggleDeducaoBase;

      $("socios-save").onclick = saveSocios;
      $("logout-btn").onclick = () => signOut(auth);

      // Forms
      $("lanc-form").onsubmit = addLancamento;
      $("lanc-quick").onclick = () => {
        const trans = state.unidades.find(u => (u.nome||"").toLowerCase().includes("transit"));
        if (trans) $("lanc-unidade").value = trans.id;
      };

      $("rat-add-dest").onclick = rateioAddDest;
      $("rat-save").onclick = addRateio;
      $("rat-igual-btn").onclick = ratearIgualmente;

      $("receb-form").onsubmit = addRecebimento;

      $("obra-form").onsubmit = async (e) => {
        e.preventDefault();
        
        const nome = $("obra-nome").value.trim();
        const dataInicio = $("obra-inicio").value;
        const endereco = $("obra-endereco").value.trim();
        const totalUnidades = parseInt($("obra-total-unidades").value) || null;
        const prazo = parseInt($("obra-prazo").value) || null;
        const investimentoA = parseFloat($("obra-invest-a").value) || 0;
        const investimentoB = parseFloat($("obra-invest-b").value) || 0;
        const observacoes = $("obra-obs").value.trim();

        if (!nome || !dataInicio) {
          showToast('Preencha nome e data de início', 'warning');
          return;
        }

        try {
          const novaObra = await addDoc(collection(db, "obras"), {
            nome,
            dataInicio,
            endereco,
            totalUnidades,
            prazo,
            investimentoA,
            investimentoB,
            observacoes,
            createdAt: serverTimestamp(),
            createdBy: state.user.email
          });

          $("obra-form").reset();
          closeModal("modal-obra");
          showToast('Obra criada com sucesso!', 'success');
          
          // Selecionar a obra recém-criada
          OBRA_ID = novaObra.id;
          localStorage.setItem("obraId", OBRA_ID);
          VIEW = "DASHBOARD";
          rerender();
        } catch (err) {
          console.error(err);
          showToast('Erro ao criar obra', 'error');
        }
      };

      $("criar-obra-btn").onclick = () => {
        resetarModalObra(); // Resetar para modo criação
        hydrateSociosObraSelect(); // Popular dropdowns de sócios
        openModal("modal-obra");
      };

      $("acerto-form").onsubmit = addAcerto;
      $("acerto-sugerir").onclick = () => {
        const eq = computeEqualizacao();
        if (eq && eq.mensagem) {
          showToast(eq.mensagem, 'info');
        } else {
          showToast('✅ Saldos equalizados! Não há acertos pendentes.', 'success');
        }
      };

      $("export-pdf-btn").onclick = exportPDF;

      // Theme toggle
      $("theme-toggle").onclick = toggleTheme;
      
      // Excel export
      $("export-excel-btn").onclick = exportToExcel;

      // Modal close
      document.querySelectorAll("[data-close]").forEach(btn => {
        btn.onclick = () => closeModal(btn.dataset.close);
      });
    }

    async function handleLogin() {
      console.log("🔐 Tentando login...");
      $("login-btn-text").textContent = "Conectando...";
      $("login-msg").textContent = "";
      
      try {
        console.log("→ Tentando popup...");
        const result = await signInWithPopup(auth, provider);
        console.log("✓ Login OK:", result.user.email);
        $("login-msg").textContent = "✓ Login realizado!";
      } catch (err) {
        console.error("✗ Erro popup:", err.code);
        $("login-btn-text").textContent = "Entrar com Google";
        
        if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
          console.log("→ Popup falhou, tentando redirect...");
          $("login-redirect-btn").classList.remove("hidden");
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (err2) {
            showLoginError(err2);
            return;
          }
        }
        
        showLoginError(err);
      }
    }

    function showLoginError(err) {
      let msg = "";
      let debugInfo = "";
      
      if (err.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
        msg = "⚠️ API Key inválida. Problema de configuração do Firebase.";
        debugInfo = "A API key precisa ser verificada no Firebase Console > Project Settings > General";
      } else if (err.code === "auth/unauthorized-domain") {
        msg = "⚠️ Domínio não autorizado no Firebase.";
        debugInfo = `Adicione "${window.location.hostname}" em Authentication > Settings`;
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "⚠️ Google Sign-In não habilitado.";
      } else if (err.code === "auth/popup-blocked") {
        msg = "⚠️ Popup bloqueado. Use o botão alternativo.";
      } else if (err.code === "auth/popup-closed-by-user") {
        msg = "Login cancelado.";
      } else {
        msg = `Erro: ${err.code || "desconhecido"}`;
        debugInfo = err.message;
      }
      
      $("login-msg").textContent = msg;
      $("login-msg").className = "text-xs text-red-600 mt-4 min-h-[16px]";
      
      $("debug-content").innerHTML = `
        <div>• Code: ${err.code || 'N/A'}</div>
        <div>• Message: ${err.message || 'N/A'}</div>
        ${debugInfo ? `<div class="mt-2 font-bold">→ ${debugInfo}</div>` : ''}
      `;
      $("debug-info").classList.remove("hidden");
    }

    // SUBSCRIPTIONS
    function subscribeSocios() {
      const r = refs("dummy").sociosCol;
      listeners.push(onSnapshot(r, (snap) => {
        state.socios = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nome.localeCompare(b.nome));
        console.log("👔 Sócios carregados:", state.socios.length);
        hydrateSociosSelect();
        hydrateSociosObraSelect();
        hydrateProprietarioSelect();
        renderListaSocios();
      }, (err) => {
        console.error("❌ Erro ao carregar sócios:", err);
      }));
    }

    // Helper para obter label do proprietário (compatível com formato antigo e novo)
    function getProprietarioLabel(proprietarioId) {
      if (!proprietarioId || proprietarioId === 'ambos') return '👥 Ambos (Legacy)';
      if (proprietarioId === 'A') return '👤 Sócio A (Legacy)';
      if (proprietarioId === 'B') return '👤 Sócio B (Legacy)';
      
      // Buscar sócio cadastrado
      const socio = state.socios.find(s => s.id === proprietarioId);
      if (socio) return `👤 ${socio.nome}`;
      
      return `⚠️ Proprietário desconhecido (${proprietarioId})`;
    }

    function hydrateSociosObraSelect() {
      const selectA = $("obra-socio-a");
      const selectB = $("obra-socio-b");
      if (!selectA || !selectB) return;
      
      // Popular Sócio A
      const currentA = selectA.value;
      selectA.innerHTML = '<option value="">Selecione o Sócio A</option>' +
        state.socios.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
      if (currentA) selectA.value = currentA;
      
      // Popular Sócio B
      const currentB = selectB.value;
      selectB.innerHTML = '<option value="">Nenhum (Obra individual)</option>' +
        state.socios.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
      if (currentB) selectB.value = currentB;
    }
    
    function hydrateProprietarioSelect() {
      const select = $("unid-new-proprietario");
      if (!select) return;
      
      // Suportar formato antigo (A/B/ambos) e novo (socioIds)
      const optionsHtml = [];
      optionsHtml.push('<option value="">Selecione o proprietário...</option>');
      
      // Opções legacy para compatibilidade
      optionsHtml.push('<optgroup label="📦 Sistema Antigo (Legacy)">');
      optionsHtml.push('<option value="A">👤 Sócio A (Legacy)</option>');
      optionsHtml.push('<option value="B">👤 Sócio B (Legacy)</option>');
      optionsHtml.push('<option value="ambos">👥 Ambos (Legacy)</option>');
      optionsHtml.push('</optgroup>');
      
      // Sócios cadastrados
      if (state.socios.length > 0) {
        optionsHtml.push('<optgroup label="👔 Sócios Cadastrados">');
        state.socios.forEach(s => {
          optionsHtml.push(`<option value="${s.id}">${escapeHtml(s.nome)}</option>`);
        });
        optionsHtml.push('</optgroup>');
      } else {
        optionsHtml.push('<option value="" disabled>⚠️ Nenhum sócio cadastrado - use 👔 Sócios</option>');
      }
      
      select.innerHTML = optionsHtml.join('');
    }

    function subscribeObrasList() {
      const r = refs("dummy").obrasCol;
      listeners.push(onSnapshot(r, (snap) => {
        console.log("📊 Total de obras no Firestore:", snap.size);
        const todasObras = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        console.log("🔍 TODAS as obras no banco (inclui ID completo):");
        todasObras.forEach(o => {
          console.log("  -", o.nome || "SEM NOME", "| ID:", o.id, "| Tem usuários:", !!(o.usuarios && o.usuarios.length > 0));
        });
        
        console.log("🔍 Procurando por 'qd61' ou 'lt32':");
        const obrasProcuradas = todasObras.filter(o => 
          (o.nome && (o.nome.toLowerCase().includes('qd61') || o.nome.toLowerCase().includes('lt32'))) ||
          (o.id && (o.id.toLowerCase().includes('qd61') || o.id.toLowerCase().includes('lt32')))
        );
        if (obrasProcuradas.length > 0) {
          console.log("✅ Encontradas:", obrasProcuradas);
        } else {
          console.log("❌ NÃO ENCONTRADA - obra qd61 lt32 não existe no banco");
        }
        
        // Filtrar obras baseado em permissões
        if (isAdmin()) {
          state.obras = todasObras;
          console.log("👑 ADMIN (" + state.user.email + "): acesso a todas as", todasObras.length, "obras");
        } else {
          state.obras = todasObras.filter(obra => {
            const usuarios = obra.usuarios || [];
            const hasAccess = usuarios.some(u => u.email === state.user.email);
            if (!hasAccess) {
              console.log("🚫 Sem acesso à obra:", obra.nome);
            }
            return hasAccess;
          });
          console.log("👤 Sócio (" + state.user.email + "): acesso a", state.obras.length, "obras");
        }
        
        console.log("✅ Obras disponíveis:", state.obras.map(o => o.nome));
        
        // Verificar se a obra atualmente selecionada ainda está disponível
        if (OBRA_ID) {
          const obraAtual = state.obras.find(o => o.id === OBRA_ID);
          if (!obraAtual) {
            console.warn("⚠️ Obra selecionada (" + OBRA_ID + ") não está mais disponível");
            OBRA_ID = null;
            localStorage.removeItem("obraId");
          } else {
            console.log("✓ Obra selecionada ainda disponível:", obraAtual.nome);
          }
        }
        
        hydrateObrasSelect();
      }, (err) => {
        console.error("❌ Erro ao carregar obras:", err);
        showToast("Erro ao carregar obras", "error");
        $("obra-select").innerHTML = `<option value="">Erro ao carregar</option>`;
      }));
    }

    function hydrateObrasSelect() {
      const sel = $("obra-select");
      if (!state.obras.length) {
        sel.innerHTML = `<option value="">Nenhuma obra</option>`;
        return;
      }
      sel.innerHTML = state.obras.map(o => `<option value="${o.id}">${escapeHtml(o.nome || o.id)}</option>`).join("");
      if (!OBRA_ID) {
        OBRA_ID = state.obras[0].id;
        subscribeObra(); // Só subscribe se for a primeira vez
      } else {
        sel.value = OBRA_ID;
        // Não chamar subscribeObra() aqui - evita loop infinito
      }
    }

    function subscribeObra() {
      if (!OBRA_ID) return;
      
      // Clear previous listeners (except obras list listener at index 0)
      while (listeners.length > 1) {
        const unsub = listeners.pop();
        unsub();
      }

      const r = refs(OBRA_ID);
      
      // Usar flag para evitar múltiplas renderizações simultâneas
      let batchUpdate = false;
      const scheduleRerender = () => {
        if (batchUpdate) return;
        batchUpdate = true;
        setTimeout(() => {
          batchUpdate = false;
          rerender();
        }, 100);
      };

      listeners.push(onSnapshot(r.unidadesCol, (snap) => {
        state.unidades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.categoriasCol, (snap) => {
        state.categorias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.fornecedoresCol, (snap) => {
        state.fornecedores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.deducoesCol, (snap) => {
        state.deducoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.lancamentosCol, (snap) => {
        state.lancamentos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.rateiosCol, (snap) => {
        state.rateios = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.recebimentosCol, (snap) => {
        state.recebimentos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.acertosCol, (snap) => {
        state.acertos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        scheduleRerender();
      }));

      listeners.push(onSnapshot(r.configDoc, (snap) => {
        state.config = snap.exists() ? snap.data() : {};
        scheduleRerender();
      }));

      rerender();
    }

    window.switchObra = function() {
      OBRA_ID = $("obra-select").value;
      if (OBRA_ID) {
        // Verificar acesso
        if (!hasAccessToObra(OBRA_ID)) {
          showToast('❌ Você não tem acesso a esta obra', 'error');
          OBRA_ID = null;
          localStorage.removeItem("obraId");
          VIEW = "OBRAS";
          rerender();
          return;
        }
        
        localStorage.setItem("obraId", OBRA_ID);
        subscribeObra();
      }
    };

    // RENDER
    function rerender() {
      if (!state.user) return;

      // Update view buttons
      document.querySelectorAll(".view-btn").forEach(btn => {
        if (btn.dataset.view === VIEW) {
          btn.classList.remove("btn-soft");
          btn.classList.add("btn-dark");
        } else {
          btn.classList.remove("btn-dark");
          btn.classList.add("btn-soft");
        }
      });

      // Show/hide views
      document.querySelectorAll(".view-content").forEach(el => {
        el.classList.add("hidden");
      });
      $(`view-${VIEW}`)?.classList.remove("hidden");

      // Views que não precisam de OBRA_ID
      if (VIEW === "OBRAS") {
        renderObrasView();
        return;
      }

      if (VIEW === "BALANCO_GLOBAL") {
        renderBalancoGlobal();
        return;
      }

      // Outras views precisam de uma obra selecionada
      if (!OBRA_ID) {
        showToast('Selecione uma obra primeiro', 'warning');
        VIEW = "OBRAS";
        rerender();
        return;
      }

      // Read filters
      filterText = $("filter-text")?.value?.trim().toLowerCase() || "";
      filterCategoria = $("filter-categoria")?.value || "TODAS";
      filterFornecedor = $("filter-fornecedor")?.value || "TODOS";
      filterPeriodo = $("filter-periodo")?.value || "TODOS";
      filterStatus = $("filter-status")?.value || "TODOS";

      // Render specific view
      if (VIEW === "DASHBOARD") {
        renderDashboard();
      } else if (VIEW === "LANCAMENTOS") {
        renderLancamentosView();
      } else if (VIEW === "RATEIOS") {
        renderRateiosView();
      } else if (VIEW === "RECEBIMENTOS") {
        renderRecebimentosView();
      } else if (VIEW === "ACERTOS") {
        renderAcertosView();
      } else if (VIEW === "CONFIG") {
        renderConfigView();
      }

      // Render modals
      renderObrasModal();
      renderUnidadesModal();
      renderFornecedoresModal();
      renderCategoriasModal();
    }

    // FILTER FUNCTIONS
    function getLancamentosFiltrados() {
      let lancs = [...state.lancamentos];

      // Período
      if (filterPeriodo !== "TODOS") {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);

        lancs = lancs.filter(l => {
          const dataLanc = new Date(l.dataCompetencia || l.data);
          switch(filterPeriodo) {
            case "MES_ATUAL": return dataLanc >= inicioMes;
            case "MES_ANTERIOR": return dataLanc >= inicioMesAnterior && dataLanc < inicioMes;
            case "TRIMESTRE": return dataLanc >= inicioTrimestre;
            case "ANO": return dataLanc >= inicioAno;
            default: return true;
          }
        });
      }

      // Status
      if (filterStatus !== "TODOS") {
        lancs = lancs.filter(l => (l.status || "pendente") === filterStatus);
      }

      // Categoria
      if (filterCategoria !== "TODAS") {
        lancs = lancs.filter(l => l.categoriaId === filterCategoria);
      }

      // Fornecedor
      if (filterFornecedor !== "TODOS") {
        lancs = lancs.filter(l => l.fornecedorId === filterFornecedor);
      }

      // Busca textual
      if (filterText) {
        lancs = lancs.filter(l => {
          const forn = state.fornecedores.find(f => f.id === l.fornecedorId)?.nome || "";
          const cat = state.categorias.find(c => c.id === l.categoriaId)?.nome || "";
          return forn.toLowerCase().includes(filterText) ||
                 cat.toLowerCase().includes(filterText) ||
                 (l.descricao || "").toLowerCase().includes(filterText);
        });
      }

      return lancs;
    }

    function getRateiosFiltrados() {
      let rats = [...state.rateios];

      // Período
      if (filterPeriodo !== "TODOS") {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);

        rats = rats.filter(r => {
          const dataRat = new Date(r.dataCompetencia || r.data);
          switch(filterPeriodo) {
            case "MES_ATUAL": return dataRat >= inicioMes;
            case "MES_ANTERIOR": return dataRat >= inicioMesAnterior && dataRat < inicioMes;
            case "TRIMESTRE": return dataRat >= inicioTrimestre;
            case "ANO": return dataRat >= inicioAno;
            default: return true;
          }
        });
      }

      // Status
      if (filterStatus !== "TODOS") {
        rats = rats.filter(r => (r.status || "pendente") === filterStatus);
      }

      return rats;
    }

    // VIEW DE BALANÇO GLOBAL
    async function renderBalancoGlobal() {
      const container = $("balanco-global-content");
      if (!container) return;
      
      container.innerHTML = '<div class="text-center py-8"><div class="loader"></div><p class="mt-4 text-gray-600">Calculando balanço global...</p></div>';
      
      const balancoPorSocio = {};
      
      // Filtros de data
      const dataInicio = $("balanco-data-inicio")?.value;
      const dataFim = $("balanco-data-fim")?.value;

      // Inicializar saldos para cada sócio
      state.socios.forEach(socio => {
        balancoPorSocio[socio.id] = {
          nome: socio.nome,
          totalInvestido: 0,      // Custos pagos
          totalRecebido: 0,        // Receitas recebidas
          vgvPrevisto: 0,          // Valor geral de vendas previsto
          vendasConfirmadas: 0,    // Vendas realmente fechadas
          equalizacoes: [],        // Equalização por obra
          obras: []                // Detalhamento por obra
        };
      });

      // Para cada obra, carregar dados e calcular
      for (const obra of state.obras) {
        // Aplicar filtro de data se existir
        if (dataInicio && obra.dataInicio && obra.dataInicio < dataInicio) continue;
        if (dataFim && obra.dataInicio && obra.dataInicio > dataFim) continue;
        
        const obraInfo = {
          nome: obra.nome,
          dataInicio: obra.dataInicio,
          custos: 0,
          receitas: 0,
          vgv: 0
        };

        try {
          console.log(`📊 Processando obra: ${obra.nome} (ID: ${obra.id})`);
          
          // Carregar unidades da obra
          const unidadesSnap = await getDocs(collection(db, "obras", obra.id, "unidades"));
          const unidades = unidadesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`  📦 ${unidades.length} unidades encontradas`);

          // Carregar lançamentos (custos)
          const lancamentosSnap = await getDocs(collection(db, "obras", obra.id, "lancamentos"));
          const lancamentos = lancamentosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`  💳 ${lancamentos.length} lançamentos encontrados`);

          // Carregar rateios
          const rateiosSnap = await getDocs(collection(db, "obras", obra.id, "rateios"));
          const rateios = rateiosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`  ⚖️ ${rateios.length} rateios encontrados`);

          // Carregar recebimentos (receitas)
          const recebimentosSnap = await getDocs(collection(db, "obras", obra.id, "recebimentos"));
          const recebimentos = recebimentosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`  💰 ${recebimentos.length} recebimentos encontrados`);

          // Processar cada unidade
          unidades.forEach(unidade => {
            const proprietarioId = unidade.proprietario;
            console.log(`    🏠 Unidade: ${unidade.nome}, Proprietário ID: ${proprietarioId}`);
            
            if (!proprietarioId || !balancoPorSocio[proprietarioId]) {
              console.log(`      ⚠️ Proprietário não encontrado ou inválido`);
              return;
            }

            let custoUnidade = 0;
            let receitaUnidade = 0;

            // Custos diretos da unidade (lançamentos)
            lancamentos.forEach(l => {
              if (l.unidadeId === unidade.id) {
                custoUnidade += l.valor || 0;
                console.log(`      💳 Lançamento: R$ ${l.valor}`);
              }
            });

            // Custos rateados
            rateios.forEach(r => {
              if (r.distribuicao) {
                const dist = r.distribuicao.find(d => d.unidadeId === unidade.id);
                if (dist) {
                  const valorRateado = (dist.percentual / 100) * (r.valorTotal || 0);
                  custoUnidade += valorRateado;
                }
              }
            });

            // Receitas da unidade (recebimentos confirmados)
            recebimentos.forEach(rec => {
              if (rec.unidadeId === unidade.id) {
                receitaUnidade += rec.valor || 0;
                console.log(`      💰 Recebimento: R$ ${rec.valor}`);
              }
            });

            // VGV previsto da unidade
            const vgvUnidade = unidade.vgv || 0;
            
            console.log(`      📊 Total unidade - Custos: R$ ${custoUnidade}, Receitas: R$ ${receitaUnidade}, VGV: R$ ${vgvUnidade}`);
            
            // Acumular no sócio
            balancoPorSocio[proprietarioId].totalInvestido += custoUnidade;
            balancoPorSocio[proprietarioId].totalRecebido += receitaUnidade;
            balancoPorSocio[proprietarioId].vgvPrevisto += vgvUnidade;
            balancoPorSocio[proprietarioId].vendasConfirmadas += receitaUnidade;
            
            obraInfo.custos += custoUnidade;
            obraInfo.receitas += receitaUnidade;
            obraInfo.vgv += vgvUnidade;
          });

          // ✅ MIGRAÇÃO: Adicionar investimentos iniciais da obra (sistema antigo)
          if (obra.investimentoA && obra.socioAId && balancoPorSocio[obra.socioAId]) {
            const investA = obra.investimentoA || 0;
            console.log(`  💰 Investimento Inicial Sócio A: R$ ${investA}`);
            balancoPorSocio[obra.socioAId].totalInvestido += investA;
            obraInfo.custos += investA;
          }
          
          if (obra.investimentoB && obra.socioBId && balancoPorSocio[obra.socioBId]) {
            const investB = obra.investimentoB || 0;
            console.log(`  💰 Investimento Inicial Sócio B: R$ ${investB}`);
            balancoPorSocio[obra.socioBId].totalInvestido += investB;
            obraInfo.custos += investB;
          }

          // Adicionar obra no detalhamento
          Object.values(balancoPorSocio).forEach(socio => {
            if (obraInfo.custos > 0 || obraInfo.receitas > 0) {
              socio.obras.push(obraInfo);
            }
          });

        } catch (err) {
          console.error("❌ Erro ao processar obra:", obra.nome, err);
        }
      }

      // Renderizar HTML
      if (state.socios.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12">
            <div class="text-6xl mb-4">👔</div>
            <p class="text-gray-600">Nenhum sócio cadastrado ainda</p>
            <button onclick="openModal('modal-socios')" class="btn btn-green mt-4">Cadastrar Primeiro Sócio</button>
          </div>
        `;
        return;
      }
      
      // Calcular acertos consolidados
      const acertosConsolidados = [];
      if (state.socios.length >= 2) {
        for (let i = 0; i < state.socios.length; i++) {
          for (let j = i + 1; j < state.socios.length; j++) {
            const socioA = state.socios[i];
            const socioB = state.socios[j];
            const dadosA = balancoPorSocio[socioA.id];
            const dadosB = balancoPorSocio[socioB.id];
            
            const investidoA = dadosA.totalInvestido;
            const investidoB = dadosB.totalInvestido;
            const totalInvestido = investidoA + investidoB;
            const deveriaInvestirCada = totalInvestido / 2;
            const diferencaA = investidoA - deveriaInvestirCada;
            const diferencaB = investidoB - deveriaInvestirCada;
            
            let acertoValor = 0;
            let pagador = '';
            let recebedor = '';
            
            if (diferencaA > 0) {
              acertoValor = diferencaA;
              recebedor = socioA.nome;
              pagador = socioB.nome;
            } else if (diferencaB > 0) {
              acertoValor = diferencaB;
              recebedor = socioB.nome;
              pagador = socioA.nome;
            }
            
            if (acertoValor > 0) {
              acertosConsolidados.push({
                pagador,
                recebedor,
                valor: acertoValor,
                investidoA,
                investidoB,
                deveriaInvestirCada,
                socioANome: socioA.nome,
                socioBNome: socioB.nome
              });
            }
          }
        }
      }

      // Renderizar HTML

      const html = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${state.socios.map(socio => {
            const dados = balancoPorSocio[socio.id];
            const saldoAtual = dados.totalRecebido - dados.totalInvestido;
            
            // ROI Real (baseado em receitas confirmadas)
            const roiReal = dados.totalInvestido > 0 
              ? ((dados.totalRecebido - dados.totalInvestido) / dados.totalInvestido) * 100 
              : 0;
            
            // ROI Previsto (baseado no VGV previsto)
            const roiPrevisto = dados.totalInvestido > 0 
              ? ((dados.vgvPrevisto - dados.totalInvestido) / dados.totalInvestido) * 100 
              : 0;
            
            // Período (pegar menor dataInicio e data atual)
            const datasObras = dados.obras.map(o => o.dataInicio).filter(d => d);
            const dataMinima = datasObras.length > 0 
              ? new Date(Math.min(...datasObras.map(d => new Date(d)))).toLocaleDateString('pt-BR')
              : 'N/A';
            const dataAtual = new Date().toLocaleDateString('pt-BR');

            return `
              <div class="card p-6 ${saldoAtual >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-black text-2xl text-gray-800">👔 ${escapeHtml(socio.nome)}</h3>
                  ${saldoAtual >= 0 
                    ? '<span class="badge bg-green-100 text-green-800">Credor</span>' 
                    : '<span class="badge bg-red-100 text-red-800">Devedor</span>'}
                </div>
                
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div class="text-xs text-gray-600 mb-1">📅 Período de Análise</div>
                  <div class="font-bold text-gray-800">${dataMinima} até ${dataAtual}</div>
                </div>
                
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">💳 Total Investido:</span>
                    <span class="font-bold text-red-600">R$ ${dados.totalInvestido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">💰 Total Recebido:</span>
                    <span class="font-bold text-green-600">R$ ${dados.totalRecebido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="border-t-2 border-gray-300 pt-3 mt-3">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-gray-800">🎯 SALDO ATUAL:</span>
                      <span class="text-2xl font-black ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${saldoAtual >= 0 ? '+' : ''}R$ ${Math.abs(saldoAtual).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1 text-right">
                      ${saldoAtual > 0 
                        ? 'Tem a receber' 
                        : saldoAtual < 0 
                          ? 'Deve à sociedade' 
                          : 'Equalizado'}
                    </div>
                  </div>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="font-bold text-blue-900 mb-3">📈 Retorno sobre Investimento (ROI)</div>
                  
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-blue-700">✅ ROI Real:</span>
                      <span class="text-xl font-black ${roiReal >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${roiReal >= 0 ? '+' : ''}${roiReal.toFixed(1)}%
                      </span>
                    </div>
                    <div class="text-xs text-gray-600">Baseado em receitas confirmadas</div>
                    
                    <div class="border-t border-blue-200 pt-2 mt-2"></div>
                    
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-blue-700">🎯 ROI Previsto:</span>
                      <span class="text-xl font-black text-blue-600">
                        ${roiPrevisto >= 0 ? '+' : ''}${roiPrevisto.toFixed(1)}%
                      </span>
                    </div>
                    <div class="text-xs text-gray-600">Baseado no VGV planejado</div>
                  </div>
                </div>
                
                ${dados.obras.length > 0 ? `
                  <details class="mt-4">
                    <summary class="text-sm font-bold text-gray-700 cursor-pointer hover:text-blue-600">
                      📋 Detalhamento por Obra (${dados.obras.length})
                    </summary>
                    <div class="mt-3 space-y-2">
                      ${dados.obras.map(obra => `
                        <div class="text-xs p-2 bg-white border border-gray-200 rounded">
                          <div class="font-bold text-gray-800">${obra.nome}</div>
                          <div class="text-gray-600 mt-1">
                            Custos: R$ ${obra.custos.toLocaleString('pt-BR', {minimumFractionDigits: 2})} | 
                            Receitas: R$ ${obra.receitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </details>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        ${acertosConsolidados.length > 0 ? `
          <div class="card p-6 mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300">
            <h3 class="font-black text-2xl mb-4 text-blue-900">💡 Acerto Sugerido Consolidado</h3>
            <p class="text-sm text-gray-700 mb-4">Equalização considerando TODAS as obras</p>
            
            ${acertosConsolidados.map(acerto => `
              <div class="bg-white rounded-lg border-2 border-blue-400 p-6 mb-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="text-2xl font-black text-gray-800">
                    ${acerto.pagador} → ${acerto.recebedor}
                  </div>
                  <div class="text-3xl font-black text-blue-600">
                    R$ ${acerto.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                  <div class="font-bold text-blue-900 mb-2">📊 Cálculo detalhado:</div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-700">💳 ${acerto.socioANome} investiu:</span>
                    <span class="font-bold text-red-600">R$ ${acerto.investidoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-700">💳 ${acerto.socioBNome} investiu:</span>
                    <span class="font-bold text-red-600">R$ ${acerto.investidoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="border-t border-blue-200 pt-2 mt-2"></div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-700">💰 Total investido (ambos):</span>
                    <span class="font-bold text-purple-600">R$ ${(acerto.investidoA + acerto.investidoB).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="flex justify-between">
                    <span class="text-gray-700">⚖️ Cada um deveria ter investido (50/50):</span>
                    <span class="font-bold text-blue-600">R$ ${acerto.deveriaInvestirCada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div class="border-t border-blue-200 pt-2 mt-2"></div>
                  
                  <div class="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
                    <div class="font-bold text-yellow-900 mb-1">💡 Como equalizar:</div>
                    <div class="text-yellow-800">
                      <strong>${acerto.pagador}</strong> deve transferir 
                      <strong class="text-xl">R$ ${acerto.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> 
                      para <strong>${acerto.recebedor}</strong>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${state.socios.length === 0 ? `
          <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div class="text-6xl mb-4">📊</div>
            <p class="text-gray-600 mb-2">Nenhum dado para exibir</p>
            <p class="text-sm text-gray-500">Cadastre sócios e registre lançamentos para ver o balanço</p>
          </div>
        ` : ''}
      `;

      container.innerHTML = html;
    }
    
    function limparFiltrosBalanco() {
      $("balanco-data-inicio").value = '';
      $("balanco-data-fim").value = '';
      renderBalancoGlobal();
    }
    
    // Migração: Converter proprietarios antigos (A/B/ambos) para IDs de sócios
    window.migrarProprietariosParaIDs = async function() {
      if (!confirm('🔄 Migrar unidades do formato antigo (A/B/ambos) para IDs de sócios?\n\nIsso vai atualizar todas as unidades de todas as obras.')) {
        return;
      }
      
      showToast('🔄 Iniciando migração...', 'info');
      let totalMigrado = 0;
      
      try {
        for (const obra of state.obras) {
          console.log(`🔄 Migrando obra: ${obra.nome}`);
          
          // Pegar IDs dos sócios dessa obra
          const socioAId = obra.socioAId || null;
          const socioBId = obra.socioBId || null;
          
          if (!socioAId && !socioBId) {
            console.log(`  ⚠️ Obra sem sócios vinculados, pulando...`);
            continue;
          }
          
          // Carregar unidades
          const unidadesSnap = await getDocs(collection(db, "obras", obra.id, "unidades"));
          
          for (const unidadeDoc of unidadesSnap.docs) {
            const unidade = unidadeDoc.data();
            const proprietarioAtual = unidade.proprietario;
            let novoProprietario = null;
            
            // Converter formato antigo para novo
            if (proprietarioAtual === 'A' && socioAId) {
              novoProprietario = socioAId;
            } else if (proprietarioAtual === 'B' && socioBId) {
              novoProprietario = socioBId;
            } else if (proprietarioAtual === 'ambos') {
              // Se for "ambos", vamos colocar o sócio A como padrão
              novoProprietario = socioAId || socioBId;
            }
            
            // Atualizar se mudou
            if (novoProprietario && novoProprietario !== proprietarioAtual) {
              await updateDoc(doc(db, "obras", obra.id, "unidades", unidadeDoc.id), {
                proprietario: novoProprietario
              });
              console.log(`  ✅ Unidade "${unidade.nome}": ${proprietarioAtual} → ${novoProprietario}`);
              totalMigrado++;
            }
          }
        }
        
        showToast(`✅ Migração concluída! ${totalMigrado} unidades atualizadas.`, 'success');
        
        // Recarregar balanço
        setTimeout(() => {
          renderBalancoGlobal();
        }, 1000);
        
      } catch (err) {
        console.error('❌ Erro na migração:', err);
        showToast('❌ Erro ao migrar. Veja o console.', 'error');
      }
    }

    let editandoObraId = null; // Flag para evitar loop infinito
    
    window.editarObra = async (obraId) => {
      // PROTEÇÃO: evitar chamadas repetidas
      if (editandoObraId === obraId) {
        console.log("⚠️ editarObra já em execução para:", obraId);
        return;
      }
      editandoObraId = obraId;
      
      const obra = state.obras.find(o => o.id === obraId);
      if (!obra) {
        showToast('Obra não encontrada', 'error');
        editandoObraId = null;
        return;
      }

      // Preencher modal com dados da obra
      $("obra-nome").value = obra.nome || '';
      $("obra-endereco").value = obra.endereco || '';
      $("obra-data-inicio").value = obra.dataInicio || '';
      $("obra-data-recebimento").value = obra.dataRecebimento || '';
      
      // Preencher sócios (suporta novo formato com IDs e legado com nomes)
      if (obra.socioAId) {
        // Novo formato: usar ID
        $("obra-socio-a").value = obra.socioAId;
      } else if (obra.socioA) {
        // Formato legado: tentar encontrar sócio pelo nome
        const socioA = state.socios.find(s => s.nome === obra.socioA);
        $("obra-socio-a").value = socioA ? socioA.id : '';
      }
      
      if (obra.socioBId) {
        // Novo formato: usar ID
        $("obra-socio-b").value = obra.socioBId;
      } else if (obra.socioB) {
        // Formato legado: tentar encontrar sócio pelo nome
        const socioB = state.socios.find(s => s.nome === obra.socioB);
        $("obra-socio-b").value = socioB ? socioB.id : '';
      }

      // Mudar título do modal
      document.querySelector("#modal-obra .font-black").textContent = "✏️ Editar Obra";
      
      // Mudar botão para "Salvar Alterações"
      const btnSubmit = $("obra-submit-btn");
      btnSubmit.textContent = "Salvar Alterações";
      btnSubmit.onclick = async (e) => {
        e.preventDefault();
        await salvarEdicaoObra(obraId);
      };

      // Verificar se modal está aberto, se não estiver, abrir
      const modal = $("modal-obra");
      const isOpen = modal.classList.contains("flex");
      if (!isOpen) {
        console.log("🔓 Modal fechado, abrindo...");
        openModal("modal-obra");
      }
      
      console.log("✏️ Modo edição ativado para:", obra.nome);
      
      // Resetar flag após 100ms
      setTimeout(() => { editandoObraId = null; }, 100);
    };

    async function salvarEdicaoObra(obraId) {
      const nome = $("obra-nome").value.trim();
      const endereco = $("obra-endereco").value.trim();
      const dataInicio = $("obra-data-inicio").value;
      const dataRecebimento = $("obra-data-recebimento").value;
      const socioAId = $("obra-socio-a").value;
      const socioBId = $("obra-socio-b").value;

      if (!nome) {
        showToast('Digite o nome da obra', 'warning');
        return;
      }
      
      if (!socioAId) {
        showToast('⚠️ Selecione pelo menos o Sócio A', 'warning');
        return;
      }

      try {
        // Pegar nomes dos sócios para compatibilidade
        const socioA = state.socios.find(s => s.id === socioAId);
        const socioB = socioBId ? state.socios.find(s => s.id === socioBId) : null;
        
        const obraRef = doc(db, "obras", obraId);
        await updateDoc(obraRef, {
          nome,
          endereco: endereco || null,
          dataInicio: dataInicio || null,
          dataRecebimento: dataRecebimento || null,
          // IDs dos sócios (novo formato)
          socioAId: socioAId,
          socioBId: socioBId || null,
          // Nomes dos sócios (compatibilidade)
          socioA: socioA ? socioA.nome : 'Sócio A',
          socioB: socioB ? socioB.nome : null,
          updatedAt: serverTimestamp(),
          updatedBy: state.user.email
        });

        showToast('✅ Obra atualizada com sucesso!', 'success');
        closeModal("modal-obra");
        
        // Resetar modal para modo criação
        resetarModalObra();
      } catch (err) {
        console.error(err);
        showToast('Erro ao atualizar obra', 'error');
      }
    }

    function resetarModalObra() {
      editandoObraId = null; // Resetar flag de edição
      document.querySelector("#modal-obra .font-black").textContent = "🏗️ Nova Obra";
      const btnSubmit = $("obra-submit-btn");
      btnSubmit.textContent = "Criar Obra";
      btnSubmit.onclick = null;
      document.getElementById("obra-form").reset();
    }

    window.deletarObra = async (obraId) => {
      if (!confirm('Tem certeza que deseja deletar esta obra? Todos os dados serão perdidos!')) return;
      
      try {
        await deleteDoc(doc(db, "obras", obraId));
        showToast('Obra deletada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar obra', 'error');
      }
    };

    // GESTÃO DE SÓCIOS (ADMIN ONLY)
    window.gerenciarSocios = () => {
      if (!isAdmin()) {
        showToast('❌ Apenas administradores podem gerenciar sócios', 'error');
        return;
      }
      
      renderListaSocios();
      openModal("modal-socios");
    };

    function renderListaSocios() {
      if (!$("lista-socios")) return;
      
      if (state.socios.length === 0) {
        $("lista-socios").innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <div class="text-4xl mb-2">👔</div>
            <p>Nenhum sócio cadastrado ainda</p>
            <p class="text-sm mt-1">Adicione sócios acima para usar no sistema</p>
          </div>
        `;
        return;
      }

      const html = state.socios.map((s, idx) => `
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex-1">
            <div class="font-bold text-gray-800">${escapeHtml(s.nome)}</div>
            <div class="text-sm text-gray-600">ID: ${s.id}</div>
          </div>
          <button onclick="window.removerSocio('${s.id}')" class="btn btn-danger text-sm">
            🗑️ Remover
          </button>
        </div>
      `).join('');

      $("lista-socios").innerHTML = html;
    }

    function hydrateSociosSelect() {
      const select = $("add-usuario-socio");
      if (!select) return;
      
      if (state.socios.length === 0) {
        select.innerHTML = '<option value="">Cadastre sócios primeiro (⚙️ Config)</option>';
        return;
      }

      select.innerHTML = `
        <option value="">Selecione...</option>
        ${state.socios.map(s => `<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('')}
      `;
    }

    window.removerSocio = async (socioId) => {
      if (!isAdmin()) return;

      const socio = state.socios.find(s => s.id === socioId);
      if (!socio) return;

      if (!confirm(`Remover o sócio "${socio.nome}"?\n\nAtenção: Usuários vinculados a este sócio perderão a referência.`)) return;

      try {
        await deleteDoc(doc(db, "socios", socioId));
        showToast('Sócio removido com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao remover sócio', 'error');
      }
    };

    $("form-add-socio").onsubmit = async (e) => {
      e.preventDefault();
      
      if (!isAdmin()) {
        showToast('❌ Apenas administradores podem adicionar sócios', 'error');
        return;
      }

      const nome = $("add-socio-nome").value.trim();

      if (!nome) {
        showToast('Preencha o nome do sócio', 'warning');
        return;
      }

      try {
        await addDoc(collection(db, "socios"), {
          nome: nome,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });

        $("form-add-socio").reset();
        showToast(`✅ Sócio "${nome}" adicionado com sucesso!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao adicionar sócio', 'error');
      }
    };

    // GESTÃO DE USUÁRIOS (ADMIN ONLY)
    let CURRENT_OBRA_USUARIOS = null;

    window.gerenciarUsuarios = (obraId) => {
      if (!isAdmin()) {
        showToast('❌ Apenas administradores podem gerenciar usuários', 'error');
        return;
      }

      CURRENT_OBRA_USUARIOS = obraId;
      const obra = state.obras.find(o => o.id === obraId);
      if (!obra) return;

      $("modal-usuarios-obra-nome").textContent = `Obra: ${obra.nome}`;
      renderListaUsuarios(obra);
      openModal("modal-usuarios");
    };

    function renderListaUsuarios(obra) {
      const usuarios = obra.usuarios || [];
      
      if (usuarios.length === 0) {
        $("lista-usuarios").innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <div class="text-4xl mb-2">👥</div>
            <p>Nenhum usuário vinculado ainda</p>
            <p class="text-sm mt-1">Adicione usuários acima para conceder acesso</p>
          </div>
        `;
        return;
      }

      const html = usuarios.map((u, idx) => {
        const socio = state.socios.find(s => s.id === u.socioId);
        const socioNome = socio ? socio.nome : `Sócio ${u.socioId}`;
        
        return `
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex-1">
            <div class="font-bold text-gray-800">${escapeHtml(u.email)}</div>
            <div class="text-sm text-gray-600">${escapeHtml(socioNome)} • ${u.role || 'socio'}</div>
          </div>
          <button onclick="window.removerUsuario(${idx})" class="btn btn-danger text-sm">
            🗑️ Remover
          </button>
        </div>
      `;
      }).join('');

      $("lista-usuarios").innerHTML = html;
    }

    window.removerUsuario = async (index) => {
      if (!isAdmin()) return;

      const obra = state.obras.find(o => o.id === CURRENT_OBRA_USUARIOS);
      if (!obra) return;

      const usuarios = obra.usuarios || [];
      const usuario = usuarios[index];

      if (!confirm(`Remover acesso de ${usuario.email}?`)) return;

      try {
        usuarios.splice(index, 1);
        await updateDoc(doc(db, "obras", CURRENT_OBRA_USUARIOS), {
          usuarios: usuarios
        });
        
        renderListaUsuarios({ ...obra, usuarios });
        showToast('Usuário removido com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao remover usuário', 'error');
      }
    };

    $("form-add-usuario").onsubmit = async (e) => {
      e.preventDefault();
      
      if (!isAdmin()) {
        showToast('❌ Apenas administradores podem adicionar usuários', 'error');
        return;
      }

      const email = $("add-usuario-email").value.trim().toLowerCase();
      const socioId = $("add-usuario-socio").value;

      if (!email || !socioId) {
        showToast('Preencha todos os campos', 'warning');
        return;
      }

      try {
        const obra = state.obras.find(o => o.id === CURRENT_OBRA_USUARIOS);
        if (!obra) return;

        const usuarios = obra.usuarios || [];
        
        // Verificar se já existe
        if (usuarios.some(u => u.email === email)) {
          showToast('Este usuário já tem acesso a esta obra', 'warning');
          return;
        }

        // Adicionar novo usuário
        usuarios.push({
          email: email,
          socioId: socioId,
          role: ROLES.SOCIO,
          addedAt: new Date().toISOString(),
          addedBy: state.user.email
        });

        await updateDoc(doc(db, "obras", CURRENT_OBRA_USUARIOS), {
          usuarios: usuarios
        });

        $("form-add-usuario").reset();
        renderListaUsuarios({ ...obra, usuarios });
        showToast(`✅ Acesso concedido para ${email}`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao adicionar usuário', 'error');
      }
    };

    // DASHBOARD
    function renderDashboard() {
      renderAlertasVencimento();
      
      const lancs = getLancamentosFiltrados();
      const rats = getRateiosFiltrados();
      
      const custoTotal = computeCustoTotal(lancs, rats);
      const lucroData = computeLucro(lancs, rats);
      const equalizacao = computeEqualizacao();
      
      // Calcular recebimentos
      const totalRecebido = state.recebimentos.reduce((sum, r) => sum + (r.valor || 0), 0);
      const aReceber = lucroData.vgvTotal - totalRecebido;
      const fluxoCaixa = totalRecebido - custoTotal;

      // KPIs
      const kpisHTML = `
        <div class="card p-6">
          <div class="text-xs muted mb-2">💰 CUSTO TOTAL</div>
          <div class="text-3xl font-black">R$ ${custoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div class="card p-6">
          <div class="text-xs muted mb-2">💎 VGV PREVISTO</div>
          <div class="text-3xl font-black">R$ ${lucroData.vgvTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div class="card p-6">
          <div class="text-xs muted mb-2">💵 RECEBIDO</div>
          <div class="text-3xl font-black ok">R$ ${totalRecebido.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="text-xs muted mt-2">A receber: R$ ${aReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div class="card p-6">
          <div class="text-xs muted mb-2">🏦 FLUXO DE CAIXA</div>
          <div class="text-3xl font-black ${fluxoCaixa >= 0 ? 'ok' : 'danger'}">R$ ${fluxoCaixa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="text-xs muted mt-2">${fluxoCaixa >= 0 ? 'Positivo' : 'Negativo'}</div>
        </div>
        <div class="card p-6">
          <div class="text-xs muted mb-2">📊 LUCRO BRUTO</div>
          <div class="text-3xl font-black ${lucroData.lucroBruto >= 0 ? 'ok' : 'danger'}">R$ ${lucroData.lucroBruto.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div class="card p-6">
          <div class="text-xs muted mb-2">💵 LUCRO LÍQUIDO</div>
          <div class="text-3xl font-black ${lucroData.lucroLiquido >= 0 ? 'ok' : 'danger'}">R$ ${lucroData.lucroLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
      `;
      $("kpis-grid").innerHTML = kpisHTML;

      // Nova seção: Análise Detalhada por Unidade e Sócio
      renderAnaliseDetalhada(lancs, rats);

      // Métricas de Rentabilidade
      renderROISection(custoTotal, lucroData, totalRecebido);

      // Gráficos Interativos
      renderCharts();

      // Custo por m²
      renderCustoM2(lancs, rats);

      // Top categorias
      renderTopCategorias(lancs, rats);

      // Top fornecedores
      renderTopFornecedores(lancs, rats);

      // Lucro por sócio
      renderLucroSection(lucroData);

      // Equalização
      renderEqualizacaoSection();

      // Hydrate filter selects
      hydrateFilterSelects();
    }

    function renderAlertasVencimento() {
      const hoje = new Date();
      const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

      const lancamentosPendentes = state.lancamentos.filter(l => {
        if ((l.status || "pendente") === "pago" || !l.dataVencimento) return false;
        const venc = new Date(l.dataVencimento);
        return venc <= em7Dias;
      });

      const rateiosPendentes = state.rateios.filter(r => {
        if ((r.status || "pendente") === "pago" || !r.dataVencimento) return false;
        const venc = new Date(r.dataVencimento);
        return venc <= em7Dias;
      });

      const vencidos = [...lancamentosPendentes, ...rateiosPendentes].filter(item => {
        return new Date(item.dataVencimento) < hoje;
      });

      const vencendoEmBreve = [...lancamentosPendentes, ...rateiosPendentes].filter(item => {
        const venc = new Date(item.dataVencimento);
        return venc >= hoje && venc <= em7Dias;
      });

      const container = $("alertas-vencimento");
      if (vencidos.length === 0 && vencendoEmBreve.length === 0) {
        container.innerHTML = "";
        return;
      }

      let html = "";

      if (vencidos.length > 0) {
        const valorTotal = vencidos.reduce((sum, item) => sum + (item.valor || item.valorTotal), 0);
        html += `
          <div class="alert alert-danger">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-red-800 text-lg">🚨 ${vencidos.length} Pagamento(s) Vencido(s)</h4>
                <p class="text-sm text-red-700 mt-1">Total: R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>
          </div>
        `;
      }

      if (vencendoEmBreve.length > 0) {
        const valorTotal = vencendoEmBreve.reduce((sum, item) => sum + (item.valor || item.valorTotal), 0);
        html += `
          <div class="alert alert-warning">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-yellow-800 text-lg">⚠️ ${vencendoEmBreve.length} Pagamento(s) Vencendo em 7 Dias</h4>
                <p class="text-sm text-yellow-700 mt-1">Total: R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    }

    function renderROISection(custoTotal, lucroData, totalRecebido) {
      const obra = state.obras.find(o => o.id === OBRA_ID);
      if (!obra) {
        $("roi-section").innerHTML = "";
        return;
      }

      // Calcular valores reais vs previstos
      const vgvPrevisto = state.unidades.reduce((sum, u) => sum + (u.vgvPrevisto || 0), 0);
      const vgvReal = state.unidades.reduce((sum, u) => sum + (u.valorVenda || u.vgvPrevisto || 0), 0);
      const diferencaVGV = vgvReal - vgvPrevisto;
      const percentualVGV = vgvPrevisto > 0 ? ((vgvReal / vgvPrevisto - 1) * 100) : 0;

      // Calcular tempo de operação
      let diasOperacao = null;
      let mesesOperacao = null;
      let dataInicioFormatada = null;
      let dataRecebimentoFormatada = null;

      if (obra.dataInicio) {
        const inicio = new Date(obra.dataInicio);
        const fim = obra.dataRecebimento ? new Date(obra.dataRecebimento) : new Date();
        diasOperacao = Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
        mesesOperacao = diasOperacao / 30;
        
        dataInicioFormatada = inicio.toLocaleDateString('pt-BR');
        dataRecebimentoFormatada = obra.dataRecebimento 
          ? new Date(obra.dataRecebimento).toLocaleDateString('pt-BR')
          : "Em andamento";
      }

      // Calcular ROI
      const lucroLiquidoReal = vgvReal - custoTotal - lucroData.valorDeducoes;
      const roiPercentual = custoTotal > 0 ? ((lucroLiquidoReal / custoTotal) * 100) : 0;
      const roiMensal = mesesOperacao > 0 ? (roiPercentual / mesesOperacao) : 0;

      // Análise por sócio (assumindo 50/50)
      const investimentoPorSocio = custoTotal / 2;
      const lucroPorSocio = lucroLiquidoReal / 2;
      const roiPorSocio = investimentoPorSocio > 0 ? ((lucroPorSocio / investimentoPorSocio) * 100) : 0;

      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";

      const html = `
        <div class="card p-6">
          <div class="font-black text-lg mb-4">📈 Análise de Rentabilidade da Operação</div>
          
          <!-- VGV Previsto vs Real -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div class="text-xs font-bold text-blue-800 mb-1">💎 VGV PREVISTO</div>
              <div class="text-2xl font-black text-blue-600">R$ ${vgvPrevisto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div class="text-xs text-blue-700 mt-1">Estimativa inicial</div>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div class="text-xs font-bold text-green-800 mb-1">💰 VALOR REAL DE VENDA</div>
              <div class="text-2xl font-black text-green-600">R$ ${vgvReal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div class="text-xs text-green-700 mt-1">Valores negociados</div>
            </div>
            <div class="bg-gradient-to-br from-${diferencaVGV >= 0 ? 'green' : 'red'}-50 to-${diferencaVGV >= 0 ? 'green' : 'red'}-100 border border-${diferencaVGV >= 0 ? 'green' : 'red'}-200 rounded-lg p-4">
              <div class="text-xs font-bold text-${diferencaVGV >= 0 ? 'green' : 'red'}-800 mb-1">${diferencaVGV >= 0 ? '📊' : '📉'} VARIAÇÃO</div>
              <div class="text-2xl font-black text-${diferencaVGV >= 0 ? 'green' : 'red'}-600">${diferencaVGV >= 0 ? '+' : ''}${percentualVGV.toFixed(2)}%</div>
              <div class="text-xs text-${diferencaVGV >= 0 ? 'green' : 'red'}-700 mt-1">R$ ${diferencaVGV >= 0 ? '+' : ''}${diferencaVGV.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          <!-- Tempo de Operação -->
          ${diasOperacao !== null ? `
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div class="text-xs font-bold text-purple-800 mb-1">📅 INÍCIO DA CONSTRUÇÃO</div>
                  <div class="text-xl font-black text-purple-600">${dataInicioFormatada}</div>
                </div>
                <div>
                  <div class="text-xs font-bold text-purple-800 mb-1">📅 RECEBIMENTO</div>
                  <div class="text-xl font-black text-purple-600">${dataRecebimentoFormatada}</div>
                </div>
                <div>
                  <div class="text-xs font-bold text-purple-800 mb-1">⏱️ TEMPO DE OPERAÇÃO</div>
                  <div class="text-xl font-black text-purple-600">${diasOperacao} dias</div>
                  <div class="text-xs text-purple-700 mt-1">(${mesesOperacao.toFixed(1)} meses)</div>
                </div>
              </div>
            </div>
          ` : `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
              <p class="text-sm text-yellow-800">⚠️ Configure as datas de início e recebimento em <b>🏗️ Obras</b> para ver métricas de tempo</p>
            </div>
          `}

          <!-- ROI Geral -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div class="text-xs font-bold text-orange-800 mb-1">💰 INVESTIMENTO TOTAL</div>
              <div class="text-xl font-black text-orange-600">R$ ${custoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div class="text-xs text-orange-700 mt-1">Custo da obra</div>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div class="text-xs font-bold text-green-800 mb-1">💵 LUCRO LÍQUIDO</div>
              <div class="text-xl font-black text-green-600">R$ ${lucroLiquidoReal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
              <div class="text-xs text-green-700 mt-1">Após deduções</div>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div class="text-xs font-bold text-blue-800 mb-1">📊 ROI TOTAL</div>
              <div class="text-3xl font-black text-blue-600">${roiPercentual.toFixed(2)}%</div>
              <div class="text-xs text-blue-700 mt-1">Retorno sobre investimento</div>
            </div>
            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4">
              <div class="text-xs font-bold text-indigo-800 mb-1">📈 ROI MENSAL</div>
              <div class="text-3xl font-black text-indigo-600">${mesesOperacao > 0 ? roiMensal.toFixed(2) + '%' : '-'}</div>
              <div class="text-xs text-indigo-700 mt-1">${mesesOperacao > 0 ? 'Rentabilidade ao mês' : 'Configure datas'}</div>
            </div>
          </div>

          <!-- Análise por Sócio -->
          <div class="border-t pt-4">
            <div class="font-bold text-gray-800 mb-3">👥 Análise Individual por Sócio (50/50)</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Sócio A -->
              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 class="font-bold text-gray-800 mb-3 text-lg">👤 ${escapeHtml(socioA)}</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">💰 Investimento:</span>
                    <span class="font-bold">R$ ${investimentoPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">💵 Lucro Líquido:</span>
                    <span class="font-bold text-green-600">R$ ${lucroPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between border-t pt-2">
                    <span class="text-gray-600">📊 ROI Individual:</span>
                    <span class="font-bold text-blue-600 text-xl">${roiPorSocio.toFixed(2)}%</span>
                  </div>
                  ${mesesOperacao > 0 ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">📈 ROI Mensal:</span>
                      <span class="font-bold text-indigo-600">${roiMensal.toFixed(2)}%/mês</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">💰 Lucro/Mês:</span>
                      <span class="font-bold text-green-600">R$ ${(lucroPorSocio / mesesOperacao).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Sócio B -->
              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 class="font-bold text-gray-800 mb-3 text-lg">👤 ${escapeHtml(socioB)}</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">💰 Investimento:</span>
                    <span class="font-bold">R$ ${investimentoPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">💵 Lucro Líquido:</span>
                    <span class="font-bold text-green-600">R$ ${lucroPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div class="flex justify-between border-t pt-2">
                    <span class="text-gray-600">📊 ROI Individual:</span>
                    <span class="font-bold text-blue-600 text-xl">${roiPorSocio.toFixed(2)}%</span>
                  </div>
                  ${mesesOperacao > 0 ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">📈 ROI Mensal:</span>
                      <span class="font-bold text-indigo-600">${roiMensal.toFixed(2)}%/mês</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">💰 Lucro/Mês:</span>
                      <span class="font-bold text-green-600">R$ ${(lucroPorSocio / mesesOperacao).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          ${mesesOperacao > 0 ? `
            <div class="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
              <div class="text-center">
                <div class="text-sm font-bold text-gray-700 mb-2">💡 Resumo da Operação</div>
                <div class="text-lg text-gray-800">
                  Investimento de <span class="font-black text-orange-600">R$ ${custoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> 
                  gerou lucro líquido de <span class="font-black text-green-600">R$ ${lucroLiquidoReal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> 
                  em <span class="font-black text-purple-600">${mesesOperacao.toFixed(1)} meses</span>, 
                  representando <span class="font-black text-blue-600">${roiPercentual.toFixed(2)}%</span> de retorno total 
                  (<span class="font-black text-indigo-600">${roiMensal.toFixed(2)}%/mês</span>)
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      $("roi-section").innerHTML = html;
    }

    // Gráficos Interativos com Chart.js
    let chartInstances = {};

    function renderCharts() {
      if (typeof Chart === 'undefined') return;

      // Destruir gráficos existentes
      Object.values(chartInstances).forEach(chart => chart?.destroy());
      chartInstances = {};

      const theme = document.body.getAttribute('data-theme') || 'light';
      const isDark = theme === 'dark';
      const textColor = isDark ? '#f1f5f9' : '#0f172a';
      const gridColor = isDark ? '#475569' : '#e2e8f0';

      // 1. Evolução de Custos no Tempo
      renderCustosTempoChart(textColor, gridColor);
      
      // 2. Distribuição por Categoria (Pie)
      renderCategoriasPieChart(textColor);
      
      // 3. Fluxo de Caixa Projetado
      renderFluxoCaixaChart(textColor, gridColor);
      
      // 4. ROI Comparativo (Bar)
      renderROIBarChart(textColor, gridColor);
    }

    function renderCustosTempoChart(textColor, gridColor) {
      const canvas = document.getElementById('chart-custos-tempo');
      if (!canvas) return;

      // Agrupar lançamentos por mês
      const custosPorMes = {};
      state.lancamentos.forEach(l => {
        const mes = l.data.substring(0, 7); // YYYY-MM
        custosPorMes[mes] = (custosPorMes[mes] || 0) + l.valor;
      });
      
      state.rateios.forEach(r => {
        const mes = r.data.substring(0, 7);
        custosPorMes[mes] = (custosPorMes[mes] || 0) + r.valorTotal;
      });

      const meses = Object.keys(custosPorMes).sort();
      const valores = meses.map(m => custosPorMes[m]);
      
      // Acumulado
      const acumulado = [];
      let soma = 0;
      valores.forEach(v => {
        soma += v;
        acumulado.push(soma);
      });

      chartInstances.custosTempo = new Chart(canvas, {
        type: 'line',
        data: {
          labels: meses.map(m => {
            const [y, mo] = m.split('-');
            return `${mo}/${y}`;
          }),
          datasets: [{
            label: 'Custos Mensais',
            data: valores,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }, {
            label: 'Acumulado',
            data: acumulado,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } }
          },
          scales: {
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            }
          }
        }
      });
    }

    function renderCategoriasPieChart(textColor) {
      const canvas = document.getElementById('chart-categorias-pie');
      if (!canvas) return;

      const custoPorCategoria = {};
      state.lancamentos.forEach(l => {
        const cat = state.categorias.find(c => c.id === l.categoriaId);
        const nome = cat?.nome || 'Sem categoria';
        custoPorCategoria[nome] = (custoPorCategoria[nome] || 0) + l.valor;
      });

      state.rateios.forEach(r => {
        const cat = state.categorias.find(c => c.id === r.categoriaId);
        const nome = cat?.nome || 'Sem categoria';
        custoPorCategoria[nome] = (custoPorCategoria[nome] || 0) + r.valorTotal;
      });

      const sorted = Object.entries(custoPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const labels = sorted.map(([nome]) => nome);
      const data = sorted.map(([, valor]) => valor);
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
      ];

      chartInstances.categoriasPie = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: textColor }
            }
          }
        }
      });
    }

    function renderFluxoCaixaChart(textColor, gridColor) {
      const canvas = document.getElementById('chart-fluxo-caixa');
      if (!canvas) return;

      // Projetar próximos 6 meses
      const hoje = new Date();
      const meses = [];
      const entradas = [];
      const saidas = [];
      const saldo = [];

      const totalRecebido = state.recebimentos.reduce((sum, r) => sum + r.valor, 0);
      const custoTotal = computeCustoTotal(state.lancamentos, state.rateios);
      const lucroData = computeLucro();
      const aReceber = lucroData.vgvTotal - totalRecebido;

      let saldoAcumulado = totalRecebido - custoTotal;

      for (let i = 0; i < 6; i++) {
        const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const mesStr = `${String(mes.getMonth() + 1).padStart(2, '0')}/${mes.getFullYear()}`;
        meses.push(mesStr);

        // Simular entrada gradual do valor a receber
        const entradaMes = i === 0 ? totalRecebido : (aReceber / 6);
        entradas.push(entradaMes);

        // Custos projetados (média histórica)
        const custoMedio = custoTotal / Math.max(1, state.lancamentos.length / 10);
        saidas.push(i === 0 ? custoTotal : custoMedio);

        saldoAcumulado += (i === 0 ? 0 : (entradaMes - custoMedio));
        saldo.push(saldoAcumulado);
      }

      chartInstances.fluxoCaixa = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: meses,
          datasets: [{
            label: 'Entradas',
            data: entradas,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 2
          }, {
            label: 'Saídas',
            data: saidas,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#ef4444',
            borderWidth: 2
          }, {
            label: 'Saldo Acumulado',
            data: saldo,
            type: 'line',
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor } }
          },
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y1: {
              type: 'linear',
              position: 'right',
              ticks: { color: textColor },
              grid: { display: false }
            },
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            }
          }
        }
      });
    }

    function renderROIBarChart(textColor, gridColor) {
      const canvas = document.getElementById('chart-roi-bar');
      if (!canvas) return;

      const lucroData = computeLucro();
      const custoTotal = computeCustoTotal(state.lancamentos, state.rateios);
      const totalRecebido = state.recebimentos.reduce((sum, r) => sum + r.valor, 0);

      const roi = custoTotal > 0 ? ((lucroData.lucroLiquido / custoTotal) * 100) : 0;
      const margemBruta = lucroData.vgvTotal > 0 ? ((lucroData.lucroBruto / lucroData.vgvTotal) * 100) : 0;
      const margemLiquida = lucroData.vgvTotal > 0 ? ((lucroData.lucroLiquido / lucroData.vgvTotal) * 100) : 0;
      const percRecebido = lucroData.vgvTotal > 0 ? ((totalRecebido / lucroData.vgvTotal) * 100) : 0;

      chartInstances.roiBar = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['ROI (%)', 'Margem Bruta (%)', 'Margem Líquida (%)', '% Recebido'],
          datasets: [{
            label: 'Indicadores (%)',
            data: [roi, margemBruta, margemLiquida, percRecebido],
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(245, 158, 11, 0.7)'
            ],
            borderColor: [
              '#3b82f6',
              '#10b981',
              '#8b5cf6',
              '#f59e0b'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { 
                color: textColor,
                callback: (value) => value + '%'
              },
              grid: { color: gridColor }
            },
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            }
          }
        }
      });
    }

    function renderAnaliseDetalhada(lancs, rats) {
      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";
      const obra = state.obras.find(o => o.id === OBRA_ID);

      // Verificar permissões
      const meuSocioId = getSocioIdForUser(OBRA_ID);
      const somenteMinhaVisao = !isAdmin() && meuSocioId;

      // 1. Calcular custos por unidade
      const custosPorUnidade = {};
      
      // Lançamentos diretos
      lancs.forEach(l => {
        if (!l.unidadeId) return;
        if (!custosPorUnidade[l.unidadeId]) {
          custosPorUnidade[l.unidadeId] = {
            custoTotal: 0,
            pagoPorA: 0,
            pagoPorB: 0,
            receitas: 0,
            recebidoPorA: 0,
            recebidoPorB: 0
          };
        }
        
        custosPorUnidade[l.unidadeId].custoTotal += l.valor;
        
        // Quem pagou
        if (l.pagoPor === "A") {
          custosPorUnidade[l.unidadeId].pagoPorA += l.valor;
        } else if (l.pagoPor === "B") {
          custosPorUnidade[l.unidadeId].pagoPorB += l.valor;
        } else {
          // 50/50
          custosPorUnidade[l.unidadeId].pagoPorA += l.valor / 2;
          custosPorUnidade[l.unidadeId].pagoPorB += l.valor / 2;
        }
      });

      // Rateios distribuídos
      rats.forEach(r => {
        if (!r.distribuicao || r.distribuicao.length === 0) return;
        
        r.distribuicao.forEach(d => {
          if (!custosPorUnidade[d.unidadeId]) {
            custosPorUnidade[d.unidadeId] = {
              custoTotal: 0,
              pagoPorA: 0,
              pagoPorB: 0,
              receitas: 0,
              recebidoPorA: 0,
              recebidoPorB: 0
            };
          }
          
          const valorRateado = (d.percentual / 100) * r.valorTotal;
          custosPorUnidade[d.unidadeId].custoTotal += valorRateado;
          
          // Quem pagou
          if (r.pagoPor === "A") {
            custosPorUnidade[d.unidadeId].pagoPorA += valorRateado;
          } else if (r.pagoPor === "B") {
            custosPorUnidade[d.unidadeId].pagoPorB += valorRateado;
          } else {
            // 50/50
            custosPorUnidade[d.unidadeId].pagoPorA += valorRateado / 2;
            custosPorUnidade[d.unidadeId].pagoPorB += valorRateado / 2;
          }
        });
      });

      // 2. Calcular receitas por unidade
      state.recebimentos.forEach(rec => {
        if (!rec.unidadeId) return;
        
        if (!custosPorUnidade[rec.unidadeId]) {
          custosPorUnidade[rec.unidadeId] = {
            custoTotal: 0,
            pagoPorA: 0,
            pagoPorB: 0,
            receitas: 0,
            recebidoPorA: 0,
            recebidoPorB: 0
          };
        }
        
        custosPorUnidade[rec.unidadeId].receitas += rec.valor;
        
        // Quem recebeu fisicamente
        if (rec.recebidoPor === "A") {
          custosPorUnidade[rec.unidadeId].recebidoPorA += rec.valor;
        } else if (rec.recebidoPor === "B") {
          custosPorUnidade[rec.unidadeId].recebidoPorB += rec.valor;
        } else {
          // 50/50
          custosPorUnidade[rec.unidadeId].recebidoPorA += rec.valor / 2;
          custosPorUnidade[rec.unidadeId].recebidoPorB += rec.valor / 2;
        }
      });

      // 3. Calcular totais por sócio (considerando investimentos)
      const investimentoA = obra?.investimentoA || 0;
      const investimentoB = obra?.investimentoB || 0;
      
      let totalPagoA = investimentoA;
      let totalPagoB = investimentoB;
      let totalRecebidoA = 0;
      let totalRecebidoB = 0;
      
      Object.values(custosPorUnidade).forEach(u => {
        totalPagoA += u.pagoPorA;
        totalPagoB += u.pagoPorB;
        totalRecebidoA += u.recebidoPorA;
        totalRecebidoB += u.recebidoPorB;
      });

      const retornoA = totalRecebidoA - totalPagoA;
      const retornoB = totalRecebidoB - totalPagoB;
      const roiA = totalPagoA > 0 ? (retornoA / totalPagoA) * 100 : 0;
      const roiB = totalPagoB > 0 ? (retornoB / totalPagoB) * 100 : 0;

      // Calcular período e retorno mensal
      let mesesOperacao = 0;
      let retornoMensalA = 0;
      let retornoMensalB = 0;
      let periodoTexto = "";
      
      if (obra?.dataInicio) {
        const inicio = new Date(obra.dataInicio);
        const fim = obra.dataRecebimento ? new Date(obra.dataRecebimento) : new Date();
        const diasOperacao = Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
        mesesOperacao = Math.max(1, diasOperacao / 30);
        
        retornoMensalA = retornoA / mesesOperacao;
        retornoMensalB = retornoB / mesesOperacao;
        
        const inicioFormatado = inicio.toLocaleDateString('pt-BR');
        const fimFormatado = obra.dataRecebimento 
          ? new Date(obra.dataRecebimento).toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR');
        
        periodoTexto = `${inicioFormatado} até ${fimFormatado} (${mesesOperacao.toFixed(1)} meses)`;
      }

      // 4. Preparar dados das unidades
      const unidadesData = Object.entries(custosPorUnidade).map(([unidadeId, dados]) => {
        const unidade = state.unidades.find(u => u.id === unidadeId);
        const lucro = dados.receitas - dados.custoTotal;
        const roi = dados.custoTotal > 0 ? (lucro / dados.custoTotal) * 100 : 0;
        
        return {
          unidade,
          ...dados,
          lucro,
          roi
        };
      }).filter(u => u.unidade).sort((a, b) => b.custoTotal - a.custoTotal);

      // 5. Renderizar HTML
      const html = `
        <div class="card p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <div class="font-black text-lg">💼 Análise Financeira Detalhada ${somenteMinhaVisao ? '(Seus Dados)' : 'por Sócio'}</div>
            ${periodoTexto ? `<div class="text-sm text-gray-600">📅 ${periodoTexto}</div>` : ''}
          </div>
          
          ${somenteMinhaVisao ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="text-sm text-blue-800">
                👤 Visualizando apenas seus dados como <strong>${meuSocioId === 'A' ? socioA : socioB}</strong>
              </div>
            </div>
          ` : ''}
          
          <!-- Resumo por Sócio -->
          <div class="grid grid-cols-1 ${somenteMinhaVisao ? '' : 'md:grid-cols-2'} gap-4 mb-6">
            ${!somenteMinhaVisao || meuSocioId === 'A' ? `
            <!-- Sócio A -->
            <div class="border-2 ${retornoA >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'} rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 text-xl flex items-center gap-2">
                👤 ${escapeHtml(socioA)}
              </h4>
              <div class="space-y-2">
                ${investimentoA > 0 ? `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💼 Investimentos gerais:</span>
                  <span class="font-bold text-purple-600">R$ ${investimentoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                ` : ''}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💳 Total pago (custos + investimentos):</span>
                  <span class="font-bold text-red-600">R$ ${totalPagoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💰 Total recebido:</span>
                  <span class="font-bold text-green-600">R$ ${totalRecebidoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm pt-2 border-t-2">
                  <span class="text-gray-700 font-bold">🎯 Retorno líquido:</span>
                  <span class="font-black text-xl ${retornoA >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${retornoA >= 0 ? '+' : ''}R$ ${retornoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-700 font-bold">📊 ROI:</span>
                  <span class="font-black text-xl ${roiA >= 0 ? 'text-blue-600' : 'text-red-600'}">
                    ${roiA >= 0 ? '+' : ''}${roiA.toFixed(2)}%
                  </span>
                </div>
                ${mesesOperacao > 0 ? `
                <div class="flex justify-between text-sm border-t pt-2 mt-2">
                  <span class="text-gray-600">📈 Retorno/Mês:</span>
                  <span class="font-bold ${retornoMensalA >= 0 ? 'text-green-600' : 'text-red-600'}">
                    R$ ${retornoMensalA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">📊 ROI Mensal:</span>
                  <span class="font-bold text-indigo-600">
                    ${(roiA / mesesOperacao).toFixed(2)}%/mês
                  </span>
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            ${!somenteMinhaVisao || meuSocioId === 'B' ? `
            <!-- Sócio B -->
            <div class="border-2 ${retornoB >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'} rounded-lg p-4">
              <h4 class="font-bold text-gray-800 mb-3 text-xl flex items-center gap-2">
                👤 ${escapeHtml(socioB)}
              </h4>
              <div class="space-y-2">
                ${investimentoB > 0 ? `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💼 Investimentos gerais:</span>
                  <span class="font-bold text-purple-600">R$ ${investimentoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                ` : ''}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💳 Total pago (custos + investimentos):</span>
                  <span class="font-bold text-red-600">R$ ${totalPagoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">💰 Total recebido:</span>
                  <span class="font-bold text-green-600">R$ ${totalRecebidoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="flex justify-between text-sm pt-2 border-t-2">
                  <span class="text-gray-700 font-bold">🎯 Retorno líquido:</span>
                  <span class="font-black text-xl ${retornoB >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${retornoB >= 0 ? '+' : ''}R$ ${retornoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-700 font-bold">📊 ROI:</span>
                  <span class="font-black text-xl ${roiB >= 0 ? 'text-blue-600' : 'text-red-600'}">
                    ${roiB >= 0 ? '+' : ''}${roiB.toFixed(2)}%
                  </span>
                </div>
                ${mesesOperacao > 0 ? `
                <div class="flex justify-between text-sm border-t pt-2 mt-2">
                  <span class="text-gray-600">📈 Retorno/Mês:</span>
                  <span class="font-bold ${retornoMensalB >= 0 ? 'text-green-600' : 'text-red-600'}">
                    R$ ${retornoMensalB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">📊 ROI Mensal:</span>
                  <span class="font-bold text-indigo-600">
                    ${(roiB / mesesOperacao).toFixed(2)}%/mês
                  </span>
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}
          </div>

          ${unidadesData.length > 0 ? `
            <!-- Detalhamento por Unidade -->
            <div class="mt-6">
              <h5 class="font-bold text-gray-800 mb-3">🏠 Breakdown por Unidade</h5>
              <div class="space-y-4">
                ${unidadesData.map(u => `
                  <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <div class="flex justify-between items-start mb-3">
                      <h6 class="font-bold text-lg">${escapeHtml(u.unidade.nome)}</h6>
                      <div class="text-right">
                        <div class="text-xs text-gray-600">Resultado</div>
                        <div class="text-lg font-black ${u.lucro >= 0 ? 'text-green-600' : 'text-red-600'}">
                          ${u.lucro >= 0 ? '+' : ''}R$ ${u.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </div>
                        <div class="text-xs font-bold ${u.roi >= 0 ? 'text-blue-600' : 'text-red-600'}">
                          ROI: ${u.roi >= 0 ? '+' : ''}${u.roi.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <!-- Custos -->
                      <div>
                        <div class="font-bold text-red-700 mb-2">💳 Custos (R$ ${u.custoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</div>
                        <div class="space-y-1 ml-4">
                          <div class="flex justify-between">
                            <span>• Pago por ${escapeHtml(socioA)}:</span>
                            <span class="font-bold">R$ ${u.pagoPorA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div class="flex justify-between">
                            <span>• Pago por ${escapeHtml(socioB)}:</span>
                            <span class="font-bold">R$ ${u.pagoPorB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Receitas -->
                      <div>
                        <div class="font-bold text-green-700 mb-2">💰 Receitas (R$ ${u.receitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</div>
                        <div class="space-y-1 ml-4">
                          <div class="flex justify-between">
                            <span>• Recebido por ${escapeHtml(socioA)}:</span>
                            <span class="font-bold">R$ ${u.recebidoPorA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div class="flex justify-between">
                            <span>• Recebido por ${escapeHtml(socioB)}:</span>
                            <span class="font-bold">R$ ${u.recebidoPorB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="text-center text-gray-500 mt-4">
              <p>📊 Nenhuma unidade com custos ou receitas registrados ainda</p>
            </div>
          `}
          
          <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-blue-800">
              <p class="font-bold mb-2">💡 Como interpretar estes dados:</p>
              <ul class="list-disc ml-5 space-y-1">
                <li><strong>Total pago:</strong> Soma de investimentos gerais + custos diretos pagos por cada sócio</li>
                <li><strong>Total recebido:</strong> Soma de receitas recebidas fisicamente por cada sócio</li>
                <li><strong>Retorno líquido:</strong> Total recebido - Total pago (lucro ou prejuízo real de cada um)</li>
                <li><strong>ROI:</strong> (Retorno / Total pago) × 100 - percentual de retorno sobre o investimento</li>
                <li><strong>Breakdown por unidade:</strong> Mostra custos e receitas específicas de cada casa</li>
              </ul>
            </div>
          </div>
        </div>
      `;

      $("analise-detalhada").innerHTML = html;
    }

    function renderCustoM2(lancs, rats) {
      const custoPorUnidade = {};

      lancs.forEach(l => {
        if (!custoPorUnidade[l.unidadeId]) custoPorUnidade[l.unidadeId] = 0;
        custoPorUnidade[l.unidadeId] += l.valor;
      });

      rats.forEach(r => {
        r.distribuicao?.forEach(d => {
          if (!custoPorUnidade[d.unidadeId]) custoPorUnidade[d.unidadeId] = 0;
          custoPorUnidade[d.unidadeId] += d.valor;
        });
      });

      const unidadesComCusto = Object.entries(custoPorUnidade)
        .map(([unidadeId, custo]) => {
          const unidade = state.unidades.find(u => u.id === unidadeId);
          if (!unidade) return null;

          const areaTotal = unidade.areaConstruida || 0;
          const custoM2 = areaTotal > 0 ? custo / areaTotal : 0;

          return { unidade, custo, areaTotal, custoM2 };
        })
        .filter(Boolean)
        .sort((a, b) => b.custoM2 - a.custoM2);

      if (unidadesComCusto.length === 0) {
        $("custo-m2-section").innerHTML = '<div class="card p-6 mb-6"><p class="text-sm muted">Configure a área (m²) das unidades em <b>🏠 Unidades</b></p></div>';
        return;
      }

      const totalCusto = unidadesComCusto.reduce((sum, item) => sum + item.custo, 0);
      const totalArea = unidadesComCusto.reduce((sum, item) => sum + item.areaTotal, 0);
      const custoM2Medio = totalArea > 0 ? totalCusto / totalArea : 0;

      const html = `
        <div class="card p-6 mb-6">
          <div class="font-black text-lg mb-4">📐 Custo por m² / Unidade</div>
          
          ${totalArea > 0 ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="text-sm muted mb-1">💰 Custo Total da Obra</div>
              <div class="text-2xl font-black text-blue-600">R$ ${totalCusto.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div class="text-sm muted mt-2">
                📏 Área Total: ${totalArea.toFixed(2)} m² | 
                📊 Custo Médio: R$ ${custoM2Medio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/m²
              </div>
            </div>
          ` : ''}
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${unidadesComCusto.map(item => `
              <div class="border rounded-lg p-4">
                <h4 class="font-bold text-gray-800 mb-2">${escapeHtml(item.unidade.nome)}</h4>
                <div class="space-y-1 text-sm">
                  <p><span class="muted">Custo Total:</span> <span class="font-bold">R$ ${item.custo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
                  <p><span class="muted">Área:</span> ${item.areaTotal > 0 ? item.areaTotal.toFixed(2) + ' m²' : '<span class="text-red-600">Não configurada</span>'}</p>
                  <p><span class="muted">Custo/m²:</span> ${item.areaTotal > 0 ? `<span class="font-bold text-blue-600">R$ ${item.custoM2.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : '<span class="muted">-</span>'}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          ${totalArea === 0 ? '<p class="text-xs muted mt-4 text-center">💡 Dica: Configure a área (m²) de cada unidade em <b>🏠 Unidades</b> para ver o custo por m²</p>' : ''}
        </div>
      `;

      $("custo-m2-section").innerHTML = html;
    }

    function renderTopCategorias(lancs, rats) {
      const custoPorCategoria = {};

      lancs.forEach(l => {
        if (!custoPorCategoria[l.categoriaId]) custoPorCategoria[l.categoriaId] = 0;
        custoPorCategoria[l.categoriaId] += l.valor;
      });

      rats.forEach(r => {
        if (!custoPorCategoria[r.categoriaId]) custoPorCategoria[r.categoriaId] = 0;
        custoPorCategoria[r.categoriaId] += r.valorTotal;
      });

      const sorted = Object.entries(custoPorCategoria)
        .map(([catId, valor]) => {
          const cat = state.categorias.find(c => c.id === catId);
          return { nome: cat?.nome || "Sem categoria", valor };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      if (sorted.length === 0) {
        $("top-categorias").innerHTML = '<p class="text-sm muted">Nenhum dado</p>';
        return;
      }

      const html = sorted.map((item, i) => `
        <div class="flex justify-between items-center py-2 border-b">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-400">${i + 1}.</span>
            <span class="text-sm">${escapeHtml(item.nome)}</span>
          </div>
          <span class="font-bold text-sm">R$ ${item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      `).join('');

      $("top-categorias").innerHTML = html;
    }

    function renderTopFornecedores(lancs, rats) {
      const custoPorFornecedor = {};

      lancs.forEach(l => {
        if (!custoPorFornecedor[l.fornecedorId]) custoPorFornecedor[l.fornecedorId] = 0;
        custoPorFornecedor[l.fornecedorId] += l.valor;
      });

      rats.forEach(r => {
        if (!custoPorFornecedor[r.fornecedorId]) custoPorFornecedor[r.fornecedorId] = 0;
        custoPorFornecedor[r.fornecedorId] += r.valorTotal;
      });

      const sorted = Object.entries(custoPorFornecedor)
        .map(([fornId, valor]) => {
          const forn = state.fornecedores.find(f => f.id === fornId);
          return { nome: forn?.nome || "Sem fornecedor", valor };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      if (sorted.length === 0) {
        $("top-fornecedores").innerHTML = '<p class="text-sm muted">Nenhum dado</p>';
        return;
      }

      const html = sorted.map((item, i) => `
        <div class="flex justify-between items-center py-2 border-b">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-400">${i + 1}.</span>
            <span class="text-sm">${escapeHtml(item.nome)}</span>
          </div>
          <span class="font-bold text-sm">R$ ${item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      `).join('');

      $("top-fornecedores").innerHTML = html;
    }

    function renderLucroSection(lucroData) {
      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";

      let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="border rounded-lg p-4">
            <div class="text-sm muted mb-1">👤 ${escapeHtml(socioA)}</div>
            <div class="text-2xl font-black ${lucroData.lucroLiquidoA >= 0 ? 'ok' : 'danger'}">
              R$ ${lucroData.lucroLiquidoA.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
          <div class="border rounded-lg p-4">
            <div class="text-sm muted mb-1">👤 ${escapeHtml(socioB)}</div>
            <div class="text-2xl font-black ${lucroData.lucroLiquidoB >= 0 ? 'ok' : 'danger'}">
              R$ ${lucroData.lucroLiquidoB.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        </div>
      `;

      if (lucroData.deducoes.length > 0) {
        html += `
          <div class="text-xs muted mt-4">
            <div class="font-bold mb-2">Deduções aplicadas:</div>
            ${lucroData.deducoes.map(d => `
              <div>• ${escapeHtml(d.nome)}: ${d.displayTipo} sobre ${d.displayBase} = R$ ${d.valorDeducao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            `).join('')}
          </div>
        `;
      }

      $("lucro-section").innerHTML = html;
    }

    function renderEqualizacaoSection() {
      const eq = computeEqualizacao();
      if (!eq) {
        $("equalizacao-section").innerHTML = '<p class="text-sm muted">Erro ao calcular equalização</p>';
        return;
      }

      // Verificar permissões: sócio vê apenas seus próprios dados
      const meuSocioId = getSocioIdForUser(OBRA_ID);
      const somenteMinhaVisao = !isAdmin() && meuSocioId;

      // Se é sócio, mostrar apenas seu card
      if (somenteMinhaVisao) {
        const meusDados = meuSocioId === 'A' ? {
          nome: eq.socioA,
          investimento: eq.investimentoA,
          recebeu: eq.recebeuA,
          temDireito: eq.temDireitoA,
          deveRepassar: eq.deveRepassarA,
          pagou: eq.pagouA,
          deveGastar: eq.deveGastarA,
          saldoCaixa: eq.saldoCaixaA,
          diferencaGastos: eq.diferencaGastosA,
          saldoFinal: eq.saldoFinalA
        } : {
          nome: eq.socioB,
          investimento: eq.investimentoB,
          recebeu: eq.recebeuB,
          temDireito: eq.temDireitoB,
          deveRepassar: eq.deveRepassarB,
          pagou: eq.pagouB,
          deveGastar: eq.deveGastarB,
          saldoCaixa: eq.saldoCaixaB,
          diferencaGastos: eq.diferencaGastosB,
          saldoFinal: eq.saldoFinalB
        };

        const html = `
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="text-sm text-blue-800">
              👤 Você está visualizando apenas seus próprios dados como <strong>${meusDados.nome}</strong>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white max-w-2xl mx-auto">
            <h4 class="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
              👤 ${escapeHtml(meusDados.nome)} (Você)
            </h4>
            
            <div class="space-y-3">
              ${meusDados.investimento > 0 ? `
              <div class="bg-purple-100 rounded-lg p-3 border-2 border-purple-300">
                <div class="text-xs font-bold text-purple-900 mb-1">💼 INVESTIMENTOS</div>
                <div class="text-2xl font-black text-purple-700">R$ ${meusDados.investimento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-purple-800 mt-1">Aportes, terreno, etc.</div>
              </div>
              ` : ''}
              
              <div class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="text-xs font-bold text-blue-800 mb-1">💰 RECEBEU FISICAMENTE</div>
                <div class="text-2xl font-black text-blue-600">R$ ${meusDados.recebeu.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Dinheiro que você recebeu na mão</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-green-200">
                <div class="text-xs font-bold text-green-800 mb-1">✅ TEM DIREITO</div>
                <div class="text-2xl font-black text-green-600">R$ ${meusDados.temDireito.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte baseado no proprietário das unidades</div>
              </div>

              <div class="bg-gradient-to-r from-${meusDados.deveRepassar > 0 ? 'orange' : 'cyan'}-50 to-white rounded-lg p-3 border-2 border-${meusDados.deveRepassar > 0 ? 'orange' : 'cyan'}-300">
                <div class="text-xs font-bold text-${meusDados.deveRepassar > 0 ? 'orange' : 'cyan'}-800 mb-1">💸 ${meusDados.deveRepassar > 0 ? 'DEVE REPASSAR' : 'DEVE RECEBER'}</div>
                <div class="text-2xl font-black text-${meusDados.deveRepassar > 0 ? 'orange' : 'cyan'}-700">R$ ${Math.abs(meusDados.deveRepassar).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${meusDados.deveRepassar > 0 ? 'Você recebeu mais do que tem direito' : 'Você recebeu menos do que tem direito'}</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-red-200">
                <div class="text-xs font-bold text-red-800 mb-1">💳 PAGOU EM CUSTOS</div>
                <div class="text-2xl font-black text-red-600">R$ ${meusDados.pagou.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Custos que você efetivamente pagou</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-orange-200">
                <div class="text-xs font-bold text-orange-800 mb-1">📊 DEVERIA PAGAR (50%)</div>
                <div class="text-2xl font-black text-orange-600">R$ ${meusDados.deveGastar.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte dos custos totais</div>
              </div>

              <div class="bg-gradient-to-r from-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-50 to-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-100 rounded-lg p-3 border-2 border-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-300">
                <div class="text-xs font-bold text-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-900 mb-1">🏦 SALDO DE CAIXA</div>
                <div class="text-2xl font-black text-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-700">R$ ${meusDados.saldoCaixa.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-${meusDados.saldoCaixa >= 0 ? 'green' : 'red'}-800 mt-1">Recebeu - Pagou = ${meusDados.saldoCaixa >= 0 ? 'Positivo' : 'Negativo'}</div>
              </div>

              <div class="bg-gradient-to-r from-${meusDados.diferencaGastos >= 0 ? 'purple' : 'yellow'}-50 to-white rounded-lg p-3 border-2 border-${meusDados.diferencaGastos >= 0 ? 'purple' : 'yellow'}-300">
                <div class="text-xs font-bold text-${meusDados.diferencaGastos >= 0 ? 'purple' : 'yellow'}-900 mb-1">⚖️ DIFERENÇA NOS GASTOS</div>
                <div class="text-2xl font-black text-${meusDados.diferencaGastos >= 0 ? 'purple' : 'yellow'}-700">${meusDados.diferencaGastos >= 0 ? '+' : ''}R$ ${meusDados.diferencaGastos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${meusDados.diferencaGastos >= 0 ? 'Você pagou MAIS que sua parte' : 'Você pagou MENOS que sua parte'}</div>
              </div>

              <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-3 border-2 border-indigo-400">
                <div class="text-xs font-bold text-indigo-900 mb-1">🎯 SALDO FINAL (após acertos)</div>
                <div class="text-3xl font-black text-indigo-700">${meusDados.saldoFinal >= 0 ? '+' : ''}R$ ${meusDados.saldoFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-indigo-800 mt-1">${meusDados.saldoFinal >= 0 ? 'Tem a receber' : 'Tem a pagar'}</div>
              </div>
            </div>
          </div>

          ${eq.mensagem && meusDados.saldoFinal !== 0 ? `
            <div class="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-400 rounded-lg p-6 mt-6">
              <div class="text-center">
                <div class="text-2xl mb-2">💡</div>
                <div class="text-lg font-bold text-gray-800 mb-2">Situação Atual</div>
                <div class="text-xl font-black text-orange-600">
                  ${meusDados.saldoFinal > 0 ? 'Você tem a receber' : 'Você tem a pagar'} R$ ${Math.abs(meusDados.saldoFinal).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
              </div>
            </div>
          ` : ''}
        `;

        $("equalizacao-section").innerHTML = html;
        return;
      }

      // ADMIN: Visualização completa (código original)
      const html = `
        <!-- Análise Detalhada de Fluxo de Caixa por Sócio -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Sócio A -->
          <div class="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
            <h4 class="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
              👤 ${escapeHtml(eq.socioA)}
            </h4>
            
            <div class="space-y-3">
              ${eq.investimentoA > 0 || eq.investimentoB > 0 ? `
              <div class="bg-purple-100 rounded-lg p-3 border-2 border-purple-300">
                <div class="text-xs font-bold text-purple-900 mb-1">💼 INVESTIMENTOS</div>
                <div class="text-2xl font-black text-purple-700">R$ ${eq.investimentoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-purple-800 mt-1">Aportes, terreno, etc.</div>
              </div>
              ` : ''}
              
              <div class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="text-xs font-bold text-blue-800 mb-1">💰 RECEBEU FISICAMENTE</div>
                <div class="text-2xl font-black text-blue-600">R$ ${eq.recebeuA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Dinheiro que você recebeu na mão</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-green-200">
                <div class="text-xs font-bold text-green-800 mb-1">✅ TEM DIREITO</div>
                <div class="text-2xl font-black text-green-600">R$ ${eq.temDireitoA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte baseado no proprietário das unidades</div>
              </div>

              <div class="bg-gradient-to-r from-${eq.deveRepassarA > 0 ? 'orange' : 'cyan'}-50 to-white rounded-lg p-3 border-2 border-${eq.deveRepassarA > 0 ? 'orange' : 'cyan'}-300">
                <div class="text-xs font-bold text-${eq.deveRepassarA > 0 ? 'orange' : 'cyan'}-800 mb-1">💸 ${eq.deveRepassarA > 0 ? 'DEVE REPASSAR' : 'DEVE RECEBER'}</div>
                <div class="text-2xl font-black text-${eq.deveRepassarA > 0 ? 'orange' : 'cyan'}-700">R$ ${Math.abs(eq.deveRepassarA).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${eq.deveRepassarA > 0 ? 'Recebeu mais do que tem direito' : 'Recebeu menos do que tem direito'}</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-red-200">
                <div class="text-xs font-bold text-red-800 mb-1">💳 PAGOU EM CUSTOS</div>
                <div class="text-2xl font-black text-red-600">R$ ${eq.pagouA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Custos que você efetivamente pagou</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-orange-200">
                <div class="text-xs font-bold text-orange-800 mb-1">📊 DEVERIA PAGAR (50%)</div>
                <div class="text-2xl font-black text-orange-600">R$ ${eq.deveGastarA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte dos custos totais (50% de R$ ${eq.totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</div>
              </div>              <div class="bg-gradient-to-r from-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-50 to-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-100 rounded-lg p-3 border-2 border-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-300">
                <div class="text-xs font-bold text-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-900 mb-1">🏦 SALDO DE CAIXA</div>
                <div class="text-2xl font-black text-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-700">R$ ${eq.saldoCaixaA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-${eq.saldoCaixaA >= 0 ? 'green' : 'red'}-800 mt-1">Recebeu - Pagou = ${eq.saldoCaixaA >= 0 ? 'Positivo' : 'Negativo'}</div>
              </div>

              <div class="bg-gradient-to-r from-${eq.diferencaGastosA >= 0 ? 'purple' : 'yellow'}-50 to-white rounded-lg p-3 border-2 border-${eq.diferencaGastosA >= 0 ? 'purple' : 'yellow'}-300">
                <div class="text-xs font-bold text-${eq.diferencaGastosA >= 0 ? 'purple' : 'yellow'}-900 mb-1">⚖️ DIFERENÇA NOS GASTOS</div>
                <div class="text-2xl font-black text-${eq.diferencaGastosA >= 0 ? 'purple' : 'yellow'}-700">${eq.diferencaGastosA >= 0 ? '+' : ''}R$ ${eq.diferencaGastosA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${eq.diferencaGastosA >= 0 ? 'Você pagou MAIS que sua parte' : 'Você pagou MENOS que sua parte'}</div>
              </div>

              <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-3 border-2 border-indigo-400">
                <div class="text-xs font-bold text-indigo-900 mb-1">🎯 SALDO FINAL (após acertos)</div>
                <div class="text-3xl font-black text-indigo-700">${eq.saldoFinalA >= 0 ? '+' : ''}R$ ${eq.saldoFinalA.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-indigo-800 mt-1">${eq.saldoFinalA >= 0 ? 'Tem a receber' : 'Tem a pagar'}</div>
              </div>
            </div>
          </div>

          <!-- Sócio B -->
          <div class="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-white">
            <h4 class="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
              👤 ${escapeHtml(eq.socioB)}
            </h4>
            
            <div class="space-y-3">
              ${eq.investimentoA > 0 || eq.investimentoB > 0 ? `
              <div class="bg-purple-100 rounded-lg p-3 border-2 border-purple-300">
                <div class="text-xs font-bold text-purple-900 mb-1">💼 INVESTIMENTOS</div>
                <div class="text-2xl font-black text-purple-700">R$ ${eq.investimentoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-purple-800 mt-1">Aportes, terreno, etc.</div>
              </div>
              ` : ''}
              
              <div class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="text-xs font-bold text-blue-800 mb-1">💰 RECEBEU FISICAMENTE</div>
                <div class="text-2xl font-black text-blue-600">R$ ${eq.recebeuB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Dinheiro que você recebeu na mão</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-green-200">
                <div class="text-xs font-bold text-green-800 mb-1">✅ TEM DIREITO</div>
                <div class="text-2xl font-black text-green-600">R$ ${eq.temDireitoB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte baseado no proprietário das unidades</div>
              </div>

              <div class="bg-gradient-to-r from-${eq.deveRepassarB > 0 ? 'orange' : 'cyan'}-50 to-white rounded-lg p-3 border-2 border-${eq.deveRepassarB > 0 ? 'orange' : 'cyan'}-300">
                <div class="text-xs font-bold text-${eq.deveRepassarB > 0 ? 'orange' : 'cyan'}-800 mb-1">💸 ${eq.deveRepassarB > 0 ? 'DEVE REPASSAR' : 'DEVE RECEBER'}</div>
                <div class="text-2xl font-black text-${eq.deveRepassarB > 0 ? 'orange' : 'cyan'}-700">R$ ${Math.abs(eq.deveRepassarB).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${eq.deveRepassarB > 0 ? 'Recebeu mais do que tem direito' : 'Recebeu menos do que tem direito'}</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-red-200">
                <div class="text-xs font-bold text-red-800 mb-1">💳 PAGOU EM CUSTOS</div>
                <div class="text-2xl font-black text-red-600">R$ ${eq.pagouB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Custos que você efetivamente pagou</div>
              </div>

              <div class="bg-white rounded-lg p-3 border border-orange-200">
                <div class="text-xs font-bold text-orange-800 mb-1">📊 DEVERIA PAGAR (50%)</div>
                <div class="text-2xl font-black text-orange-600">R$ ${eq.deveGastarB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-600 mt-1">Sua parte dos custos totais (50% de R$ ${eq.totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</div>
              </div>              <div class="bg-gradient-to-r from-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-50 to-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-100 rounded-lg p-3 border-2 border-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-300">
                <div class="text-xs font-bold text-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-900 mb-1">🏦 SALDO DE CAIXA</div>
                <div class="text-2xl font-black text-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-700">R$ ${eq.saldoCaixaB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-${eq.saldoCaixaB >= 0 ? 'green' : 'red'}-800 mt-1">Recebeu - Pagou = ${eq.saldoCaixaB >= 0 ? 'Positivo' : 'Negativo'}</div>
              </div>

              <div class="bg-gradient-to-r from-${eq.diferencaGastosB >= 0 ? 'purple' : 'yellow'}-50 to-white rounded-lg p-3 border-2 border-${eq.diferencaGastosB >= 0 ? 'purple' : 'yellow'}-300">
                <div class="text-xs font-bold text-${eq.diferencaGastosB >= 0 ? 'purple' : 'yellow'}-900 mb-1">⚖️ DIFERENÇA NOS GASTOS</div>
                <div class="text-2xl font-black text-${eq.diferencaGastosB >= 0 ? 'purple' : 'yellow'}-700">${eq.diferencaGastosB >= 0 ? '+' : ''}R$ ${eq.diferencaGastosB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-gray-700 mt-1">${eq.diferencaGastosB >= 0 ? 'Você pagou MAIS que sua parte' : 'Você pagou MENOS que sua parte'}</div>
              </div>

              <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-3 border-2 border-indigo-400">
                <div class="text-xs font-bold text-indigo-900 mb-1">🎯 SALDO FINAL (após acertos)</div>
                <div class="text-3xl font-black text-indigo-700">${eq.saldoFinalB >= 0 ? '+' : ''}R$ ${eq.saldoFinalB.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="text-xs text-indigo-800 mt-1">${eq.saldoFinalB >= 0 ? 'Tem a receber' : 'Tem a pagar'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sugestão de Acerto -->
        ${eq.mensagem ? `
          <div class="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-400 rounded-lg p-6">
            <div class="text-center mb-4">
              <div class="text-2xl mb-2">💡</div>
              <div class="text-lg font-bold text-gray-800 mb-2">Sugestão de Equalização</div>
              <div class="text-2xl font-black text-orange-600">${eq.mensagem}</div>
            </div>
            <div class="flex gap-3 justify-center">
              <button onclick="window.sugerirAcerto()" class="btn btn-green">
                ✨ Criar Acerto Automaticamente
              </button>
              <button onclick="window.navigateTo('ACERTOS')" class="btn btn-dark">
                📝 Criar Manualmente
              </button>
            </div>
            <div class="text-sm text-gray-600 mt-3 text-center">
              Clique para criar o acerto e zerar os saldos entre os sócios
            </div>
          </div>
        ` : `
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6 text-center">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-lg font-bold text-green-800">Saldos Equalizados!</div>
            <div class="text-sm text-gray-600 mt-2">Não há acertos pendentes entre os sócios</div>
          </div>
        `}

        <!-- Explicação do Cálculo -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="font-bold text-blue-900 mb-2">📚 Como funciona a equalização:</div>
          <div class="text-sm text-blue-800 space-y-1">
            <p>1️⃣ <strong>Recebeu Fisicamente:</strong> Quem pegou o dinheiro na mão (selecionado ao registrar recebimento)</p>
            <p>2️⃣ <strong>Tem Direito:</strong> Quanto cada um tem direito baseado no proprietário da unidade (50/50, 100% A, ou 100% B)</p>
            <p>3️⃣ <strong>Deve Repassar/Receber:</strong> Diferença entre o que recebeu fisicamente e o que tem direito</p>
            <p>4️⃣ <strong>Pagou em Custos:</strong> O que cada um efetivamente desembolsou para pagar despesas</p>
            <p>5️⃣ <strong>Deveria Pagar:</strong> Cada sócio deve arcar com 50% dos custos totais</p>
            <p>6️⃣ <strong>Diferença de Gastos:</strong> Pagou - Deveria Pagar (quem pagou mais ou menos que sua parte)</p>
            <p>7️⃣ <strong>Saldo Final:</strong> Combina repasses + gastos - acertos já realizados</p>
          </div>
          <div class="mt-3 p-3 bg-white rounded border border-blue-300">
            <div class="font-bold text-blue-900 text-sm mb-1">💡 Exemplo do usuário:</div>
            <div class="text-xs text-gray-700">
              <strong>Victor recebeu:</strong> R$ 10.000 fisicamente (marcado como "Recebido por: Sócio A")<br>
              <strong>Tem direito:</strong> R$ 5.000 (casa é 50/50)<br>
              <strong>Deve repassar:</strong> R$ 5.000 (recebeu 5k a mais)<br>
              <strong>Gustavo deve em custos:</strong> R$ 3.000<br>
              <strong>Resultado final:</strong> Victor passa apenas R$ 2.000 para Gustavo (5.000 - 3.000)
            </div>
          </div>
        </div>
      `;

      $("equalizacao-section").innerHTML = html;
    }

    function hydrateFilterSelects() {
      // Categorias
      const catSel = $("filter-categoria");
      catSel.innerHTML = '<option value="TODAS">Todas</option>' +
        state.categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
      catSel.value = filterCategoria;

      // Fornecedores
      const fornSel = $("filter-fornecedor");
      fornSel.innerHTML = '<option value="TODOS">Todos</option>' +
        state.fornecedores.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join('');
      fornSel.value = filterFornecedor;
    }

    // LANCAMENTOS VIEW
    function renderLancamentosView() {
      // Hydrate selects
      const unidSel = $("lanc-unidade");
      unidSel.innerHTML = '<option value="">Selecione...</option>' +
        state.unidades.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');

      const catSel = $("lanc-categoria");
      catSel.innerHTML = '<option value="">Selecione...</option>' +
        state.categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');

      const fornSel = $("lanc-fornecedor");
      fornSel.innerHTML = '<option value="">Selecione...</option>' +
        state.fornecedores.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join('');

      // Render list
      renderLancamentosList();
    }

    function renderLancamentosList() {
      const container = $("lanc-list");
      if (state.lancamentos.length === 0) {
        container.innerHTML = '<p class="text-center muted py-8">Nenhum lançamento cadastrado</p>';
        return;
      }

      const html = `
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-left">Data</th>
              <th class="text-left">Status</th>
              <th class="text-left">Unidade</th>
              <th class="text-left">Categoria</th>
              <th class="text-left">Fornecedor</th>
              <th class="text-left">Descrição</th>
              <th class="text-left">Valor</th>
              <th class="text-left">Vencimento</th>
              <th class="text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${state.lancamentos.map(l => {
              const unid = state.unidades.find(u => u.id === l.unidadeId);
              const cat = state.categorias.find(c => c.id === l.categoriaId);
              const forn = state.fornecedores.find(f => f.id === l.fornecedorId);
              const statusClass = (l.status || "pendente") === "pago" ? "badge-pago" : (l.status === "atrasado" ? "badge-atrasado" : "badge-pendente");
              const statusIcon = (l.status || "pendente") === "pago" ? "✅" : (l.status === "atrasado" ? "🚨" : "⏳");
              
              return `
                <tr>
                  <td>${new Date(l.data).toLocaleDateString('pt-BR')}</td>
                  <td><span class="badge ${statusClass}">${statusIcon} ${(l.status || "pendente").toUpperCase()}</span></td>
                  <td>${escapeHtml(unid?.nome || '-')}</td>
                  <td>${escapeHtml(cat?.nome || '-')}</td>
                  <td>${escapeHtml(forn?.nome || '-')}</td>
                  <td>${escapeHtml(l.descricao)}</td>
                  <td class="font-bold">R$ ${l.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>${l.dataVencimento ? new Date(l.dataVencimento).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    ${l.comprovante ? `<a href="${l.comprovante}" target="_blank" class="text-blue-600 hover:underline mr-2">📎</a>` : ''}
                    <button onclick="window.mudarStatusLancamento('${l.id}')" class="text-green-600 hover:underline mr-2" title="Mudar status">💳</button>
                    <button onclick="window.deleteLancamento('${l.id}')" class="text-red-600 hover:underline" title="Deletar">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    }

    // RATEIOS VIEW
    function renderRateiosView() {
      // Hydrate selects
      const catSel = $("rat-categoria");
      catSel.innerHTML = '<option value="">Selecione...</option>' +
        state.categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');

      const fornSel = $("rat-fornecedor");
      fornSel.innerHTML = '<option value="">Selecione...</option>' +
        state.fornecedores.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join('');

      // Init destinations
      rateioDestCount = 0;
      $("rat-dests").innerHTML = "";
      rateioAddDest();

      // Render list
      renderRateiosList();
    }

    function rateioAddDest() {
      const container = $("rat-dests");
      const id = rateioDestCount++;
      const div = document.createElement('div');
      div.className = "grid grid-cols-12 gap-2";
      div.id = `rat-dest-${id}`;
      div.innerHTML = `
        <div class="col-span-6">
          <select class="select text-sm rat-dest-unidade" required>
            <option value="">Selecione unidade...</option>
            ${state.unidades.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('')}
          </select>
        </div>
        <div class="col-span-4">
          <input type="number" step="0.01" class="input text-sm rat-dest-valor" placeholder="Valor (R$)" required />
        </div>
        <div class="col-span-2">
          <button type="button" onclick="window.rateioRemoveDest('${id}')" class="btn btn-danger w-full text-sm">🗑️</button>
        </div>
      `;
      container.appendChild(div);
    }

    window.rateioRemoveDest = (id) => {
      $(`rat-dest-${id}`)?.remove();
    };

    function renderRateiosList() {
      const container = $("rat-list");
      if (state.rateios.length === 0) {
        container.innerHTML = '<p class="text-center muted py-8">Nenhum rateio cadastrado</p>';
        return;
      }

      const html = `
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-left">Data</th>
              <th class="text-left">Status</th>
              <th class="text-left">Descrição</th>
              <th class="text-left">Fornecedor</th>
              <th class="text-left">Categoria</th>
              <th class="text-left">Valor Total</th>
              <th class="text-left">Destinos</th>
              <th class="text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${state.rateios.map(r => {
              const forn = state.fornecedores.find(f => f.id === r.fornecedorId);
              const cat = state.categorias.find(c => c.id === r.categoriaId);
              const statusClass = (r.status || "pendente") === "pago" ? "badge-pago" : (r.status === "atrasado" ? "badge-atrasado" : "badge-pendente");
              const statusIcon = (r.status || "pendente") === "pago" ? "✅" : (r.status === "atrasado" ? "🚨" : "⏳");
              
              return `
                <tr>
                  <td>${new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td><span class="badge ${statusClass}">${statusIcon} ${(r.status || "pendente").toUpperCase()}</span></td>
                  <td>${escapeHtml(r.descricao)}</td>
                  <td>${escapeHtml(forn?.nome || '-')}</td>
                  <td>${escapeHtml(cat?.nome || '-')}</td>
                  <td class="font-bold">R$ ${r.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td class="text-sm">${r.distribuicao?.length || 0} unidades</td>
                  <td>
                    <button onclick="window.mudarStatusRateio('${r.id}')" class="text-green-600 hover:underline mr-2" title="Mudar status">💳</button>
                    <button onclick="window.deleteRateio('${r.id}')" class="text-red-600 hover:underline" title="Deletar">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    }

    // RECEBIMENTOS VIEW
    function renderRecebimentosView() {
      // Hydrate unidade select
      const unidSel = $("receb-unidade");
      unidSel.innerHTML = '<option value="">Selecione...</option>' +
        state.unidades.map(u => `<option value="${u.id}">${escapeHtml(u.nome)}</option>`).join('');

      renderRecebimentosList();
    }

    function renderRecebimentosList() {
      const container = $("receb-list");
      if (state.recebimentos.length === 0) {
        container.innerHTML = '<p class="text-center muted py-8">Nenhum recebimento cadastrado</p>';
        return;
      }

      const sorted = [...state.recebimentos].sort((a, b) => 
        new Date(b.data || 0) - new Date(a.data || 0)
      );

      const html = `
        <table class="table w-full">
          <thead>
            <tr>
              <th>Data</th>
              <th>Unidade</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Forma</th>
              <th>Recebido por</th>
              <th>Obs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(r => {
              const unid = state.unidades.find(u => u.id === r.unidadeId);
              const tipoLabels = {
                sinal: '🤝 Sinal',
                parcela: '📅 Parcela',
                quitacao: '✅ Quitação',
                outro: '📝 Outro'
              };
              const recebidoLabels = {
                A: '👤 Sócio A',
                B: '👤 Sócio B',
                ambos: '👥 50/50'
              };
              return `
                <tr>
                  <td>${new Date(r.data).toLocaleDateString('pt-BR')}</td>
                  <td><span class="badge">${escapeHtml(unid?.nome || 'N/A')}</span></td>
                  <td>${tipoLabels[r.tipo] || r.tipo}</td>
                  <td class="font-bold ok">R$ ${r.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>${escapeHtml(r.formaPagamento || 'N/A')}</td>
                  <td><span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${recebidoLabels[r.recebidoPor || 'ambos']}</span></td>
                  <td class="text-xs muted">${escapeHtml(r.observacoes || '-')}</td>
                  <td>
                    <button onclick="window.deleteRecebimento('${r.id}')" class="text-red-600 hover:underline text-sm">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <div class="font-bold text-green-800">Total Recebido:</div>
          <div class="text-2xl font-black text-green-600">
            R$ ${state.recebimentos.reduce((sum, r) => sum + (r.valor || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    // ACERTOS VIEW
    function renderAcertosView() {
      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";

      $("ac-de").innerHTML = `
        <option value="A">${escapeHtml(socioA)}</option>
        <option value="B">${escapeHtml(socioB)}</option>
      `;

      $("ac-para").innerHTML = `
        <option value="A">${escapeHtml(socioA)}</option>
        <option value="B">${escapeHtml(socioB)}</option>
      `;

      renderAcertosList();
    }

    function renderAcertosList() {
      const container = $("acerto-list");
      if (state.acertos.length === 0) {
        container.innerHTML = '<p class="text-center muted py-8">Nenhum acerto cadastrado</p>';
        return;
      }

      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";

      const html = `
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-left">Data</th>
              <th class="text-left">De</th>
              <th class="text-left">Para</th>
              <th class="text-left">Valor</th>
              <th class="text-left">Descrição</th>
              <th class="text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${state.acertos.map(a => `
              <tr>
                <td>${new Date(a.data).toLocaleDateString('pt-BR')}</td>
                <td>${escapeHtml(a.de === 'A' ? socioA : socioB)}</td>
                <td>${escapeHtml(a.para === 'A' ? socioA : socioB)}</td>
                <td class="font-bold">R$ ${a.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${escapeHtml(a.descricao)}</td>
                <td>
                  <button onclick="window.deleteAcerto('${a.id}')" class="text-red-600 hover:underline">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    }

    // CONFIG VIEW
    function renderConfigView() {
      $("socio-a").value = state.config.socioA || "";
      $("socio-b").value = state.config.socioB || "";

      renderDeducoesList();
    }

    function renderDeducoesList() {
      const container = $("ded-list");
      if (state.deducoes.length === 0) {
        container.innerHTML = '<p class="muted">Nenhuma dedução cadastrada</p>';
        return;
      }

      const html = state.deducoes.map(d => {
        const tipo = d.tipo || 'percentual';
        const base = d.base || 'lucro';
        const valor = d.valor || d.percentual || 0;
        
        let displayValor = tipo === 'percentual' ? `${valor.toFixed(2)}%` : `R$ ${valor.toFixed(2)}`;
        let displayBase = base === 'lucro' ? 'Lucro Bruto' : 'VGV';
        
        return `
          <div class="flex justify-between items-center p-2 border rounded">
            <div class="flex-1">
              <div class="font-bold text-sm">${escapeHtml(d.nome)}</div>
              <div class="text-xs muted">${displayValor} sobre ${displayBase}</div>
            </div>
            <button onclick="window.deleteDeducao('${d.id}')" class="text-red-600 hover:underline text-sm ml-2">🗑️</button>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    // MODALS
    let modalObraAberto = false; // Flag para evitar loop infinito
    
    function openModal(id) {
      // Se o modal-obra já está aberto, NÃO reabrir
      if (id === "modal-obra" && modalObraAberto) {
        console.log("⚠️ Modal já aberto, ignorando...");
        return;
      }
      
      console.log("🔓 Abrindo modal:", id);
      $(id).classList.remove("hidden");
      $(id).classList.add("flex");
      
      // Renderizar conteúdo específico do modal quando abrir
      if (id === "modal-obra") {
        modalObraAberto = true; // Marcar como aberto
        console.log("  📋 Chamando renderObrasModal...");
        try {
          renderObrasModal();
          // NÃO resetar aqui - deixa editarObra() ou criar-obra-btn fazer isso
          console.log("  ✅ Modal renderizado com sucesso");
        } catch (err) {
          console.error("  ❌ Erro ao renderizar modal:", err);
        }
      }
    }

    function closeModal(id) {
      $(id).classList.add("hidden");
      $(id).classList.remove("flex");
      
      // Resetar flag quando fechar modal-obra
      if (id === "modal-obra") {
        modalObraAberto = false;
      }
    }

    function renderObrasModal() {
      const container = $("obras-list");
      console.log("🔍 renderObrasModal chamado. Total de obras:", state.obras.length);
      console.log("📦 Container encontrado:", container);
      
      if (!container) {
        console.error("❌ Container obras-list NÃO ENCONTRADO!");
        return;
      }
      
      if (state.obras.length === 0) {
        container.innerHTML = '<p class="muted">Nenhuma obra cadastrada</p>';
        return;
      }

      const html = state.obras.map(o => {
        console.log("  - Renderizando obra:", o.nome, "ID:", o.id);
        const nomeSeguro = o.nome ? o.nome.replace(/[<>"']/g, '') : 'Sem nome';
        return `
          <div class="flex justify-between items-center p-3 border rounded bg-gray-50 mb-2">
            <span class="font-bold text-gray-800">${nomeSeguro}</span>
            <div class="flex gap-2">
              <button onclick="window.editarObra('${o.id}')" class="btn btn-soft text-sm">✏️</button>
              <button onclick="window.deleteObra('${o.id}')" class="btn btn-danger text-sm">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      console.log("📝 HTML gerado (primeiros 200 chars):", html.substring(0, 200));
      container.innerHTML = html;
      console.log("✅ obras-list.innerHTML definido. Novo conteúdo:", container.innerHTML.substring(0, 200));
    }

    function renderUnidadesModal() {
      const container = $("unidades-list");
      if (state.unidades.length === 0) {
        container.innerHTML = '<p class="muted">Nenhuma unidade cadastrada</p>';
        return;
      }

      const statusLabels = {
        disponivel: '🟢 Disponível',
        reservada: '🟡 Reservada',
        vendida: '🔴 Vendida'
      };

      const proprietarioLabels = {
        A: '👤 Sócio A',
        B: '👤 Sócio B',
        ambos: '👥 Ambos (50/50)'
      };

      const html = state.unidades.map(u => `
        <div class="flex justify-between items-center p-3 border rounded">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <div class="font-bold">${escapeHtml(u.nome)}</div>
              <span class="text-xs badge">${statusLabels[u.status || 'disponivel'] || u.status}</span>
              <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${getProprietarioLabel(u.proprietario)}</span>
            </div>
            <div class="text-xs muted">
              VGV: R$ ${(u.vgvPrevisto || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              ${u.valorVenda ? ` | Vendida por: R$ ${u.valorVenda.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : ''}
              ${u.areaConstruida ? ` | ${u.areaConstruida}m²` : ''}
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="window.editUnidade('${u.id}')" class="text-blue-600 hover:underline text-sm">✏️ Editar</button>
            <button onclick="window.deleteUnidade('${u.id}')" class="text-red-600 hover:underline text-sm">🗑️</button>
          </div>
        </div>
      `).join('');

      container.innerHTML = html;
    }

    function renderFornecedoresModal() {
      const container = $("fornecedores-list");
      if (state.fornecedores.length === 0) {
        container.innerHTML = '<p class="muted">Nenhum fornecedor cadastrado</p>';
        return;
      }

      const html = state.fornecedores.map(f => `
        <div class="flex justify-between items-center p-3 border rounded">
          <div>
            <div class="font-bold">${escapeHtml(f.nome)}</div>
            <div class="text-xs muted">${escapeHtml(f.contato || '-')} ${f.documento ? '• ' + f.documento : ''}</div>
          </div>
          <button onclick="window.deleteFornecedor('${f.id}')" class="text-red-600 hover:underline text-sm">🗑️</button>
        </div>
      `).join('');

      container.innerHTML = html;
    }

    function renderCategoriasModal() {
      const container = $("categorias-list");
      if (state.categorias.length === 0) {
        container.innerHTML = '<p class="muted">Nenhuma categoria cadastrada</p>';
        return;
      }

      const html = state.categorias.map(c => `
        <div class="flex justify-between items-center p-3 border rounded">
          <div class="flex items-center gap-2">
            <div style="width: 16px; height: 16px; border-radius: 4px; background: ${c.cor || '#ccc'};"></div>
            <div>
              <div class="font-bold">${escapeHtml(c.nome)}</div>
              ${c.grupo ? `<div class="text-xs muted">Grupo: ${escapeHtml(c.grupo)}</div>` : ''}
            </div>
          </div>
          <button onclick="window.deleteCategoria('${c.id}')" class="text-red-600 hover:underline text-sm">🗑️</button>
        </div>
      `).join('');

      container.innerHTML = html;
    }

    // CRUD FUNCTIONS
    async function createObra(e) {
      if (e) e.preventDefault();
      
      const nome = $("obra-nome").value.trim();
      const endereco = $("obra-endereco").value.trim();
      const dataInicio = $("obra-data-inicio").value || null;
      const dataRecebimento = $("obra-data-recebimento").value || null;
      const socioAId = $("obra-socio-a").value; // ID do sócio
      const socioBId = $("obra-socio-b").value; // ID do sócio (pode ser vazio)
      
      if (!nome) {
        showToast('Digite o nome da obra', 'warning');
        return;
      }
      
      if (!socioAId) {
        showToast('⚠️ Selecione pelo menos o Sócio A', 'warning');
        return;
      }

      try {
        // Pegar nomes dos sócios para compatibilidade
        const socioA = state.socios.find(s => s.id === socioAId);
        const socioB = socioBId ? state.socios.find(s => s.id === socioBId) : null;
        
        await addDoc(refs("dummy").obrasCol, {
          nome,
          endereco: endereco || null,
          dataInicio,
          dataRecebimento,
          // IDs dos sócios (novo formato)
          socioAId: socioAId,
          socioBId: socioBId || null,
          // Nomes dos sócios (compatibilidade)
          socioA: socioA ? socioA.nome : 'Sócio A',
          socioB: socioB ? socioB.nome : null,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        
        document.getElementById("obra-form").reset();
        showToast('🏗️ Obra criada com sucesso!', 'success');
        closeModal("modal-obra");
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar obra', 'error');
      }
    }

    async function createUnidade() {
      const nome = $("unid-new-nome").value.trim();
      const area = parseFloat($("unid-new-area").value) || 0;
      const status = $("unid-new-status").value;
      const proprietario = $("unid-new-proprietario").value;
      const vgv = parseFloat($("unid-new-vgv").value) || 0;
      const valorVenda = parseFloat($("unid-new-venda").value) || null;

      if (!nome) {
        showToast('Digite o nome da unidade', 'warning');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).unidadesCol, {
          nome,
          areaConstruida: area,
          status,
          proprietario,
          vgvPrevisto: vgv,
          valorVenda,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        $("unid-new-nome").value = "";
        $("unid-new-area").value = "";
        $("unid-new-proprietario").value = "ambos";
        $("unid-new-vgv").value = "";
        $("unid-new-venda").value = "";
        showToast('Unidade criada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar unidade', 'error');
      }
    }

    async function createFornecedor() {
      const nome = $("forn-nome").value.trim();
      const contato = $("forn-contato").value.trim();
      const doc = $("forn-doc").value.trim();

      if (!nome) {
        showToast('Digite o nome do fornecedor', 'warning');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).fornecedoresCol, {
          nome,
          contato: contato || null,
          documento: doc || null,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        $("forn-nome").value = "";
        $("forn-contato").value = "";
        $("forn-doc").value = "";
        showToast('Fornecedor criado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar fornecedor', 'error');
      }
    }

    async function createCategoria() {
      const nome = $("cat-nome").value.trim();
      const grupo = $("cat-grupo").value.trim();
      const cor = $("cat-cor").value;

      if (!nome) {
        showToast('Digite o nome da categoria', 'warning');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).categoriasCol, {
          nome,
          grupo: grupo || null,
          cor: cor || "#3b82f6",
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        $("cat-nome").value = "";
        $("cat-grupo").value = "";
        showToast('Categoria criada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar categoria', 'error');
      }
    }

    async function createDeducao() {
      const nome = $("ded-nome").value.trim();
      const tipo = $("ded-tipo").value;
      const base = $("ded-base").value;
      const valor = parseFloat($("ded-valor").value);

      if (!nome || !valor || valor <= 0) {
        showToast('Preencha todos os campos corretamente', 'warning');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).deducoesCol, {
          nome,
          tipo,
          base,
          valor,
          // Manter compatibilidade com dados antigos
          percentual: tipo === 'percentual' ? valor : 0,
          createdAt: serverTimestamp()
        });
        $("ded-nome").value = "";
        $("ded-valor").value = "";
        showToast('Dedução criada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar dedução', 'error');
      }
    }

    async function saveSocios() {
      const socioA = $("socio-a").value.trim() || "Sócio A";
      const socioB = $("socio-b").value.trim() || "Sócio B";

      try {
        await setDoc(refs(OBRA_ID).configDoc, {
          socioA,
          socioB,
          updatedAt: serverTimestamp()
        }, { merge: true });
        showToast('Sócios salvos com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao salvar sócios', 'error');
      }
    }

    async function addLancamento(e) {
      e.preventDefault();

      const data = $("lanc-data").value;
      const vencimento = $("lanc-vencimento").value || null;
      const competencia = $("lanc-competencia").value || data;
      const unidadeId = $("lanc-unidade").value;
      const categoriaId = $("lanc-categoria").value;
      const fornecedorId = $("lanc-fornecedor").value;
      const pagador = $("lanc-pagador").value;
      const valor = parseFloat($("lanc-valor").value);
      const status = $("lanc-status").value;
      const descricao = $("lanc-descricao").value.trim();
      const comprovante = $("lanc-comprovante").value.trim();

      if (!data || !unidadeId || !categoriaId || !fornecedorId || !valor || !descricao) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
      }

      // Validação de duplicatas
      const possiveisDuplicatas = state.lancamentos.filter(l =>
        l.fornecedorId === fornecedorId &&
        Math.abs(l.valor - valor) < 0.01 &&
        Math.abs(new Date(l.data) - new Date(data)) < 7 * 24 * 60 * 60 * 1000
      );

      if (possiveisDuplicatas.length > 0) {
        const fornecedorNome = state.fornecedores.find(f => f.id === fornecedorId)?.nome;
        if (!confirm(`⚠️ POSSÍVEL DUPLICATA!\n\nJá existe ${possiveisDuplicatas.length} lançamento(s) similar(es):\n- Fornecedor: ${fornecedorNome}\n- Valor: R$ ${valor.toFixed(2)}\n- Data próxima\n\nDeseja continuar mesmo assim?`)) {
          return;
        }
      }

      try {
        await addDoc(refs(OBRA_ID).lancamentosCol, {
          data,
          dataVencimento: vencimento,
          dataCompetencia: competencia,
          unidadeId,
          categoriaId,
          fornecedorId,
          pagador,
          valor,
          status,
          descricao,
          comprovante: comprovante || null,
          createdAt: serverTimestamp(),
          createdBy: state.user.email,
          historico: [{
            acao: 'created',
            usuario: state.user.email,
            data: new Date().toISOString()
          }]
        });
        $("lanc-form").reset();
        showToast('Lançamento criado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar lançamento', 'error');
      }
    }

    async function ratearIgualmente() {
      const fornecedorId = $("rat-fornecedor").value;
      const categoriaId = $("rat-categoria").value;
      const descricao = $("rat-descricao").value.trim();
      const valorTotal = parseFloat($("rat-valor-total").value);
      const data = $("rat-data").value;

      if (!fornecedorId || !categoriaId || !descricao || !valorTotal || !data) {
        showToast('Preencha os campos principais antes de ratear', 'warning');
        return;
      }

      if (state.unidades.length === 0) {
        showToast('Nenhuma unidade cadastrada', 'error');
        return;
      }

      if (!confirm(`Ratear R$ ${valorTotal.toFixed(2)} igualmente entre ${state.unidades.length} unidades?`)) {
        return;
      }

      const valorPorUnidade = valorTotal / state.unidades.length;
      const vencimento = $("rat-vencimento").value || null;
      const status = $("rat-status").value;

      try {
        await addDoc(refs(OBRA_ID).rateiosCol, {
          data,
          dataVencimento: vencimento,
          dataCompetencia: data,
          fornecedorId,
          categoriaId,
          descricao,
          valorTotal,
          status,
          distribuicao: state.unidades.map(u => ({
            unidadeId: u.id,
            valor: parseFloat(valorPorUnidade.toFixed(2))
          })),
          createdAt: serverTimestamp(),
          createdBy: state.user.email,
          historico: [{
            acao: 'created',
            usuario: state.user.email,
            data: new Date().toISOString()
          }]
        });
        $("rat-form")?.reset();
        rateioDestCount = 0;
        $("rat-dests").innerHTML = "";
        rateioAddDest();
        showToast(`Rateio criado! R$ ${valorPorUnidade.toFixed(2)} por unidade`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar rateio', 'error');
      }
    }

    async function addRateio() {
      const data = $("rat-data").value;
      const vencimento = $("rat-vencimento").value || null;
      const status = $("rat-status").value;
      const fornecedorId = $("rat-fornecedor").value;
      const categoriaId = $("rat-categoria").value;
      const descricao = $("rat-descricao").value.trim();
      const valorTotal = parseFloat($("rat-valor-total").value);

      if (!data || !fornecedorId || !categoriaId || !descricao || !valorTotal) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
      }

      // Collect destinations
      const distribuicao = [];
      const destEls = document.querySelectorAll(".rat-dest-unidade");
      for (let i = 0; i < destEls.length; i++) {
        const unidadeId = destEls[i].value;
        const valorInput = destEls[i].parentElement.parentElement.querySelector(".rat-dest-valor");
        const valor = parseFloat(valorInput.value);
        if (unidadeId && valor) {
          distribuicao.push({ unidadeId, valor });
        }
      }

      if (distribuicao.length === 0) {
        showToast('Adicione pelo menos um destino', 'warning');
        return;
      }

      const somaDistribuicao = distribuicao.reduce((sum, d) => sum + d.valor, 0);
      if (Math.abs(somaDistribuicao - valorTotal) > 0.01) {
        showToast(`A soma da distribuição (R$ ${somaDistribuicao.toFixed(2)}) não bate com o valor total (R$ ${valorTotal.toFixed(2)})`, 'error');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).rateiosCol, {
          data,
          dataVencimento: vencimento,
          dataCompetencia: data,
          fornecedorId,
          categoriaId,
          descricao,
          valorTotal,
          status,
          distribuicao,
          createdAt: serverTimestamp(),
          createdBy: state.user.email,
          historico: [{
            acao: 'created',
            usuario: state.user.email,
            data: new Date().toISOString()
          }]
        });
        $("rat-data").value = "";
        $("rat-vencimento").value = "";
        $("rat-fornecedor").value = "";
        $("rat-categoria").value = "";
        $("rat-descricao").value = "";
        $("rat-valor-total").value = "";
        rateioDestCount = 0;
        $("rat-dests").innerHTML = "";
        rateioAddDest();
        showToast('Rateio criado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao criar rateio', 'error');
      }
    }

    async function addRecebimento(e) {
      e.preventDefault();

      const data = $("receb-data").value;
      const unidadeId = $("receb-unidade").value;
      const tipo = $("receb-tipo").value;
      const valor = parseFloat($("receb-valor").value);
      const formaPagamento = $("receb-forma").value;
      const recebidoPor = $("receb-recebido-por").value;
      const observacoes = $("receb-obs").value.trim();

      if (!data || !unidadeId || !valor || !recebidoPor) {
        showToast('Preencha todos os campos obrigatórios', 'warning');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).recebimentosCol, {
          data,
          unidadeId,
          tipo,
          valor,
          formaPagamento,
          recebidoPor,
          observacoes,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        $("receb-form").reset();
        showToast('Recebimento registrado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao registrar recebimento', 'error');
      }
    }

    async function addAcerto(e) {
      e.preventDefault();

      const data = $("ac-data").value;
      const de = $("ac-de").value;
      const para = $("ac-para").value;
      const valor = parseFloat($("ac-valor").value);
      const descricao = $("ac-descricao").value.trim();

      if (!data || !valor || !descricao || de === para) {
        showToast('Preencha corretamente (De ≠ Para)', 'error');
        return;
      }

      try {
        await addDoc(refs(OBRA_ID).acertosCol, {
          data,
          de,
          para,
          valor,
          descricao,
          createdAt: serverTimestamp(),
          createdBy: state.user.email
        });
        $("acerto-form").reset();
        showToast('Acerto registrado com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao registrar acerto', 'error');
      }
    }

    // DELETE FUNCTIONS
    window.deleteObra = async (id) => {
      if (!confirm('Deletar obra? ATENÇÃO: Todos os dados da obra serão perdidos!')) return;
      try {
        await deleteDoc(doc(db, "obras", id));
        showToast('Obra deletada', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar obra', 'error');
      }
    };

    window.deleteUnidade = async (id) => {
      if (!confirm('Deletar unidade?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "unidades", id));
        showToast('Unidade deletada', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar unidade', 'error');
      }
    };

    window.editUnidade = async (id) => {
      const unidade = state.unidades.find(u => u.id === id);
      if (!unidade) return;

      // Preencher formulário com dados atuais
      $("unid-new-nome").value = unidade.nome || "";
      $("unid-new-area").value = unidade.areaConstruida || "";
      $("unid-new-status").value = unidade.status || "disponivel";
      $("unid-new-proprietario").value = unidade.proprietario || "ambos";
      $("unid-new-vgv").value = unidade.vgvPrevisto || "";
      $("unid-new-venda").value = unidade.valorVenda || "";

      // Mudar botão para modo edição
      const btn = $("unid-create");
      btn.textContent = "💾 Salvar Alterações";
      btn.onclick = async () => {
        const nome = $("unid-new-nome").value.trim();
        const area = parseFloat($("unid-new-area").value) || 0;
        const status = $("unid-new-status").value;
        const proprietario = $("unid-new-proprietario").value;
        const vgv = parseFloat($("unid-new-vgv").value) || 0;
        const valorVenda = parseFloat($("unid-new-venda").value) || null;

        if (!nome) {
          showToast('Digite o nome da unidade', 'warning');
          return;
        }

        try {
          await updateDoc(doc(db, "obras", OBRA_ID, "unidades", id), {
            nome,
            areaConstruida: area,
            status,
            proprietario,
            vgvPrevisto: vgv,
            valorVenda,
            updatedAt: serverTimestamp()
          });
          
          // Resetar formulário e botão
          $("unid-new-nome").value = "";
          $("unid-new-area").value = "";
          $("unid-new-vgv").value = "";
          $("unid-new-venda").value = "";
          btn.textContent = "Criar Unidade";
          btn.onclick = createUnidade;
          
          showToast('Unidade atualizada com sucesso!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Erro ao atualizar unidade', 'error');
        }
      };

      // Scroll para o formulário
      $("unid-new-nome").scrollIntoView({ behavior: 'smooth', block: 'center' });
      $("unid-new-nome").focus();
    };

    window.sugerirAcerto = async () => {
      const eq = computeEqualizacao();
      if (!eq || !eq.mensagem) {
        showToast('Não há acerto pendente', 'info');
        return;
      }

      // Determinar quem deve pagar para quem
      let de, para, valor;
      if (eq.saldoFinalA > 0) {
        // A tem a receber, B deve pagar para A
        de = "B";
        para = "A";
        valor = Math.abs(eq.saldoFinalA);
      } else {
        // B tem a receber, A deve pagar para B
        de = "A";
        para = "B";
        valor = Math.abs(eq.saldoFinalB);
      }

      // Navegar para a view de acertos
      navigateTo('ACERTOS');

      // Aguardar um pouco para garantir que a view foi carregada
      await new Promise(resolve => setTimeout(resolve, 100));

      // Preencher formulário
      const hoje = new Date().toISOString().split('T')[0];
      $("ac-data").value = hoje;
      $("ac-de").value = de;
      $("ac-para").value = para;
      $("ac-valor").value = valor.toFixed(2);
      $("ac-descricao").value = `Equalização automática - ${new Date().toLocaleDateString('pt-BR')}`;

      // Focar no campo de descrição
      $("ac-descricao").focus();
      $("ac-descricao").select();

      showToast('✨ Formulário preenchido! Revise e salve o acerto.', 'success');
    };

    window.deleteFornecedor = async (id) => {
      if (!confirm('Deletar fornecedor?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "fornecedores", id));
        showToast('Fornecedor deletado', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar fornecedor', 'error');
      }
    };

    window.deleteCategoria = async (id) => {
      if (!confirm('Deletar categoria?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "categorias", id));
        showToast('Categoria deletada', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar categoria', 'error');
      }
    };

    window.deleteDeducao = async (id) => {
      if (!confirm('Deletar dedução?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "deducoes", id));
        showToast('Dedução deletada', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar dedução', 'error');
      }
    };

    window.deleteLancamento = async (id) => {
      if (!confirm('Deletar lançamento?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "lancamentos", id));
        showToast('Lançamento deletado', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar lançamento', 'error');
      }
    };

    window.deleteRateio = async (id) => {
      if (!confirm('Deletar rateio?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "rateios", id));
        showToast('Rateio deletado', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar rateio', 'error');
      }
    };

    window.deleteAcerto = async (id) => {
      if (!confirm('Deletar acerto?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "acertos", id));
        showToast('Acerto deletado', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar acerto', 'error');
      }
    };

    window.deleteRecebimento = async (id) => {
      if (!confirm('Deletar recebimento?')) return;
      try {
        await deleteDoc(doc(db, "obras", OBRA_ID, "recebimentos", id));
        showToast('Recebimento deletado', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao deletar recebimento', 'error');
      }
    };

    // STATUS CHANGE
    window.mudarStatusLancamento = async (id) => {
      const lancamento = state.lancamentos.find(l => l.id === id);
      if (!lancamento) return;

      const statusAtual = lancamento.status || "pendente";
      const proximoStatus = {
        "pendente": "pago",
        "pago": "pendente",
        "atrasado": "pago"
      };

      const novoStatus = proximoStatus[statusAtual];

      try {
        await updateDoc(doc(db, "obras", OBRA_ID, "lancamentos", id), {
          status: novoStatus,
          historico: [...(lancamento.historico || []), {
            acao: 'status_changed',
            de: statusAtual,
            para: novoStatus,
            usuario: state.user.email,
            data: new Date().toISOString()
          }]
        });
        showToast(`Status alterado para: ${novoStatus}`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao alterar status', 'error');
      }
    };

    window.mudarStatusRateio = async (id) => {
      const rateio = state.rateios.find(r => r.id === id);
      if (!rateio) return;

      const statusAtual = rateio.status || "pendente";
      const proximoStatus = {
        "pendente": "pago",
        "pago": "pendente",
        "atrasado": "pago"
      };

      const novoStatus = proximoStatus[statusAtual];

      try {
        await updateDoc(doc(db, "obras", OBRA_ID, "rateios", id), {
          status: novoStatus,
          historico: [...(rateio.historico || []), {
            acao: 'status_changed',
            de: statusAtual,
            para: novoStatus,
            usuario: state.user.email,
            data: new Date().toISOString()
          }]
        });
        showToast(`Status alterado para: ${novoStatus}`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao alterar status', 'error');
      }
    };

    // COMPUTE FUNCTIONS
    function computeCustoTotal(lancs = null, rats = null) {
      if (!lancs) lancs = getLancamentosFiltrados();
      if (!rats) rats = getRateiosFiltrados();

      const custoLanc = lancs.reduce((sum, l) => sum + l.valor, 0);
      const custoRat = rats.reduce((sum, r) => sum + r.valorTotal, 0);
      return custoLanc + custoRat;
    }

    function computeLucro(lancs = null, rats = null) {
      if (!lancs) lancs = getLancamentosFiltrados();
      if (!rats) rats = getRateiosFiltrados();

      // Usa valor real de venda quando disponível, senão usa VGV previsto
      const vgvTotal = state.unidades.reduce((sum, u) => sum + (u.valorVenda || u.vgvPrevisto || 0), 0);
      const custoTotal = computeCustoTotal(lancs, rats);
      const lucroBruto = vgvTotal - custoTotal;

      let valorDeducoes = 0;
      const deducoesAplicadas = [];
      
      state.deducoes.forEach(d => {
        let valorDeducao = 0;
        const tipo = d.tipo || 'percentual';
        const base = d.base || 'lucro';
        const valor = d.valor || d.percentual || 0;
        
        if (tipo === 'percentual') {
          // Aplica percentual sobre a base escolhida
          const baseCalculo = base === 'venda' || base === 'vgv' ? vgvTotal : lucroBruto;
          valorDeducao = (valor / 100) * baseCalculo;
        } else {
          // Valor fixo não precisa de cálculo
          valorDeducao = valor;
        }
        
        valorDeducoes += valorDeducao;
        deducoesAplicadas.push({ 
          ...d, 
          valorDeducao,
          displayTipo: tipo === 'percentual' ? `${valor.toFixed(2)}%` : `R$ ${valor.toFixed(2)}`,
          displayBase: base === 'lucro' ? 'Lucro Bruto' : 'Valor de Venda'
        });
      });

      const lucroLiquido = lucroBruto - valorDeducoes;

      const lucroLiquidoA = lucroLiquido / 2;
      const lucroLiquidoB = lucroLiquido / 2;

      return {
        vgvTotal,
        custoTotal,
        lucroBruto,
        valorDeducoes,
        deducoes: deducoesAplicadas,
        lucroLiquido,
        lucroLiquidoA,
        lucroLiquidoB
      };
    }

    function computeEqualizacao() {
      const socioA = state.config.socioA || "Sócio A";
      const socioB = state.config.socioB || "Sócio B";

      // 0. INVESTIMENTOS INICIAIS (sinal do terreno, etc)
      const obra = state.obras.find(o => o.id === OBRA_ID);
      const investimentoA = obra?.investimentoA || 0;
      const investimentoB = obra?.investimentoB || 0;

      // 1. RECEBIMENTOS
      let recebeuFisicamenteA = 0; // Quanto A recebeu fisicamente
      let recebeuFisicamenteB = 0; // Quanto B recebeu fisicamente
      let temDireitoA = 0; // Quanto A tem direito (baseado no proprietário)
      let temDireitoB = 0; // Quanto B tem direito (baseado no proprietário)

      state.recebimentos.forEach(r => {
        const recebidoPor = r.recebidoPor || "ambos";
        const unidade = state.unidades.find(u => u.id === r.unidadeId);
        const proprietario = unidade?.proprietario || "ambos";

        // Quem recebeu fisicamente
        if (recebidoPor === "A") {
          recebeuFisicamenteA += r.valor;
        } else if (recebidoPor === "B") {
          recebeuFisicamenteB += r.valor;
        } else {
          recebeuFisicamenteA += r.valor / 2;
          recebeuFisicamenteB += r.valor / 2;
        }

        // Quem tem direito (baseado no proprietário da unidade)
        if (proprietario === "A") {
          temDireitoA += r.valor;
        } else if (proprietario === "B") {
          temDireitoB += r.valor;
        } else {
          temDireitoA += r.valor / 2;
          temDireitoB += r.valor / 2;
        }
      });

      const totalRecebido = recebeuFisicamenteA + recebeuFisicamenteB;

      // Diferença entre o que recebeu fisicamente e o que tem direito
      // Se A recebeu mais do que tem direito, deve passar para B
      const deveRepassarA = recebeuFisicamenteA - temDireitoA; // Positivo = deve passar, Negativo = deve receber
      const deveRepassarB = recebeuFisicamenteB - temDireitoB;

      // 2. GASTOS (Dinheiro que saiu - quem efetivamente pagou)
      let pagouA = 0;
      let pagouB = 0;

      state.lancamentos.forEach(l => {
        if (l.pagador === "A") {
          pagouA += l.valor;
        } else {
          pagouB += l.valor;
        }
      });

      state.rateios.forEach(r => {
        const totalRateio = r.distribuicao?.reduce((sum, d) => sum + d.valor, 0) || 0;
        if (r.pagador === "A") {
          pagouA += totalRateio;
        } else {
          pagouB += totalRateio;
        }
      });

      // Total de gastos
      const totalGasto = pagouA + pagouB;

      // 3. CADA UM DEVERIA PAGAR METADE DOS GASTOS
      const deveGastarA = totalGasto / 2;
      const deveGastarB = totalGasto / 2;

      // 4. DIFERENÇA DE GASTOS
      // Se A pagou mais que devia, B deve para A
      const diferencaGastosA = pagouA - deveGastarA;
      const diferencaGastosB = pagouB - deveGastarB;

      // 5. SALDO BRUTO (antes de acertos e investimentos iniciais)
      // Combina: (quanto deve repassar de recebimentos) + (quanto deve receber de gastos)
      // Se deveRepassarA é positivo (recebeu mais), diminui o saldo
      // Se diferencaGastosA é positivo (pagou mais), aumenta o saldo
      let saldoBrutoA = diferencaGastosA - deveRepassarA;
      let saldoBrutoB = diferencaGastosB - deveRepassarB;

      // 5.1 ADICIONAR INVESTIMENTOS INICIAIS
      // Se A investiu mais no início (ex: sinal do terreno), B deve compensar
      const diferencaInvestimento = investimentoA - investimentoB;
      saldoBrutoA += diferencaInvestimento;  // Se A investiu mais, aumenta seu saldo
      saldoBrutoB -= diferencaInvestimento;  // Se A investiu mais, diminui saldo de B

      // 6. APLICAR ACERTOS (transferências entre sócios)
      let saldoFinalA = saldoBrutoA;
      let saldoFinalB = saldoBrutoB;

      state.acertos.forEach(a => {
        if (a.de === "A" && a.para === "B") {
          // A transferiu dinheiro para B
          saldoFinalA -= a.valor;  // A diminui saldo (deu dinheiro)
          saldoFinalB += a.valor;  // B aumenta saldo (recebeu dinheiro)
        } else if (a.de === "B" && a.para === "A") {
          // B transferiu dinheiro para A
          saldoFinalB -= a.valor;
          saldoFinalA += a.valor;
        }
      });

      // 7. SALDO DE CAIXA (informativo)
      const saldoCaixaA = recebeuFisicamenteA - pagouA;
      const saldoCaixaB = recebeuFisicamenteB - pagouB;

      // Retornar dados completos para exibição
      return {
        socioA,
        socioB,
        investimentoA,
        investimentoB,
        recebeuA: recebeuFisicamenteA,
        recebeuB: recebeuFisicamenteB,
        temDireitoA,
        temDireitoB,
        deveRepassarA,
        deveRepassarB,
        pagouA,
        pagouB,
        deveGastarA,
        deveGastarB,
        saldoCaixaA,
        saldoCaixaB,
        diferencaGastosA,
        diferencaGastosB,
        saldoBrutoA,
        saldoBrutoB,
        saldoFinalA,
        saldoFinalB,
        totalRecebido,
        totalGasto,
        mensagem: getSugestaoEqualizacao(saldoFinalA, saldoFinalB, socioA, socioB)
      };
    }

    function getSugestaoEqualizacao(saldoA, saldoB, nomeA, nomeB) {
      if (Math.abs(saldoA) < 1 && Math.abs(saldoB) < 1) {
        return null;
      }

      if (saldoA > 0) {
        // A pagou a mais, então B deve para A
        return `${nomeB} deve transferir R$ ${Math.abs(saldoA).toFixed(2)} para ${nomeA}`;
      } else {
        // A pagou a menos, então A deve para B
        return `${nomeA} deve transferir R$ ${Math.abs(saldoA).toFixed(2)} para ${nomeB}`;
      }
    }

    // PDF EXPORT
    function exportPDF() {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Header com logo e título
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text("🏗️ VG CONSTRUTORA", 105, 15, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text("RELATÓRIO GERENCIAL COMPLETO", 105, 25, { align: 'center' });

      const obra = state.obras.find(o => o.id === OBRA_ID);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.text(`Obra: ${obra?.nome || "N/A"}`, 14, 45);
      pdf.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 50);
      pdf.text(`Gerado por: ${state.user.email}`, 14, 55);

      // Linha separadora
      pdf.setDrawColor(203, 213, 225);
      pdf.line(14, 60, 196, 60);

      const lancs = getLancamentosFiltrados();
      const rats = getRateiosFiltrados();
      const custoTotal = computeCustoTotal(lancs, rats);
      const lucroData = computeLucro(lancs, rats);
      const totalRecebido = state.recebimentos.reduce((sum, r) => sum + r.valor, 0);
      const aReceber = lucroData.vgvTotal - totalRecebido;
      const fluxoCaixa = totalRecebido - custoTotal;

      // KPIs Principais
      let y = 70;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, y, 182, 8, 'F');
      pdf.setFontSize(13);
      pdf.setFont(undefined, 'bold');
      pdf.text("📊 INDICADORES FINANCEIROS", 105, y + 6, { align: 'center' });

      y += 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      const kpis = [
        { label: '💰 Custo Total', value: custoTotal },
        { label: '💎 VGV Previsto', value: lucroData.vgvTotal },
        { label: '💵 Recebido', value: totalRecebido },
        { label: '📊 A Receber', value: aReceber },
        { label: '🏦 Fluxo de Caixa', value: fluxoCaixa },
        { label: '📈 Lucro Bruto', value: lucroData.lucroBruto },
        { label: '💵 Lucro Líquido', value: lucroData.lucroLiquido }
      ];

      kpis.forEach((kpi, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 14 + (col * 95);
        const yPos = y + (row * 8);
        
        pdf.text(kpi.label, x, yPos);
        pdf.setFont(undefined, 'bold');
        const color = kpi.value >= 0 ? [5, 150, 105] : [220, 38, 38];
        pdf.setTextColor(...color);
        pdf.text(`R$ ${kpi.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, x + 85, yPos, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
      });

      y += 40;

      // ROI e Métricas Avançadas
      if (obra?.dataInicio) {
        const inicio = new Date(obra.dataInicio);
        const fim = obra.dataRecebimento ? new Date(obra.dataRecebimento) : new Date();
        const diasOperacao = Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
        const mesesOperacao = diasOperacao / 30;
        const roi = custoTotal > 0 ? ((lucroData.lucroLiquido / custoTotal) * 100) : 0;
        const roiMensal = mesesOperacao > 0 ? (roi / mesesOperacao) : 0;

        pdf.setFillColor(241, 245, 249);
        pdf.rect(14, y, 182, 8, 'F');
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(13);
        pdf.text("📈 ANÁLISE DE RENTABILIDADE", 105, y + 6, { align: 'center' });

        y += 15;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');

        pdf.text(`📅 Início da Construção: ${inicio.toLocaleDateString('pt-BR')}`, 14, y);
        y += 6;
        pdf.text(`⏱️ Tempo de Operação: ${diasOperacao} dias (${mesesOperacao.toFixed(1)} meses)`, 14, y);
        y += 6;
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(`📊 ROI Total: ${roi.toFixed(2)}%`, 14, y);
        pdf.setTextColor(99, 102, 241);
        pdf.text(`📈 ROI Mensal: ${roiMensal.toFixed(2)}%/mês`, 110, y);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
        y += 10;
      }

      // Lucro por Sócio
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, y, 182, 8, 'F');
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(13);
      pdf.text("👥 DISTRIBUIÇÃO POR SÓCIO (50/50)", 105, y + 6, { align: 'center' });

      y += 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      const investimentoPorSocio = custoTotal / 2;
      const lucroPorSocio = lucroData.lucroLiquido / 2;

      pdf.text(`👤 ${state.config.socioA || 'Sócio A'}`, 14, y);
      pdf.text(`Investimento: R$ ${investimentoPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 24, y + 6);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(5, 150, 105);
      pdf.text(`Lucro: R$ ${lucroPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 24, y + 12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');

      y += 22;
      pdf.text(`👤 ${state.config.socioB || 'Sócio B'}`, 14, y);
      pdf.text(`Investimento: R$ ${investimentoPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 24, y + 6);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(5, 150, 105);
      pdf.text(`Lucro: R$ ${lucroPorSocio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 24, y + 12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');

      y += 20;

      // Top 5 Categorias
      if (y > 240) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, y, 182, 8, 'F');
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(13);
      pdf.text("🏆 TOP 5 CATEGORIAS", 105, y + 6, { align: 'center' });

      y += 15;
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');

      const custoPorCategoria = {};
      lancs.forEach(l => {
        const cat = state.categorias.find(c => c.id === l.categoriaId);
        const nome = cat?.nome || 'Sem categoria';
        custoPorCategoria[nome] = (custoPorCategoria[nome] || 0) + l.valor;
      });
      rats.forEach(r => {
        const cat = state.categorias.find(c => c.id === r.categoriaId);
        const nome = cat?.nome || 'Sem categoria';
        custoPorCategoria[nome] = (custoPorCategoria[nome] || 0) + r.valorTotal;
      });

      const topCategorias = Object.entries(custoPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      topCategorias.forEach(([nome, valor], i) => {
        const perc = custoTotal > 0 ? (valor / custoTotal * 100) : 0;
        pdf.text(`${i + 1}. ${nome}`, 14, y);
        pdf.text(`R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${perc.toFixed(1)}%)`, 160, y, { align: 'right' });
        y += 6;
      });

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(0, 287, 210, 10, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`VG CONSTRUTORA - Sistema de Gestão de Obras`, 105, 293, { align: 'center' });
        pdf.text(`Página ${i} de ${pageCount}`, 196, 293, { align: 'right' });
      }

      const filename = `VG_${obra?.nome || 'Obra'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      showToast('Relatório PDF gerado com sucesso!', 'success');
    }

  
