const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });

    // A MÁGICA: Aceita tanto o nome novo (identificacao) quanto o velho (numeroAcesso) do cache!
    const identificacao = req.body.identificacao || req.body.numeroAcesso;
    const password = req.body.password;

    if (!identificacao || !password) {
        return res.status(400).json({ success: false, message: 'Identificação e senha são obrigatórios' });
    }

    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        const result = await client.execute({
            sql: 'SELECT id, numero_acesso, senha, nome_completo, email, role FROM servidores WHERE numero_acesso = ? OR email = ?',
            args: [identificacao, identificacao]
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const senhaValida = bcrypt.compareSync(password, user.senha);

            if (senhaValida) {
                const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
                delete user.senha; 

                try {
                    await client.execute({
                        sql: 'INSERT INTO logs_acesso (servidor_nome, matricula, data_hora) VALUES (?, ?, datetime("now", "-3 hours"))',
                        args: [user.nome_completo, user.numero_acesso]
                    });
                } catch (errLog) {}

                let mensagemAviso = null;
                try {
                    const avisoRes = await client.execute('SELECT mensagem FROM avisos WHERE ativo = 1 LIMIT 1');
                    if (avisoRes.rows.length > 0) mensagemAviso = avisoRes.rows[0].mensagem;
                } catch(errAviso) {}

                return res.status(200).json({ success: true, user, token, aviso: mensagemAviso });
            }
        }
        
        return res.status(401).json({ success: false, message: 'Matrícula, E-mail ou senha incorretos' });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro interno: ' + error.message });
    }
}