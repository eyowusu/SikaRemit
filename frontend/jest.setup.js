import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth - commented out as it's not used in this project
// jest.mock('next-auth/react', () => ({
//   useSession: jest.fn(() => ({
//     data: null,
//     status: 'unauthenticated',
//   })),
//   signIn: jest.fn(),
//   signOut: jest.fn(),
//   getSession: jest.fn(),
// }))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

// Global test setup
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }
})
