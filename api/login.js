const { createClient } = require('@libsql/client');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    const { numeroAcesso, password } = req.body;

    if (!numeroAcesso || !password) {
        return res.status(400).json({ success: false, message: 'Número de acesso e senha são obrigatórios' });
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        const result = await client.execute({
            sql: 'SELECT numero_acesso, nome_completo, email, role FROM servidores WHERE numero_acesso = ? AND senha = ?',
            args: [numeroAcesso, password]
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return res.status(200).json({ success: true, user: user });
        } else {
            return res.status(401).json({ success: false, message: 'Número de acesso ou senha incorretos' });
        }

    } catch (error) {
        console.error("Erro no Banco de Dados:", error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor: ' + error.message });
    }
}