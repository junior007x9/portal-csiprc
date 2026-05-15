let masterPass = "";
let editandoId = null;

const sistemasOperacionais = [
    { titulo: "RELATÓRIOS DE SEGURANÇA", desc: "Ocorrências, Plantões e Monitoramento Operacional", link: "https://relatorio-seguranca-timon.vercel.app/", cor: "red", perfis: ["seguranca", "admin"], svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 10.5l2 2 4-4"></path>' },
    { titulo: "GESTÃO DE DIÁRIAS", desc: "Frota, Solicitações de Viagens e Contas", link: "https://gestao-viagens-csiprc.vercel.app/", cor: "green", perfis: ["gestao", "admin"], svg: '<path d="M5 11h14l1 4M5 11l-1 4m1 0h16m-16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 11V8a4 4 0 0 1 8 0v3"></path>' },
    { titulo: "TRANSPARÊNCIA", desc: "Controle de Viagens dos Servidores e Prestação de Contas", link: "https://transparencia-csiprc.vercel.app/", cor: "purple", perfis: ["gestao", "admin"], svg: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>' },
    { titulo: "BANCO DE DADOS", desc: "Sistema de banco de dados do CSIPRC", link: "https://banco-csiprc.vercel.app", cor: "blue", perfis: ["tecnica", "admin"], svg: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>' },
    { titulo: "CONTROLE 45 DIAS", desc: "Controle de 45 dias dos adolescentes, relatórios e audiências", link: "https://painel-gestao-sandy.vercel.app/", cor: "blue", perfis: ["tecnica", "admin"], svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>' }
];

const sistemasEmDesenvolvimento = [
    { titulo: "RELATÓRIOS DO CENTRO", desc: "Administração, Educação e Gestão Geral", link: "https://sistema-csiprc-2026.vercel.app/", cor: "blue", perfis: ["gestao", "admin"], svg: '<path d="M16 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"></path><path d="M8 2a2 2 0 0 1 2 2h4a2 2 0 0 1 2-2"></path><path d="M8 10h8m-8 4h6"></path>' },
    { titulo: "EQUIPE TÉCNICA", desc: "Registros, Psicologia e Auxílio em Atendimentos", link: "https://relatorio-equipe-tecnica-psi.vercel.app/", cor: "orange", perfis: ["tecnica", "admin"], svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' }
];

window.addEventListener('load', () => {
    setTimeout(() => { document.getElementById('loader').style.display = 'none'; }, 800);

    const sessao = localStorage.getItem('usuarioPortalCSIPRC');
    // Força o login novamente para gravar log de entrada todos os dias se necessário
    if (sessao) {
        aplicarPermissoes(JSON.parse(sessao));
    }
});

async function fazerLogin() {
    // CORREÇÃO: Pegamos o valor da nova ID 'identificacao'
    const identificacao = document.getElementById('identificacao').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');

    if(!identificacao || !password) return;

    btn.disabled = true;
    btn.innerText = "AUTENTICANDO...";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificacao, password })
        });
        const data = await response.json();

        if (data.success) {
            const userFull = { ...data.user, token: data.token, aviso: data.aviso };
            localStorage.setItem('usuarioPortalCSIPRC', JSON.stringify(userFull));
            aplicarPermissoes(userFull);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Erro de conexão");
    } finally {
        btn.disabled = false;
        btn.innerText = "ENTRAR";
    }
}

function aplicarPermissoes(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-portal').style.display = 'flex';
    document.getElementById('user-role-name').innerText = `OLÁ, ${user.nome_completo.toUpperCase()}`;

    if (user.role === 'gestao' || user.role === 'admin') {
        document.getElementById('btn-abrir-admin').style.display = 'inline-block';
    }

    // Verifica se existe aviso no banco
    const mural = document.getElementById('mural-aviso');
    if (user.aviso && user.aviso.trim() !== "") {
        mural.innerText = "📢 AVISO: " + user.aviso;
        mural.style.display = 'block';
    } else {
        mural.style.display = 'none';
    }

    const container = document.getElementById('cards-container');
    const devContainer = document.getElementById('dev-cards-container');
    const tituloDev = document.getElementById('titulo-dev');
    container.innerHTML = ''; devContainer.innerHTML = '';
    let temDev = false;
    
    sistemasOperacionais.forEach(sys => {
        if (user.role === 'admin' || sys.perfis.includes(user.role)) {
            container.innerHTML += `<a href="${sys.link}" target="_blank" class="card ${sys.cor}"><div class="icon-wrapper"><svg viewBox="0 0 24 24">${sys.svg}</svg></div><h3>${sys.titulo}</h3><p>${sys.desc}</p><button>ACESSAR</button></a>`;
        }
    });

    sistemasEmDesenvolvimento.forEach(sys => {
        if (user.role === 'admin' || sys.perfis.includes(user.role)) {
            devContainer.innerHTML += `<a href="${sys.link}" target="_blank" class="card ${sys.cor}"><div class="icon-wrapper"><svg viewBox="0 0 24 24">${sys.svg}</svg></div><h3>${sys.titulo}</h3><p>${sys.desc}</p><button>ACESSAR BETA</button></a>`;
            temDev = true;
        }
    });

    if(temDev) tituloDev.style.display = 'block';
}

/* ==========================================
   FUNÇÕES DO ADMIN (USUÁRIOS E AUDITORIA)
   ========================================== */

function mudarAbaAdmin(abaId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(abaId).classList.add('active');
    document.getElementById('btn-' + abaId).classList.add('active');
}

async function validarAcessoAdmin() {
    const senha = prompt("SENHA MESTRE:");
    if (!senha) return;
    masterPass = senha;
    carregarPainelAdminCompleto();
}

async function carregarPainelAdminCompleto() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('admin-panel-ui').style.display = 'block';
    carregarListaUsuarios();
    carregarLogs();
}

