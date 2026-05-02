import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ejs from 'ejs';
import { body } from 'express-validator';
import crypto from 'crypto';
import utils from '../helpers/utils.js';
import mailer from '../helpers/mailer.js';
import validateFormData from '../helpers/validate_form.js';
import { generateCsrfToken } from '../middleware/csrf.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import DB from '../models/db.js';
import TokenBlacklist from '../models/token_blacklist.js';
import { setAuthCookie, setCsrfCookie, clearAuthCookie } from '../helpers/cookieUtils.js';

const router = Router();

router.use('/login', authLimiter);
router.use('/forgotusercode', authLimiter);

interface User {
  user_role_id: any;
  id: number;
  email: string;
  username: string;
  phone?: string;
  usercode: string;
  account_status?: string;
}

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

    // Generate tokens
    const expiresIn = `${process.env.AUTH_JWT_DURATION || '30'}m`;
    const userid = user.id;
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { sub: userid, jti },
      process.env.AUTH_API_TOKEN_SECRET || '',
      { expiresIn, algorithm: 'HS256' }
    );

    // Set JWT as httpOnly cookie
    setAuthCookie(res, token);

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    // Return success (no token in body)
    return res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role_id: user.user_role_id,
      }
    });
  } catch (err) {
    console.log("login" ,err);
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

     // Find any registered user with this email
     const user: User | null = await DB.Users.findOne({ 
       where: { email: email }
     });

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
     const record: User | null = await DB.Users.findOne({ 
       where: where,
       include: [{ model: DB.Roles, as: 'roles', attributes: ['role_name'] }]
     });

     if (!record) {
       return res.status(404).json({ error: "User not found" });
     }

     const userRole = (record as any).roles?.role_name;
     
     const newusercode = utils.usercodeHash(usercode);
     const modeldata = { usercode: newusercode };

     await DB.Users.update(modeldata, { where: where });

     // Only subscribers receive a confirmation email with the new usercode
     if (userRole === 'Subscriber') {
       try {
         await sendUsercodeResetConfirmation(record.username, record.email, usercode);
       } catch (emailErr) {
         console.error("Failed to send confirmation email:", emailErr);
         // Don't fail the request if email fails
       }
     }

     return res.json({ message: "usercode changed" });
   } catch (err) {
     const message = err instanceof Error ? err.message : String(err);
     return res.status(500).json({ error: message });
   }
 });

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.AUTH_API_TOKEN_SECRET || '', {
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

    // Clear cookies
    const { clearAuthCookie } = await import('../helpers/cookieUtils.js');
    clearAuthCookie(res);

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
  const csrfToken = generateCsrfToken();
  // Set CSRF token as accessible cookie (frontend reads and sends back)
  setCsrfCookie(res, csrfToken);
  // Return token in response for immediate use
  res.json({ csrfToken });
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

router.put('/me', async (req: Request, res: Response) => {
   try {
     const userid = (req as any).user?.id;
     if (!userid) {
       return res.status(401).json({ error: "Unauthorized" });
     }

     const { username, email, phone } = req.body;

     // Build update object with only provided fields
     const updateData: any = {};
     if (username !== undefined) updateData.username = username;
     if (email !== undefined) updateData.email = email;
     if (phone !== undefined) updateData.phone = phone;

     if (Object.keys(updateData).length === 0) {
       return res.status(400).json({ error: "No fields to update" });
     }

     try {
       await DB.Users.update(updateData, {
         where: { id: userid }
       });
     } catch (err: any) {
       if (err.code === 'ER_DUP_ENTRY' || err.name === 'SequelizeUniqueConstraintError') {
         return res.status(409).json({ error: "Username or email already exists" });
       }
       throw err;
     }

      // Fetch updated user
      const user: User | null = await DB.Users.findByPk(userid, {
        attributes: ['id', 'username', 'email', 'phone', 'user_role_id']
      });

     if (!user) {
       return res.status(404).json({ error: "User not found" });
     }

     // Get role info
     const role = await DB.Roles.findOne({
       where: { role_id: user.user_role_id },
       attributes: ['role_id', 'role_name']
     });

      // Return updated user data (permissions not included in update response)
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role_id: role?.role_id || null,
        role_name: role?.role_name || null
      });
   } catch (err) {
     console.log("update profile", err);
     const message = err instanceof Error ? err.message : String(err);
     return res.status(500).json({ error: message });
   }
});

