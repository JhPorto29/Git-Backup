require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexão com o MongoDB usando variável de ambiente
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo de Dados
const DataSchema = new mongoose.Schema({ name: String });
const Data = mongoose.model('Data', DataSchema);

// Rota Inicial
app.get('/', (req, res) => {
  res.send('Servidor Node.js com MongoDB funcionando!');
});

// Rota para adicionar dados
app.post('/add', async (req, res) => {
  try {
    const newData = new Data(req.body);
    const savedData = await newData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para listar dados
app.get('/dados', async (req, res) => {
  try {
    const dados = await Data.find();
    res.json(dados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
