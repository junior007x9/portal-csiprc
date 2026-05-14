const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs'); // Puxa a biblioteca de criptografia

module.exports = async function handler(req, res) {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const { action, masterPassword, userData, userId } = req.body;

    // VERIFICAÇÃO DE SEGURANÇA MESTRE
    if (masterPassword !== process.env.ADMIN_MASTER_PASSWORD) {
        return res.status(403).json({ success: false, message: 'Senha Mestre Inválida' });
    }

    try {
        if (req.method === 'POST' && action === 'LISTAR') {
            // Removemos as senhas da lista por segurança extra
            const result = await client.execute('SELECT id, numero_acesso, nome_completo, email, role FROM servidores');
            return res.status(200).json({ success: true, users: result.rows });
        }

        if (req.method === 'POST' && action === 'CADASTRAR') {
            // CRIPTOGRAFIA EM AÇÃO: Transforma a senha normal num código irreversível
            const salt = bcrypt.genSaltSync(10);
            const hashSenha = bcrypt.hashSync(userData.senha, salt);

            await client.execute({
                sql: 'INSERT INTO servidores (numero_acesso, senha, nome_completo, email, role) VALUES (?, ?, ?, ?, ?)',
                args: [userData.numero, hashSenha, userData.nome, userData.email, userData.role]
            });
            return res.status(200).json({ success: true, message: 'Cadastrado com sucesso' });
        }

        if (req.method === 'POST' && action === 'EXCLUIR') {
            await client.execute({
                sql: 'DELETE FROM servidores WHERE id = ?',
                args: [userId]
            });
            return res.status(200).json({ success: true, message: 'Usuário removido' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}