import { createClient } from '@libsql/client';

export default async function handler(req, res) {
    // Permite apenas requisições POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }

    // Agora recebemos o Número de Acesso (matrícula) e a Senha do frontend
    const { numeroAcesso, password } = req.body;

    if (!numeroAcesso || !password) {
        return res.status(400).json({ success: false, message: 'Número de acesso e senha são obrigatórios' });
    }

    try {
        // Conecta ao banco de dados Turso usando as variáveis de ambiente da Vercel
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Consulta a tabela "servidores" 
        // Estrutura esperada no BD Turso: tabela "servidores" com colunas (numero_acesso, senha, nome_completo, email, role)
        const result = await client.execute({
            sql: 'SELECT numero_acesso, nome_completo, email, role FROM servidores WHERE numero_acesso = ? AND senha = ?',
            args: [numeroAcesso, password]
        });

        // Verifica se o servidor foi encontrado
        if (result.rows.length > 0) {
            const user = result.rows[0];
            return res.status(200).json({ success: true, user: user });
        } else {
            return res.status(401).json({ success: false, message: 'Número de acesso ou senha incorretos' });
        }

    } catch (error) {
        console.error("Erro no Banco de Dados:", error);
        return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
}