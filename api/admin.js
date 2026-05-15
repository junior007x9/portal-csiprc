const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
    const { action, masterPassword, userData, userId, token, avisoMsg } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin' && decoded.role !== 'gestao') {
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Sessão inválida' });
    }

    if (masterPassword !== process.env.ADMIN_MASTER_PASSWORD) {
        return res.status(403).json({ success: false, message: 'Senha Mestre Inválida' });
    }

    const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

    try {
        // --- FUNÇÕES ANTIGAS DE GESTÃO DE USUÁRIOS ---
        if (action === 'LISTAR') {
            const result = await client.execute('SELECT id, numero_acesso, nome_completo, email, role FROM servidores');
            return res.status(200).json({ success: true, users: result.rows });
        }
        if (action === 'CADASTRAR') {
            const hash = bcrypt.hashSync(userData.senha, 10);
            await client.execute({ sql: 'INSERT INTO servidores (numero_acesso, senha, nome_completo, email, role) VALUES (?, ?, ?, ?, ?)', args: [userData.numero, hash, userData.nome, userData.email, userData.role] });
            return res.status(200).json({ success: true });
        }
        if (action === 'EDITAR') {
            let sql = 'UPDATE servidores SET nome_completo = ?, email = ?, role = ? WHERE id = ?';
            let args = [userData.nome, userData.email, userData.role, userId];
            if (userData.senha) {
                sql = 'UPDATE servidores SET nome_completo = ?, email = ?, role = ?, senha = ? WHERE id = ?';
                args = [userData.nome, userData.email, userData.role, bcrypt.hashSync(userData.senha, 10), userId];
            }
            await client.execute({ sql, args });
            return res.status(200).json({ success: true });
        }
        if (action === 'EXCLUIR') {
            await client.execute({ sql: 'DELETE FROM servidores WHERE id = ?', args: [userId] });
            return res.status(200).json({ success: true });
        }

        // --- NOVAS FUNÇÕES (AUDITORIA E MURAL) ---
        if (action === 'LISTAR_LOGS') {
            const result = await client.execute('SELECT servidor_nome, matricula, data_hora FROM logs_acesso ORDER BY id DESC LIMIT 50');
            return res.status(200).json({ success: true, logs: result.rows });
        }
        if (action === 'ATUALIZAR_AVISO') {
            // Desativa avisos antigos
            await client.execute('UPDATE avisos SET ativo = 0');
            // Se mandou mensagem nova, ativa ela
            if (avisoMsg && avisoMsg.trim() !== '') {
                await client.execute({ sql: 'INSERT INTO avisos (mensagem, ativo) VALUES (?, 1)', args: [avisoMsg] });
            }
            return res.status(200).json({ success: true });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}