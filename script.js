let masterPass = "";
let editandoId = null;

// ... (Mantenha as listas de sistemasOperacionais e sistemasEmDesenvolvimento iguais) ...

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 800);

    const sessao = localStorage.getItem('usuarioPortalCSIPRC');
    if (sessao) aplicarPermissoes(JSON.parse(sessao));
});

async function fazerLogin() {
    const numeroAcesso = document.getElementById('numero-acesso').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.innerText = "AUTENTICANDO...";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroAcesso, password })
        });
        const data = await response.json();

        if (data.success) {
            // Guardamos o utilizador E o token de segurança
            localStorage.setItem('usuarioPortalCSIPRC', JSON.stringify({ ...data.user, token: data.token }));
            aplicarPermissoes({ ...data.user, token: data.token });
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

    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    // Filtro de segurança: O Admin vê tudo, outros vêm apenas o permitido
    sistemasOperacionais.concat(sistemasEmDesenvolvimento).forEach(sys => {
        if (user.role === 'admin' || sys.perfis.includes(user.role)) {
            container.innerHTML += `
            <a href="${sys.link}" target="_blank" class="card ${sys.cor}">
                <div class="icon-wrapper"><svg viewBox="0 0 24 24">${sys.svg}</svg></div>
                <h3>${sys.titulo}</h3>
                <p>${sys.desc}</p>
                <button>ACESSAR</button>
            </a>`;
        }
    });
}

async function validarAcessoAdmin() {
    const senha = prompt("SENHA MESTRE:");
    if (!senha) return;
    masterPass = senha;
    carregarListaUsuarios();
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
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('admin-panel-ui').style.display = 'block';
        const tbody = document.getElementById('lista-servidores');
        tbody.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.nome_completo}</td>
                <td>${u.numero_acesso}</td>
                <td>${u.role}</td>
                <td>
                    <button onclick="prepararEdicao(${JSON.stringify(u).replace(/"/g, '&quot;')})" style="background:#38bdf8; color:black; border:none; padding:5px; border-radius:4px; cursor:pointer;">Editar</button>
                    <button class="btn-excluir" onclick="excluirUsuario(${u.id})">Excluir</button>
                </td>
            </tr>
        `).join('');
    } else alert(data.message);
}

function prepararEdicao(user) {
    document.getElementById('new-nome').value = user.nome_completo;
    document.getElementById('new-numero').value = user.numero_acesso;
    document.getElementById('new-numero').disabled = true; // Matrícula não se muda
    document.getElementById('new-email').value = user.email;
    document.getElementById('new-role').value = user.role;
    document.getElementById('new-senha').placeholder = "Deixe vazio para manter a atual";
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

    const action = editandoId ? 'EDITAR' : 'CADASTRAR';
    
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, masterPassword: masterPass, userData, userId: editandoId, token: sessao.token })
    });

    if ((await res.json()).success) {
        alert("Sucesso!");
        cancelarEdicao();
        carregarListaUsuarios();
    }
}

function cancelarEdicao() {
    editandoId = null;
    document.getElementById('new-nome').value = '';
    document.getElementById('new-numero').value = '';
    document.getElementById('new-numero').disabled = false;
    document.getElementById('new-senha').placeholder = "Senha";
    document.querySelector('.btn-cadastrar').innerText = "CADASTRAR";
}

function logout() {
    localStorage.removeItem('usuarioPortalCSIPRC');
    location.reload();
}

function fecharAdmin() {
    document.getElementById('admin-panel-ui').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
}