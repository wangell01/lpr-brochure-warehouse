const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routers
const authRouter = require('./routes/auth');
const suppliersRouter = require('./routes/suppliers');
const recipientsRouter = require('./routes/recipients');
const cabinetsRouter = require('./routes/cabinets');
const brochuresRouter = require('./routes/brochures');
const transactionsRouter = require('./routes/transactions');

app.use('/api/auth', authRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/recipients', recipientsRouter);
app.use('/api/cabinets', cabinetsRouter);
app.use('/api/brochures', brochuresRouter);
app.use('/api/transactions', transactionsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
