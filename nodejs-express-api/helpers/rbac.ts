import DB from '../models/db.js';

interface RolePermissions {
  list: number;
  edit: number;
  remove: number;
  view: number;
  store: number;
}

interface RolePermissionsMap {
  [page: string]: RolePermissions;
}

class Rbac {
  static AUTHORIZED = "authorized";
  static FORBIDDEN = "forbidden";
  static UNKNOWN_ROLE = "unknown_role";

  userPages: string[] = [];
  userRoleId: number | null = null;
  userId: number | null = null;
  rolePermissions: RolePermissionsMap = {};

  constructor(role: number | null, userId: number | null = null) {
    this.userRoleId = role;
    this.userId = userId;
  }

  async getUserPages(): Promise<string[]> {
    if (this.userRoleId) {
      try {
        const rolePerms: Array<any> = await (DB as any).RolePermissions.findAll({
          where: {
            role_id: this.userRoleId
          },
          raw: true
        });

        this.rolePermissions = rolePerms.reduce((acc: RolePermissionsMap, perm: any) => {
          acc[perm.page] = {
            list: perm.list,
            edit: perm.edit,
            remove: perm.remove,
            view: perm.view,
            store: perm.store
          };
          return acc;
        }, {});

        this.userPages = Object.keys(this.rolePermissions);
      } catch (ex) {
        console.error('Error fetching role permissions:', ex);
      }
    }
    return this.userPages;
  }

  async getRoleName(): Promise<string> {
    let roleName = '';
    if (this.userRoleId) {
      try {
        roleName = await (DB as any).Roles.findValue('role_name', { role_id: this.userRoleId });
        roleName = (roleName || '').toLowerCase();
      } catch (ex) {
        console.error('Error fetching role name:', ex);
      }
    }
    return roleName;
  }

  async getPageAccess(path: string): Promise<string> {
    path = path.replace(/^\/|\/$/g, '');
    let arrPath = path.split("/");
    // Remove 'api' prefix if present
    if (arrPath[0] === 'api') {
      arrPath = arrPath.slice(1);
    }
    const page = arrPath[0] || '';

    const excludePages = ['account', 'components_data', 'upload', 'services', ''];
    if (excludePages.includes(page)) {
      return Rbac.AUTHORIZED;
    }

    const action = arrPath[1] ? arrPath[1] : "index";

    const actionToPermission: Record<string, string> = {
      'index': 'list',
      'list': 'list',
      'view': 'view',
      'add': 'store',
      'edit': 'edit',
      'delete': 'remove',
      'update': 'edit',
      'create': 'store',
      'grant': 'store',
      'grant-multiple': 'store',
      'revoke': 'edit',
      'revoke-all': 'remove',
      'dashboard': 'list'
    };

    const normalizedAction = actionToPermission[action] || action;
    const remainingPath = arrPath.slice(1).join('/');
    const slashPath = remainingPath ? `${page}/${remainingPath}` : `${page}/${action}`;
    const dotPath = slashPath.replace('/', '.');

    if (this.userRoleId) {
      const hasPermission = (permKey: string) => {
        const perm = this.rolePermissions[permKey];
        if (!perm) return false;
        return perm[normalizedAction as keyof RolePermissions] === 1 ||
               (action === 'index' && perm.list === 1);
      };

      if (hasPermission(slashPath) || hasPermission(dotPath) || hasPermission(page)) {
        return Rbac.AUTHORIZED;
      }

      return Rbac.FORBIDDEN;
    } else {
      return Rbac.UNKNOWN_ROLE;
    }
  }

  hasPermission(page: string, action: string): boolean {
    const normalizedAction = action.toLowerCase();
    const specificPermission = `${page}/${action}`;

    if (this.userPages.includes(specificPermission)) {
      return true;
    }

    if (this.rolePermissions[page]) {
      const pagePerm = this.rolePermissions[page];
      if ((pagePerm as any)[normalizedAction] === 1) {
        return true;
      }
    }

    return false;
  }
}

export default Rbac;