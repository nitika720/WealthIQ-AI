import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../db/store.ts';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET, JWT_EXPIRES_IN } from '../middleware/auth.middleware.ts';
import { CurrencyCode, User } from '../db/models.ts';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, currency = 'INR' } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = dbStore.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      currency: (currency as CurrencyCode) || 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.createUser(newUser);
    dbStore.recordAuditEvent(newUser.id, 'USER_REGISTERED', `Account created for ${newUser.email}`);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          currency: newUser.currency,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const user = dbStore.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    dbStore.recordAuditEvent(user.id, 'USER_LOGIN', `Authenticated via password`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// POST /api/v1/auth/demo (One-click Instant Demo Access)
router.post('/demo', (_req: Request, res: Response) => {
  try {
    let demoUser = dbStore.findUserByEmail('demo@wealthiq.ai');
    if (!demoUser) {
      dbStore.seedInitialData(true);
      demoUser = dbStore.findUserByEmail('demo@wealthiq.ai');
    }

    if (!demoUser) {
      res.status(500).json({ success: false, error: 'Failed to initialize demo account' });
      return;
    }

    const token = jwt.sign({ userId: demoUser.id, email: demoUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    dbStore.recordAuditEvent(demoUser.id, 'DEMO_LOGIN', 'Quick demo profile session initialized');

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          currency: demoUser.currency,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Demo initialization failed' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = dbStore.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required.' });
      return;
    }

    const user = dbStore.findUserByEmail(email);
    // Return generic message regardless of user existence to prevent user enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If an account matches that email, a password reset link has been dispatched.',
      });
      return;
    }

    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    dbStore.updateUser(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    dbStore.recordAuditEvent(user.id, 'PASSWORD_RESET_REQUESTED', `Reset token generated`);

    res.json({
      success: true,
      message: 'If an account matches that email, a password reset link has been dispatched.',
      // For local development and demonstration testing:
      devVerificationToken: resetToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    // Find user by reset token
    const allUsers = (dbStore as any).data.users as User[];
    const user = allUsers.find(
      u => u.resetPasswordToken === token && u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date()
    );

    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    dbStore.updateUser(user.id, {
      passwordHash,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    dbStore.recordAuditEvent(user.id, 'PASSWORD_RESET_COMPLETED', 'Password was securely reset');

    res.json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/auth/account (User data deletion)
router.delete('/account', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    dbStore.recordAuditEvent(userId, 'ACCOUNT_DELETION', 'User permanently deleted account and associated data');
    const success = dbStore.deleteUser(userId);

    if (!success) {
      res.status(404).json({ success: false, error: 'User could not be found' });
      return;
    }

    res.json({
      success: true,
      message: 'Account and all isolated personal financial data have been permanently erased.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
