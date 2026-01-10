// Re-export from consolidated axios.ts for backward compatibility
// This file is deprecated - use './axios' directly
'use client'

import api, { merchantApi } from './axios';

export { merchantApi };
export default api;
