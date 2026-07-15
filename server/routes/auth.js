import express from 'express';
import { query, queryOne, run } from '../db/database.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahabat-utara-secret-key-2026';
const JWT_EXPIRES = '24h';

// Simple password hashing using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      rw_access: user.rw_access
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
    }

    const user = await queryOne(
      'SELECT * FROM users WHERE username = ? AND status = ?',
      [username, 'active']
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Username tidak ditemukan' });
    }

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Password salah' });
    }

    const token = generateToken(user);

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/register (Super Admin only via middleware)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role, rw_access, email, phone } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: 'Field wajib tidak boleh kosong' });
    }

    // Check if username exists
    const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username sudah digunakan' });
    }

    // Validate role
    if (!['super_admin', 'pic_rw'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role tidak valid' });
    }

    // PIC RW must have rw_access
    if (role === 'pic_rw' && !rw_access) {
      return res.status(400).json({ success: false, error: 'PIC RW harus memiliki akses RW' });
    }

    const hashedPassword = hashPassword(password);

    const result = await run(
      `INSERT INTO users (username, password, name, role, rw_access, email, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, name, role, rw_access || null, email || null, phone || null]
    );

    const newUser = await queryOne('SELECT id, username, name, role, rw_access, email, phone, status, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await queryOne(
        'SELECT id, username, name, role, rw_access, email, phone, status, created_at FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!user) {
        return res.status(401).json({ success: false, error: 'User tidak ditemukan' });
      }

      res.json({ success: true, data: user });
    } catch (jwtError) {
      return res.status(401).json({ success: false, error: 'Token tidak valid atau expired' });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/users - List all users (Super Admin only)
router.get('/users', async (req, res) => {
  try {
    // Check if requester is super admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Token tidak valid' });
    }

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa mengakses' });
    }

    const users = await query(
      'SELECT id, username, name, role, rw_access, email, phone, status, created_at FROM users ORDER BY role, name'
    );

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/auth/users/:id - Update user (Super Admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, rw_access, email, phone, status, password } = req.body;

    // Check if requester is super admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Token tidak valid' });
    }

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa mengubah' });
    }

    const existing = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    // Build update query
    let updateFields = [];
    let params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (role !== undefined) {
      if (!['super_admin', 'pic_rw'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Role tidak valid' });
      }
      updateFields.push('role = ?');
      params.push(role);
    }
    if (rw_access !== undefined) {
      updateFields.push('rw_access = ?');
      params.push(rw_access);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status tidak valid' });
      }
      updateFields.push('status = ?');
      params.push(status);
    }
    if (password) {
      updateFields.push('password = ?');
      params.push(hashPassword(password));
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne(
      'SELECT id, username, name, role, rw_access, email, phone, status, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/auth/users/:id - Delete user (Super Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requester is super admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Token tidak valid' });
    }

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa menghapus' });
    }

    // Prevent deleting self
    if (parseInt(id) === decoded.id) {
      return res.status(400).json({ success: false, error: 'Tidak bisa menghapus akun sendiri' });
    }

    await run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