async function carregarListaUsuarios() {
    const sessao = JSON.parse(localStorage.getItem('usuarioPortalCSIPRC'));
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LISTAR', masterPassword: masterPass, token: sessao.token })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('lista-servidores').innerHTML = data.users.map(u => `
            <tr>
                <td>${u.nome_completo}</td><td>${u.numero_acesso}</td><td><span class="user-badge">${u.role}</span></td>
                <td>
                    <button onclick="prepararEdicao(${JSON.stringify(u).replace(/"/g, '&quot;')})" style="background:#38bdf8; color:black; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Editar</button>
                    <button class="btn-excluir" onclick="excluirUsuario(${u.id}, '${u.nome_completo}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    }
}

async function carregarLogs() {
    const sessao = JSON.parse(localStorage.getItem('usuarioPortalCSIPRC'));
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LISTAR_LOGS', masterPassword: masterPass, token: sessao.token })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('lista-logs').innerHTML = data.logs.map(log => {
            // Formatar Data
            const dataHora = new Date(log.data_hora).toLocaleString('pt-BR');
            return `<tr><td style="color:#f59e0b;">${dataHora}</td><td>${log.servidor_nome}</td><td>${log.matricula}</td></tr>`;
        }).join('');
    }
}

async function salvarAviso() {
    const sessao = JSON.parse(localStorage.getItem('usuarioPortalCSIPRC'));
    const novoAviso = document.getElementById('novo-aviso-texto').value;
    
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ATUALIZAR_AVISO', masterPassword: masterPass, token: sessao.token, avisoMsg: novoAviso })
    });
    const data = await res.json();
    if (data.success) {
        alert("Aviso atualizado! Ele será exibido na tela inicial no próximo login dos servidores.");
        document.getElementById('novo-aviso-texto').value = "";
    } else {
        alert("Erro: " + data.message);
    }
}

function prepararEdicao(user) {
    document.getElementById('new-nome').value = user.nome_completo;
    document.getElementById('new-numero').value = user.numero_acesso;
    document.getElementById('new-numero').disabled = true;
    document.getElementById('new-email').value = user.email;
    document.getElementById('new-role').value = user.role;
    document.getElementById('new-senha').placeholder = "Deixe vazio para manter a senha atual";
    editandoId = user.id;
    document.querySelector('.btn-cadastrar').innerText = "SALVAR ALTERAÇÕES";
}

async function cadastrarUsuario() {
    const sessao = JSON.parse(localStorage.getItem('usuarioPortalCSIPRC'));
    const userData = {
        nome: document.getElementById('new-nome').value,
        numero: document.getElementById('new-numero').value,
        senha: document.getElementById('new-senha').value,
        email: document.getElementById('new-email').value,
        role: document.getElementById('new-role').value
    };

    if(!userData.nome || !userData.email) return alert("Preencha os campos obrigatórios!");

    const action = editandoId ? 'EDITAR' : 'CADASTRAR';
    
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, masterPassword: masterPass, userData, userId: editandoId, token: sessao.token })
    });

    if ((await res.json()).success) {
        alert("Salvo com sucesso!");
        editandoId = null;
        document.getElementById('new-nome').value = '';
        document.getElementById('new-numero').value = '';
        document.getElementById('new-numero').disabled = false;
        document.getElementById('new-senha').placeholder = "Senha";
        document.querySelector('.btn-cadastrar').innerText = "CADASTRAR";
        carregarListaUsuarios();
    }
}

async function excluirUsuario(id, nome) {
    if (!confirm(`Deseja EXCLUIR o acesso de: ${nome}?`)) return;
    const sessao = JSON.parse(localStorage.getItem('usuarioPortalCSIPRC'));
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXCLUIR', masterPassword: masterPass, userId: id, token: sessao.token })
    });
    if ((await res.json()).success) carregarListaUsuarios();
}

function logout() {
    localStorage.removeItem('usuarioPortalCSIPRC');
    location.reload();
}

function fecharAdmin() {
    document.getElementById('admin-panel-ui').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
}