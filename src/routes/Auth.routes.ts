import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db';
import { authMiddleware } from '../middlewares/auth';
import { tr } from 'zod/v4/locales';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';  // Tambah di .env

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDB();

  try {
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logout successful' });
});

router.get('/check', authMiddleware, (req, res) => {
  res.json({ message: 'Authenticated', user: (req as any).user });
});

export default router;