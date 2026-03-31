/**
 * Helper d'authentification et de gestion des permissions
 */

// Récupérer l'utilisateur connecté
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Récupérer le token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
  return !!getToken() && !!getUser();
};

// Récupérer le rôle de l'utilisateur
export const getUserRole = () => {
  return localStorage.getItem('role_code');
};

// Récupérer les permissions
export const getPermissions = () => {
  const perms = localStorage.getItem('permissions');
  return perms ? JSON.parse(perms) : [];
};

// Vérifier si l'utilisateur a un rôle spécifique
export const hasRole = (role) => {
  const userRole = getUserRole();
  if (Array.isArray(role)) {
    return role.includes(userRole);
  }
  return userRole === role;
};

// Vérifier si l'utilisateur a une permission
export const hasPermission = (permission) => {
  const permissions = getPermissions();
  
  // Admin a toutes les permissions
  if (permissions.includes('*')) {
    return true;
  }
  
  return permissions.includes(permission);
};

// Vérifier si l'utilisateur a au moins une des permissions
export const hasAnyPermission = (permissionsArray) => {
  return permissionsArray.some(permission => hasPermission(permission));
};

// Vérifier si l'utilisateur a toutes les permissions
export const hasAllPermissions = (permissionsArray) => {
  return permissionsArray.every(permission => hasPermission(permission));
};

// Déconnexion
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('expires_in');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  localStorage.removeItem('role_code');
  localStorage.removeItem('role_libelle');
  localStorage.removeItem('role');
  localStorage.removeItem('permissions');
  localStorage.removeItem('direction');
  
  window.location.href = '/login';
};

// Vérifier si l'utilisateur est admin
export const isAdmin = () => {
  return hasRole('admin');
};

// Vérifier si l'utilisateur est chef de parc
export const isChefParc = () => {
  return hasRole('chef_parc');
};

// Vérifier si l'utilisateur est chef TF
export const isChefTF = () => {
  return hasRole('chef_tf');
};

// Vérifier si l'utilisateur est chauffeur
export const isChauffeur = () => {
  return hasRole('chauffeur');
};

// Obtenir les informations du rôle
export const getRoleInfo = () => {
  const roleStr = localStorage.getItem('role');
  return roleStr ? JSON.parse(roleStr) : null;
};

// Obtenir les informations de la direction
export const getDirection = () => {
  const dirStr = localStorage.getItem('direction');
  return dirStr ? JSON.parse(dirStr) : null;
};

// Formater le nom de l'utilisateur
export const getUserDisplayName = () => {
  const user = getUser();
  return user?.nom || 'Utilisateur';
};

export default {
  getUser,
  getToken,
  isAuthenticated,
  getUserRole,
  getPermissions,
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  logout,
  isAdmin,
  isChefParc,
  isChefTF,
  isChauffeur,
  getRoleInfo,
  getDirection,
  getUserDisplayName,
};