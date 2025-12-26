// Tenant helpers
export {
  findTenantBySlug,
  findTenantById,
  createTenant,
  updateTenant,
  isSlugAvailable,
  generateUniqueSlug,
  type CreateTenantInput,
  type UpdateTenantInput,
} from './tenant'

// User helpers
export {
  findUserByEmail,
  findUserById,
  findUserByGoogleId,
  findUserByFacebookId,
  getUsersByTenant,
  createUser,
  updateUser,
  updateLastLogin,
  deleteUser,
  userHasTenantAccess,
  hasRole,
  type CreateUserInput,
  type UpdateUserInput,
} from './user'

// Client helpers
export {
  getClientsByTenant,
  findClientById,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
  getClientWithDetails,
  type CreateClientInput,
  type UpdateClientInput,
  type ClientWithStats,
} from './client'

// Crypto helpers
export {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashPassword,
  verifyPassword,
  generateToken,
  generateShortToken,
} from './crypto'
