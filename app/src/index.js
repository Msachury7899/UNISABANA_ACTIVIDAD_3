const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'microservicio-node';
const VERSION = process.env.APP_VERSION || '1.0.0';

let items = [
  { id: 1, name: 'item-1' },
  { id: 2, name: 'item-2' },
];

app.get('/', (req, res) => {
  res.json({ service: SERVICE_NAME, version: VERSION, message: 'Hola desde el microservicio Node.js' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/version', (req, res) => {
  res.json({ version: VERSION });
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.get('/api/items2', (req, res) => {
  res.json({items, message: 'Probando automatizacion 6'});
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find((i) => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item no encontrado' });
  res.json(item);
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El campo name es requerido' });
  const newItem = { id: items.length ? items[items.length - 1].id + 1 : 1, name };
  items.push(newItem);
  res.status(201).json(newItem);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} v${VERSION} escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
