import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sahabat-utara-secret-key-2026';

// Middleware to verify JWT token
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token sudah expired, silakan login kembali' });
    }
    return res.status(401).json({ success: false, error: 'Token tidak valid' });
  }
}

// Middleware to check if user is Super Admin
export function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Hanya Super Admin yang bisa mengakses' });
  }

  next();
}

// Middleware to check if user can access specific RW
export function canAccessRW(rw) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Super Admin can access all RW
    if (req.user.role === 'super_admin') {
      return next();
    }

    // PIC RW can only access their assigned RW
    if (req.user.role === 'pic_rw') {
      const allowedRWs = req.user.rw_access ? req.user.rw_access.split(',').map(r => r.trim()) : [];

      if (!allowedRWs.includes(rw)) {
        return res.status(403).json({
          success: false,
          error: `Anda tidak memiliki akses ke RW ${rw}`
        });
      }

      return next();
    }

    return res.status(403).json({ success: false, error: 'Role tidak dikenal' });
  };
}

// Helper to check if user can edit/delete (Super Admin only)
export function canEditDelete(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Hanya Super Admin yang bisa edit atau hapus data'
    });
  }

  next();
}

// Helper to get user's accessible RW list
export function getAccessibleRWs(user) {
  if (!user) return [];

  if (user.role === 'super_admin') {
    // Return all RW numbers
    return Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, '0'));
  }

  if (user.role === 'pic_rw' && user.rw_access) {
    return user.rw_access.split(',').map(r => r.trim()).filter(Boolean);
  }

  return [];
}

export default { authenticate, requireSuperAdmin, canAccessRW, canEditDelete, getAccessibleRWs };
