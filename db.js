// Função de Conexão
async function connect() {

    // Classe Pool gerencia o pool de conexões no pgAdmin
    const { Pool } = require('pg');

    // Add a pool os valores para a conexão (lá de .env)
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    console.log('BD conectado com Sucesso!');
    return pool;
}

// Chamada à função - para criar a conexão com o BD
connect();