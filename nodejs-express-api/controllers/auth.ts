import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ejs from 'ejs';
import { body } from 'express-validator';
import crypto from 'crypto';
import utils from '../helpers/utils.js';
import mailer from '../helpers/mailer.js';
import validateFormData from '../helpers/validate_form.js';
import { generateCsrfToken } from '../middleware/csrf.js';
import { authLimiter, signupLimiter } from '../middleware/rateLimiters.js';
import DB from '../models/db.ts';
import TokenBlacklist from '../models/token_blacklist.js';

const router = Router();

router.use('/login', authLimiter);
router.use('/forgotusercode', authLimiter);
router.use('/register', signupLimiter);

interface User {
  id: number;
  email: string;
  username: string;
  phone?: string;
  usercode: string;
  account_status?: string;
}

router.post('/register', [
  body('username').not().isEmpty().trim(),
  body('email').not().isEmpty().isEmail(),
  body('phone').not().isEmpty(),
  body('usercode').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    
    const existingUser = await DB.Users.findOne({
      where: {
        [DB.op.or]: [
          { email: modeldata.email },
          { username: modeldata.username },
          { phone: modeldata.phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this information already exists" });
    }

    modeldata.usercode = utils.usercodeHash(modeldata.usercode);
    modeldata.account_status = 'active';
    modeldata.role_id = 2;

    const record = await DB.Users.create(modeldata);
    return res.json({ message: "Account created successfully", userId: record.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

router.post('/login', [
  body('username').trim().not().isEmpty(),
  body('usercode').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, usercode } = req.body;

    const user: User | null = await DB.Users.findOne({
      where: {
        [DB.op.or]: [
          { email: username },
          { username: username },
          { phone: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!utils.usercodeVerify(usercode, user.usercode)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let accountStatus = user.account_status || 'blocked';
    accountStatus = accountStatus.toLowerCase();

    if (accountStatus != "active") {
      const nextpage = `/index/account${accountStatus}`;
      return res.json({ nextpage });
    }

    const loginData = await getUserLoginData(user, res);
    return res.json(loginData);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

router.post('/forgotusercode', [
  body('email').not().isEmpty().isEmail(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const email = modeldata.email;

    const user: User | null = await DB.Users.findOne({ where: { email: email } });

    if (user) {
      await sendusercodeResetLink(user);
    }
    return res.json({ message: "If that email exists, we have sent a reset link" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

router.post('/resetusercode', [
  body('usercode').not().isEmpty().custom((val: string, { req }: any) => {
    if (val !== (req as any).body.confirm_usercode) {
      throw new Error("usercodes confirmation does not match");
    } else {
      return val;
    }
  }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    const userid = getUserIDFromJwt(token);
    const usercode = req.body.usercode;

    const where = { id: userid };
    const record: User | null = await DB.Users.findOne({ where: where });

    if (!record) {
      return res.status(404).json({ error: "User not found" });
    }

    const newusercode = utils.usercodeHash(usercode);
    const modeldata = { usercode: newusercode };

    await DB.Users.update(modeldata, { where: where });
    return res.json({ message: "usercode changed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded: any = jwt.verify(token, (config as any).auth.apiTokenSecret, {
          algorithms: ['HS256']
        });
        if (decoded.jti) {
          await (DB as any).TokenBlacklist.addToBlacklist(
            decoded.jti,
            decoded.sub,
            new Date(decoded.exp * 1000)
          );
        }
      } catch (e) {}
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.post('/logout-all', async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user.id;
    return res.json({ message: 'All sessions logged out' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken();
  const sessionId = crypto.randomUUID();
  res.json({ csrfToken: token, sessionId });
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const userid = (req as any).user?.id;
    if (!userid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user: User | null = await DB.Users.findOne({
      where: { id: userid },
      attributes: ['id', 'username', 'email', 'phone', 'user_role_id']
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get role information
    const role = await DB.Roles.findOne({
      where: { role_id: user.user_role_id },
      attributes: ['role_id', 'role_name']
    });

    // Get role-based permissions from role_permissions table
    const rolePerms = await DB.RolePermissions.findAll({
      where: { role_id: user.user_role_id },
      raw: true
    });
    const permissions: string[] = [];
    rolePerms.forEach((p: any) => {
      if (p.list) permissions.push(`${p.page}.list`);
      if (p.view) permissions.push(`${p.page}.view`);
      if (p.edit) permissions.push(`${p.page}.edit`);
      if (p.remove) permissions.push(`${p.page}.remove`);
      if (p.store) permissions.push(`${p.page}.store`);
    });

    // Get user-specific privileges
    const userPrivs = await DB.UserPrivileges.findAll({
      where: { 
        user_id: userid,
        is_active: true
      } as any,
      attributes: ['privilege']
    });
    const userPrivileges = userPrivs.map((p: any) => p.privilege);

    // Combine permissions (role + user-specific)
    const allPermissions = [...permissions, ...userPrivileges];

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role_id: role?.role_id || null,
      role_name: role?.role_name || null,
      permissions: allPermissions
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

async function sendusercodeResetLink(user: User): Promise<boolean> {
  const token = generateUserToken(user);
  const resetlink = `${(config as any).app.frontendUrl}/#/index/resetusercode?token=${token}`;
  const username = user.username;
  const email = user.email;
  const mailtitle = 'usercode Reset';

  const viewData = { username, email, resetlink, config };
  const mailbody = await ejs.renderFile("views/pages/index/usercode_reset_email_template.ejs", viewData);

  const mailResult: any = await mailer.sendMail(email, mailtitle, mailbody);

  if (!mailResult.messageId) {
    throw new Error(mailResult.error);
  }

  return true;
}

async function getUserLoginData(user: User, res: Response) {
  const expiresIn = (config as any).auth.jwtDuration + 'm';
  const userid = user.id;
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: userid, jti },
    (config as any).auth.apiTokenSecret,
    { expiresIn, algorithm: 'HS256' }
  );
  return { token };
}

function generateUserToken(user: User): string {
  const expiresIn = '10m';
  const userid = user.id;
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userid, jti }, (config as any).auth.userTokenSecret, {
    expiresIn,
    algorithm: 'HS256'
  });
  return token;
}

function getUserIDFromJwt(token: string): number {
  try {
    const decoded: any = jwt.verify(token, (config as any).auth.userTokenSecret, {
      algorithms: ['HS256']
    });
    return decoded.sub;
  } catch (err) {
    throw new Error(String(err));
  }
}

export default router;

