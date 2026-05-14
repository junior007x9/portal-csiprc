const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });

    const { numeroAcesso, password } = req.body;

    if (!numeroAcesso || !password) {
        return res.status(400).json({ success: false, message: 'Número de acesso e senha são obrigatórios' });
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // 1. Busca APENAS pela matrícula (não procuramos mais pela senha diretamente no banco)
        const result = await client.execute({
            sql: 'SELECT id, numero_acesso, senha, nome_completo, email, role FROM servidores WHERE numero_acesso = ?',
            args: [numeroAcesso]
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            // 2. Compara a senha digitada com a senha criptografada guardada no Turso
            const senhaValida = bcrypt.compareSync(password, user.senha);

            if (senhaValida) {
                // 3. Apaga a senha criptografada da memória antes de devolver os dados ao frontend (Segurança máxima)
                delete user.senha;
                return res.status(200).json({ success: true, user: user });
            } else {
                return res.status(401).json({ success: false, message: 'Número de acesso ou senha incorretos' });
            }
        } else {
            return res.status(401).json({ success: false, message: 'Número de acesso ou senha incorretos' });
        }

    } catch (error) {
        console.error("Erro no Banco de Dados:", error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
}