router.post('/change-usercode', [
  body('current_usercode').not().isEmpty(),
  body('new_usercode').not().isEmpty(),
  body('confirm_usercode').not().isEmpty().custom((val: string, { req }: any) => {
    if (val !== req.body.new_usercode) {
      throw new Error("usercodes confirmation does not match");
    } else {
      return val;
    }
  }),
], validateFormData as any, async (req: Request, res: Response) => {
   try {
     const userid = (req as any).user?.id;
     if (!userid) {
       return res.status(401).json({ error: "Unauthorized" });
     }

     const { current_usercode, new_usercode } = req.body;

     const user: User | null = await DB.Users.findOne({
       where: { id: userid },
       attributes: ['id', 'usercode']
     });

     if (!user) {
       return res.status(404).json({ error: "User not found" });
     }

     if (!utils.usercodeVerify(current_usercode, user.usercode)) {
       return res.status(401).json({ error: "Current usercode is incorrect" });
     }

     const newHashedUsercode = utils.usercodeHash(new_usercode);
     await DB.Users.update({ usercode: newHashedUsercode }, { where: { id: userid } });

     return res.json({ message: "Usercode changed successfully" });
   } catch (err) {
     console.log("change-usercode", err);
     const message = err instanceof Error ? err.message : String(err);
     return res.status(500).json({ error: message });
   }
});

 async function sendusercodeResetLink(user: User): Promise<boolean> {
   const token = generateUserToken(user);
    const resetlink = `${process.env.APP_FRONTEND_URL || 'http://localhost:5173'}/index/resetusercode?token=${token}`;
   const username = user.username;
   const email = user.email;
   const mailtitle = 'usercode Reset';
   
   const viewData = { 
     username, 
     email, 
     resetlink,
     config: {
       app: {
         name: process.env.APP_NAME || 'Bits Tutor Connect'
       }
     }
   };
   const mailbody = await ejs.renderFile("views/pages/index/usercode_reset_email_template.ejs", viewData);

  const mailResult: any = await mailer.sendMail(email, mailtitle, mailbody);

  if (!mailResult.messageId) {
    throw new Error(mailResult.error);
  }

  return true;
 }

async function sendUsercodeResetConfirmation(username: string, email: string, newusercode: string): Promise<boolean> {
  // Only subscribers receive their new usercode via email for security
  // Non-subscribers (admin, teacher, marketer) reset via token but don't get code emailed
  const mailtitle = 'Usercode Reset Confirmation';

  const viewData = {
    username,
    email,
    newusercode,
    config: {
      app: {
        name: process.env.APP_NAME || 'Bits Tutor Connect'
      }
    }
  };

  const mailbody = await ejs.renderFile("views/pages/index/usercode_reset_confirmation_template.ejs", viewData);
  const mailResult: any = await mailer.sendMail(email, mailtitle, mailbody);

  if (!mailResult.messageId) {
    throw new Error(mailResult.error);
  }

  return true;
}

function generateUserToken(user: User): string {
  const expiresIn = '10m';
  const userid = user.id;
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userid, jti }, process.env.AUTH_USER_TOKEN_SECRET || '', {
    expiresIn,
    algorithm: 'HS256'
  });
  return token;
}

function getUserIDFromJwt(token: string): number {
  try {
    const decoded: any = jwt.verify(token, process.env.AUTH_USER_TOKEN_SECRET || '', {
      algorithms: ['HS256']
    });
    return decoded.sub;
  } catch (err) {
    throw new Error(String(err));
  }
}

export default router;

