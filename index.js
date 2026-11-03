require('dotenv').config();

const { Paciente } = require("./models");
const port = process.env.PORT || 3000;

const express = require("express");
const app = express();

const jwt = require('jsonwebtoken');


app.use(express.json());

//Rotas Públicas
//Rota de boas vindas:
app.get('/', (req, res) => {
    res.send("Seja bem-vindo!").status(200);
});

//Rota de Cadastro:
app.post('/pacientes', async (req, res) => {
    try{
    const {nome, idade, sexo, usuario, senha} = req.body;
    if (!nome || !idade || !sexo || !usuario || !senha) {
        return res.status(400).json({error: "Os campos nome, idade, sexo, usuario e senha deverão ser preenchidos."})
    }
    const novoPaciente = await Paciente.create({
            nome,
            idade,
            sexo,
            usuario,
            senha
        });
        return res.status(201).json(novoPaciente);
    }catch (error) {
        console.error("Erro ao cadastrar paciente:", error);
        return res.status(500).json({ error: "Erro interno no servidor"});
    }
});

//Rota de Login (Gera token):
app.post('/login', async (req, res) => {
    const {usuario, senha} = req.body;

    const user = await Paciente.findOne({ where: { usuario: usuario } });

    //Verificar usuario e senha
    if (!user || user.senha !== senha) {
        return res.status(401).json({mensagem: 'Usuário ou senha invalidos.'});
    }

    //Se estiverem corretas, gerar o token:
    const token = jwt.sign({ userId: user.id, usuario: user.usuario }, process.env.JWT_SECRET, { expiresIn:'15m' });

    //Enviar token para cliente:
    res.json({mensagem: 'Login bem-sucedido!', token: token});
});

//middleware para verificar o JWT:
function verificaJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({mensagem: 'Token de autenticação não fornecido'});
    }
    //O token vem no formato --> "Bearer <token>":
    const token = authHeader.split(' ')[1]; //Dividindo a string em 2, baseado no " " e pegando apenas a posição 1.

    //Verifica se o token é válido:
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res.status(401).json({mensagem: 'Token expirado.'}); //Se o erro for de expiração, a mensagem é mais específica, o resto geral.
            }
            return res.status(401).json({ mensagem: 'Token inválido.' });
        }
        //Se o token for válido, os dados decodificados são adicionados à requisição para uso posterior.
        req.usuarioLogado = decoded;
        next(); //Permite que a rfequisição prossiga para a rota
    });
}

//Rotas Privadas:
//Lista os pacientes cadastrados:
app.get('/pacientes', verificaJWT, async (req, res) => {
    console.log('Acessado por:', req.usuarioLogado);
    const pacientes = await Paciente.findAll();
     res.json({mensagem: `Acesso permitido para o usuário: ${req.usuarioLogado.usuario}.`, pacientes});
});

//Mostra o paciente selecionado pelo id:
app.get('/pacientes/:id', verificaJWT, async (req, res) => {
    try{
        const paciente = await Paciente.findByPk(req.params.id);
        if(!paciente) {
            return res.status(404).json({mensagem: 'Paciente não encontrado'});
        }
        res.status(200).json(paciente);
    } catch (error) {
        res.status(500).json({mensagem: 'Erro ao buscar paciente.'});
    }
});

//Atualiza os dados do paciente
app.put('/pacientes/:id', verificaJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, idade, sexo, usuario, senha } = req.body;

        const paciente = await Paciente.findByPk(id);
        if (!paciente) {
            return res.status(404).json({ error: "Paciente não encontrado." });
        }
        await paciente.update({
            nome: nome || paciente.nome,
            idade: idade || paciente.idade,
            sexo: sexo || paciente.sexo,
            usuario: usuario || paciente.usuario,
            senha: senha || paciente.senha
        });
        return res.json(paciente);

    } catch (error) {
        console.error("Erro ao atualizar paciente:", error);
    }
});

//Deleta o paciente do banco de dados:
app.delete('/pacientes/:id', verificaJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const paciente = await Paciente.findByPk(id);

        if (!paciente) {
            return res.status(404).json({ error: "Paciente não encontrado." });
        }

        await paciente.destroy();
        return res.json({ message: "Paciente removido com sucesso." });

    } catch (error) {
        console.error("Erro ao deletar paciente:", error);
    }
});


//Listen:
app.listen(port, () => {
    console.log(`Aplicação rodando na porta ${port}!`);
});
