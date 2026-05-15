const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });

    const { numeroAcesso, password } = req.body;

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        const result = await client.execute({
            sql: 'SELECT id, numero_acesso, senha, nome_completo, email, role FROM servidores WHERE numero_acesso = ?',
            args: [numeroAcesso]
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const senhaValida = bcrypt.compareSync(password, user.senha);

            if (senhaValida) {
                // Criar o Token JWT (Vale por 24 horas)
                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                delete user.senha;
                return res.status(200).json({ success: true, user, token });
            }
        }
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
}