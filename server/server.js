
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Database connection successful!' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Book endpoints
app.get('/api/books', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { isbn, title, author, publishYear, category, publisher, quantity, coverImage } = req.body;
    const [result] = await pool.query(
      'INSERT INTO books (isbn, title, author, publishYear, category, publisher, quantity, availableQuantity, coverImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [isbn, title, author, publishYear, category, publisher, quantity, quantity, coverImage]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { isbn, title, author, publishYear, category, publisher, quantity, coverImage } = req.body;
    await pool.query(
      'UPDATE books SET isbn = ?, title = ?, author = ?, publishYear = ?, category = ?, publisher = ?, quantity = ?, coverImage = ? WHERE id = ?',
      [isbn, title, author, publishYear, category, publisher, quantity, coverImage, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id/block', async (req, res) => {
  try {
    const { isBlocked, blockReason } = req.body;
    await pool.query(
      'UPDATE users SET isBlocked = ?, blockReason = ? WHERE id = ?',
      [isBlocked, blockReason, req.params.id]
    );
    res.json({ id: req.params.id, isBlocked, blockReason });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Borrow records endpoints
app.get('/api/borrow-records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM borrow_records');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching borrow records:', error);
    res.status(500).json({ error: 'Failed to fetch borrow records' });
  }
});

app.post('/api/borrow-records', async (req, res) => {
  try {
    const { bookId, userId, borrowDate, dueDate, status } = req.body;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create borrow record
      const [result] = await connection.query(
        'INSERT INTO borrow_records (bookId, userId, borrowDate, dueDate, status) VALUES (?, ?, ?, ?, ?)',
        [bookId, userId, borrowDate, dueDate, status]
      );
      
      // Update available quantity
      await connection.query(
        'UPDATE books SET availableQuantity = availableQuantity - 1 WHERE id = ?',
        [bookId]
      );
      
      // Update user's borrowed books
      await connection.query(
        'INSERT INTO user_borrowed_books (userId, bookId) VALUES (?, ?)',
        [userId, bookId]
      );
      
      await connection.commit();
      res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating borrow record:', error);
    res.status(500).json({ error: 'Failed to create borrow record' });
  }
});

app.put('/api/borrow-records/:id/return', async (req, res) => {
  try {
    const { returnDate } = req.body;
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get the borrow record
      const [records] = await connection.query(
        'SELECT * FROM borrow_records WHERE id = ?',
        [req.params.id]
      );
      
      if (records.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Borrow record not found' });
      }
      
      const record = records[0];
      
      // Update borrow record
      await connection.query(
        'UPDATE borrow_records SET returnDate = ?, status = "returned" WHERE id = ?',
        [returnDate, req.params.id]
      );
      
      // Update available quantity
      await connection.query(
        'UPDATE books SET availableQuantity = availableQuantity + 1 WHERE id = ?',
        [record.bookId]
      );
      
      // Remove from user's borrowed books
      await connection.query(
        'DELETE FROM user_borrowed_books WHERE userId = ? AND bookId = ?',
        [record.userId, record.bookId]
      );
      
      await connection.commit();
      res.json({ id: req.params.id, returnDate, status: 'returned' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Failed to return book' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
