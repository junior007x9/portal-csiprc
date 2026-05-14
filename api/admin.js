const { createClient } = require('@libsql/client');

module.exports = async function handler(req, res) {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const { action, masterPassword, userData, userId } = req.body;

    // VERIFICAÇÃO DE SEGURANÇA
    if (masterPassword !== process.env.ADMIN_MASTER_PASSWORD) {
        return res.status(403).json({ success: false, message: 'Senha Mestre Inválida' });
    }

    try {
        if (req.method === 'POST' && action === 'LISTAR') {
            const result = await client.execute('SELECT * FROM servidores');
            return res.status(200).json({ success: true, users: result.rows });
        }

        if (req.method === 'POST' && action === 'CADASTRAR') {
            await client.execute({
                sql: 'INSERT INTO servidores (numero_acesso, senha, nome_completo, email, role) VALUES (?, ?, ?, ?, ?)',
                args: [userData.numero, userData.senha, userData.nome, userData.email, userData.role]
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