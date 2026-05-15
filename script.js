let masterPass = "";

// Dados dos Sistemas
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

// Carregamento Inicial
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.visibility = 'hidden'; }, 800);
    }, 800);

    const usuarioSalvo = localStorage.getItem('usuarioPortalCSIPRC');
    if (usuarioSalvo) {
        aplicarPermissoes(JSON.parse(usuarioSalvo));
    } else if (window.location.pathname.endsWith('/admin')) {
        document.getElementById('login-screen').style.display = 'none';
        setTimeout(validarAcessoAdmin, 500); 
    }
});

// Lógica de Login
async function fazerLogin() {
    const numeroAcesso = document.getElementById('numero-acesso').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-msg');

    if(!numeroAcesso || !password) return;

    btn.disabled = true;
    btn.innerText = "VERIFICANDO...";
    errorMsg.style.display = "none";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroAcesso, password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('usuarioPortalCSIPRC', JSON.stringify(data.user));
            aplicarPermissoes(data.user);
        } else {
            errorMsg.innerText = data.message || "Número de acesso ou senha inválidos.";
            errorMsg.style.display = "block";
        }
    } catch (err) {
        errorMsg.innerText = "Erro ao conectar com o banco de dados.";
        errorMsg.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.innerText = "ENTRAR";
    }
}

// Lógica de Permissões e Criação de Cartões
function aplicarPermissoes(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-portal').style.display = 'flex';
    document.getElementById('user-role-name').innerText = `OLÁ, ${user.nome_completo.toUpperCase()} | PERFIL: ${user.role.toUpperCase()}`;

    if (user.role === 'gestao' || user.role === 'admin') {
        document.getElementById('btn-abrir-admin').style.display = 'inline-block';
    }

    const container = document.getElementById('cards-container');
    const devContainer = document.getElementById('dev-cards-container');
    const tituloDev = document.getElementById('titulo-dev');
    
    container.innerHTML = '';
    devContainer.innerHTML = '';
    let temCartaoDev = false;

    sistemasOperacionais.forEach(sys => {
        if (sys.perfis.includes(user.role)) container.innerHTML += gerarHtmlCartao(sys, 'ACESSAR SISTEMA');
    });

    sistemasEmDesenvolvimento.forEach(sys => {
        if (sys.perfis.includes(user.role)) {
            devContainer.innerHTML += gerarHtmlCartao(sys, 'ACESSAR BETA');
            temCartaoDev = true;
        }
    });

    if(temCartaoDev) tituloDev.style.display = 'block';
}

function gerarHtmlCartao(sys, textoBotao) {
    return `
    <a href="${sys.link}" target="_blank" class="card ${sys.cor}">
        <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${sys.svg}</svg>
        </div>
        <h3>${sys.titulo}</h3>
        <p>${sys.desc}</p>
        <button>${textoBotao}</button>
    </a>`;
}

function logout() {
    localStorage.removeItem('usuarioPortalCSIPRC');
    window.location.href = '/'; 
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') fazerLogin();
    });
});

// Lógica de Administração
async function validarAcessoAdmin() {
    const senha = prompt("ACESSO RESTRITO\nDigite a SENHA MESTRE da administração:");
    if (!senha) {
        if (window.location.pathname.endsWith('/admin')) window.location.href = '/';
        return;
    }
    masterPass = senha;
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'LISTAR', masterPassword: masterPass })
        });
        const data = await res.json();
        if (data.success) {
            exibirPainelAdmin(data.users);
        } else {
            alert("Acesso Negado: " + (data.message || "Senha Mestre incorreta!"));
            if (window.location.pathname.endsWith('/admin')) window.location.href = '/';
        }
    } catch (err) {
        alert("Erro ao conectar ao servidor.");
        if (window.location.pathname.endsWith('/admin')) window.location.href = '/';
    }
}

function exibirPainelAdmin(users) {
    document.getElementById('main-portal').style.display = 'flex';
    document.getElementById('login-screen').style.display = 'none';
    if (window.location.pathname.endsWith('/admin')) {
        document.getElementById('user-role-name').innerText = "MODO ADMINISTRADOR SUPREMO";
        document.getElementById('btn-abrir-admin').style.display = 'none';
    }
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('admin-panel-ui').style.display = 'block';
    const tbody = document.getElementById('lista-servidores');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td style="font-weight:bold;">${u.nome_completo}</td>
            <td style="color:#38bdf8;">${u.numero_acesso}</td>
            <td style="color:#94a3b8; font-size:0.8rem;">${u.email}</td>
            <td><span class="user-badge">${u.role.toUpperCase()}</span></td>
            <td><button class="btn-excluir" onclick="excluirUsuario(${u.id}, '${u.nome_completo}')">Excluir</button></td>
        </tr>
    `).join('');
}

async function cadastrarUsuario() {
    const userData = {
        nome: document.getElementById('new-nome').value,
        numero: document.getElementById('new-numero').value,
        senha: document.getElementById('new-senha').value,
        email: document.getElementById('new-email').value,
        role: document.getElementById('new-role').value
    };
    if(!userData.nome || !userData.numero || !userData.senha || !userData.email) return alert("Preencha todos os campos para cadastrar!");
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CADASTRAR', masterPassword: masterPass, userData })
        });
        const data = await res.json();
        if (data.success) {
            alert("Servidor cadastrado com sucesso!");
            document.getElementById('new-nome').value = '';
            document.getElementById('new-numero').value = '';
            document.getElementById('new-senha').value = '';
            document.getElementById('new-email').value = '';
            validarAcessoAdmin(); 
        } else alert("Erro ao cadastrar: " + data.message);
    } catch (err) { alert("Erro de conexão."); }
}

async function excluirUsuario(id, nome) {
    if (!confirm(`ATENÇÃO!\nTem certeza que deseja EXCLUIR o acesso de: ${nome}?`)) return;
    try {
        const res = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'EXCLUIR', masterPassword: masterPass, userId: id })
        });
        const data = await res.json();
        if (data.success) validarAcessoAdmin(); 
        else alert("Erro ao excluir: " + data.message);
    } catch (err) { alert("Erro de conexão."); }
}

function fecharAdmin() {
    if (window.location.pathname.endsWith('/admin')) {
        window.location.href = '/'; 
    } else {
        document.getElementById('admin-panel-ui').style.display = 'none';
        document.getElementById('main-content').style.display = 'flex';
    }
}