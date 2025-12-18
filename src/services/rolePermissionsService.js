/**
 * Role Permissions Service
 * Handles role-based access control for team members
 */

/**
 * Available roles with their permissions
 */
export const ROLES = {
    ADMIN: {
        id: 'admin',
        name: 'Admin',
        description: 'Full access to all features',
        color: 'purple',
        permissions: {
            viewProjects: true,
            editProjects: true,
            deleteProjects: true,
            createProjects: true,
            manageTeam: true,
            inviteMembers: true,
            removeMembers: true,
            changeRoles: true,
            approveAnswers: true,
            exportData: true,
            viewAnalytics: true,
            manageSettings: true,
            manageBranding: true,
            manageIntegrations: true,
            viewBilling: true,
            manageBilling: true
        }
    },
    APPROVER: {
        id: 'approver',
        name: 'Approver',
        description: 'Can review and approve answers',
        color: 'green',
        permissions: {
            viewProjects: true,
            editProjects: true,
            deleteProjects: false,
            createProjects: true,
            manageTeam: false,
            inviteMembers: false,
            removeMembers: false,
            changeRoles: false,
            approveAnswers: true,
            exportData: true,
            viewAnalytics: true,
            manageSettings: false,
            manageBranding: false,
            manageIntegrations: false,
            viewBilling: false,
            manageBilling: false
        }
    },
    EDITOR: {
        id: 'editor',
        name: 'Editor',
        description: 'Can create and edit answers',
        color: 'blue',
        permissions: {
            viewProjects: true,
            editProjects: true,
            deleteProjects: false,
            createProjects: true,
            manageTeam: false,
            inviteMembers: false,
            removeMembers: false,
            changeRoles: false,
            approveAnswers: false,
            exportData: true,
            viewAnalytics: false,
            manageSettings: false,
            manageBranding: false,
            manageIntegrations: false,
            viewBilling: false,
            manageBilling: false
        }
    },
    REVIEWER: {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Can review and comment on answers',
        color: 'yellow',
        permissions: {
            viewProjects: true,
            editProjects: false,
            deleteProjects: false,
            createProjects: false,
            manageTeam: false,
            inviteMembers: false,
            removeMembers: false,
            changeRoles: false,
            approveAnswers: false,
            exportData: false,
            viewAnalytics: false,
            manageSettings: false,
            manageBranding: false,
            manageIntegrations: false,
            viewBilling: false,
            manageBilling: false
        }
    },
    VIEWER: {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        color: 'gray',
        permissions: {
            viewProjects: true,
            editProjects: false,
            deleteProjects: false,
            createProjects: false,
            manageTeam: false,
            inviteMembers: false,
            removeMembers: false,
            changeRoles: false,
            approveAnswers: false,
            exportData: false,
            viewAnalytics: false,
            manageSettings: false,
            manageBranding: false,
            manageIntegrations: false,
            viewBilling: false,
            manageBilling: false
        }
    }
};

/**
 * Get role by ID
 */
export const getRole = (roleId) => {
    return Object.values(ROLES).find(role => role.id === roleId) || ROLES.VIEWER;
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (roleId, permission) => {
    const role = getRole(roleId);
    return role.permissions[permission] === true;
};

/**
 * Get all roles as an array for dropdowns
 */
export const getRolesList = () => {
    return Object.values(ROLES);
};

/**
 * Get role color classes for UI
 */
export const getRoleColorClasses = (roleId) => {
    const colorMap = {
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    const role = getRole(roleId);
    return colorMap[role.color] || colorMap.gray;
};

/**
 * Check if user can perform action on project
 */
export const canPerformAction = (userRole, action, isOwner = false) => {
    // Owners always have full access to their own projects
    if (isOwner) return true;

    return hasPermission(userRole, action);
};

/**
 * Get permissions summary for a role
 */
export const getPermissionsSummary = (roleId) => {
    const role = getRole(roleId);
    const permissions = role.permissions;

    const can = [];
    const cannot = [];

    const permissionLabels = {
        viewProjects: 'View projects',
        editProjects: 'Edit projects',
        deleteProjects: 'Delete projects',
        createProjects: 'Create projects',
        manageTeam: 'Manage team',
        inviteMembers: 'Invite members',
        approveAnswers: 'Approve answers',
        exportData: 'Export data',
        viewAnalytics: 'View analytics',
        manageBilling: 'Manage billing'
    };

    Object.entries(permissionLabels).forEach(([key, label]) => {
        if (permissions[key]) {
            can.push(label);
        } else {
            cannot.push(label);
        }
    });

    return { can, cannot };
};
