import { Router, Request, Response } from 'express';
import DB from '../models/db.js';

const router = Router();

const AVAILABLE_PRIVILEGES = [
    'manage_users', 'manage_roles', 'manage_permissions', 'manage_content',
    'view_analytics', 'manage_subscriptions', 'manage_settings', 'manage_tutorials',
    'send_notifications', 'export_data', 'view_all_reports', 'manage_guests',
    'manage_marketing', 'view_revenue', 'super_access', 'debug'
];

router.get('/available-privileges', async (req: Request, res: Response) => {
    try {
        res.json(AVAILABLE_PRIVILEGES);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching available privileges' });
    }
});

router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const userIdNum = parseInt(userId);
        
        const user = await (DB.Users as any).findByPk(userIdNum);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        
        const privileges = await (DB.UserPrivileges as any).findAll({
            where: { user_id: userIdNum, is_active: true }
        });
        
        res.json(privileges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching privileges' });
    }
});

router.post('/grant-multiple', async (req: Request, res: Response) => {
    try {
        const { user_id, privileges, granted_by } = req.body;
        const userIdNum = parseInt(user_id);
        
        if (!user_id || !privileges || !Array.isArray(privileges)) {
            res.status(400).json({ message: 'user_id and privileges array are required' });
            return;
        }
        
        const user = await (DB.Users as any).findByPk(userIdNum);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        
        const existingPrivileges = await (DB.UserPrivileges as any).findAll({
            where: { user_id: userIdNum, is_active: true }
        });
        
        const existingPrivilegeNames = existingPrivileges.map((p: any) => p.privilege);
        const newPrivileges = privileges.filter((p: string) => !existingPrivilegeNames.includes(p));
        
        const grantedAt = new Date();
        const grantedByNum = granted_by || 0;
        
        for (const privilege of newPrivileges) {
            if (AVAILABLE_PRIVILEGES.includes(privilege)) {
                await (DB.UserPrivileges as any).create({
                    user_id: userIdNum,
                    privilege,
                    granted_by: grantedByNum,
                    granted_at: grantedAt,
                    is_active: true
                });
            }
        }
        
        res.json({ message: `Granted ${newPrivileges.length} privilege(s) successfully`, granted: newPrivileges });
    } catch (error) {
        res.status(500).json({ message: 'Error granting privileges' });
    }
});

router.post('/revoke', async (req: Request, res: Response) => {
    try {
        const { user_id, privilege } = req.body;
        
        if (!user_id || !privilege) {
            res.status(400).json({ message: 'user_id and privilege are required' });
            return;
        }
        
        const result = await (DB.UserPrivileges as any).update(
            { is_active: false },
            { where: { user_id: parseInt(user_id), privilege } }
        );
        
        if (result[0] === 0) {
            res.status(404).json({ message: 'Privilege not found' });
            return;
        }
        
        res.json({ message: 'Privilege revoked successfully', privilege });
    } catch (error) {
        res.status(500).json({ message: 'Error revoking privilege' });
    }
});

router.post('/revoke-all/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const userIdNum = parseInt(userId);
        
        const result = await (DB.UserPrivileges as any).update(
            { is_active: false },
            { where: { user_id: userIdNum } }
        );
        
        res.json({ message: `Revoked ${result[0]} privilege(s) successfully`, revoked_count: result[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error revoking privileges' });
    }
});

router.get('/check/:userId/:privilege', async (req: Request, res: Response) => {
    try {
        const { userId, privilege } = req.params;
        const userIdNum = parseInt(userId);
        
        const priv = await (DB.UserPrivileges as any).findOne({
            where: { user_id: userIdNum, privilege, is_active: true }
        });
        
        res.json({ has_privilege: !!priv, user_id: userIdNum, privilege });
    } catch (error) {
        res.status(500).json({ message: 'Error checking privilege' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const privileges = await (DB.UserPrivileges as any).findAll({
            where: { is_active: true }
        });
        
        res.json({ total: privileges.length, privileges });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching privileges' });
    }
});

export default router;