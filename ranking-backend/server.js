const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Função para carregar o ranking de um arquivo JSON
function loadRanking(game) {
    const filePath = path.join(__dirname, `ranking-${game}.json`);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } else {
        return []; // Retorna um array vazio se o arquivo não existir
    }
}

// Função para salvar o ranking em um arquivo JSON
function saveRanking(game, ranking) {
    const filePath = path.join(__dirname, `ranking-${game}.json`);
    fs.writeFileSync(filePath, JSON.stringify(ranking, null, 2), 'utf8');
}

// Rota para obter o ranking de um jogo
app.get('/ranking/:game', (req, res) => {
    const game = req.params.game;
    const rankings = loadRanking(game);

    if (rankings) {
        res.json(rankings);
    } else {
        res.status(404).json({ message: 'Jogo não encontrado' });
    }
});

// Rota para enviar a pontuação de um jogador
app.post('/ranking/:game', (req, res) => {
    const game = req.params.game;
    const { name, score } = req.body;

    if (!name || !score) {
        return res.status(400).json({ message: 'Nome e pontuação são obrigatórios' });
    }

    let rankings = loadRanking(game);

    if (rankings) {
        // Verifica se o jogador já está no ranking
        const playerIndex = rankings.findIndex(player => player.name === name);

        if (playerIndex !== -1) {
            // Jogador já existe no ranking
            if (score > rankings[playerIndex].score) {
                // Atualiza a pontuação apenas se a nova for maior
                rankings[playerIndex].score = score;
                console.log(`Pontuação de ${name} foi atualizada para ${score}`);
            } else {
                // Se a pontuação enviada for menor ou igual, não faz nada
                return res.json({ message: 'Pontuação não foi atualizada porque é menor ou igual à já existente.' });
            }
        } else {
            // Jogador não existe no ranking, adiciona o jogador
            rankings.push({ name, score });
        }

        // Ordena o ranking do maior para o menor
        rankings.sort((a, b) => b.score - a.score);
        // Limita o ranking a 10 jogadores
        rankings = rankings.slice(0, 10);
        // Salva o ranking atualizado no arquivo
        saveRanking(game, rankings);

        res.json({ message: 'Pontuação adicionada/atualizada com sucesso!' });
    } else {
        res.status(404).json({ message: 'Jogo não encontrado' });
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
