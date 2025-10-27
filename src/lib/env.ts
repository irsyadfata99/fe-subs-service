/**
 * Environment Configuration & Validation
 * Type-safe access to environment variables
 */

// Validate required environment variables
const requiredEnvVars = ["NEXT_PUBLIC_API_URL"] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables:\n${missingEnvVars.join("\n")}\n\nPlease check your .env.local file.`);
}

// Export validated environment variables
export const env = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL,

  // Application Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Payment Reminder",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Monitoring
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sentryEnvironment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

  // Feature Flags
  enableAdmin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true",
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",

  // Development
  debug: process.env.NEXT_PUBLIC_DEBUG === "true",
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),

  // Computed values
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

// Type for environment object
export type Env = typeof env;

// Helper to check if environment variable is defined
export function hasEnv(key: keyof NodeJS.ProcessEnv): boolean {
  return Boolean(process.env[key]);
}

// Helper to get environment variable with fallback
export function getEnv(key: keyof NodeJS.ProcessEnv, fallback?: string): string {
  return process.env[key] || fallback || "";
}

// Log configuration in development
if (env.isDevelopment && env.debug) {
  console.log("🔧 Environment Configuration:", {
    apiUrl: env.apiUrl,
    appUrl: env.appUrl,
    environment: process.env.NODE_ENV,
    features: {
      admin: env.enableAdmin,
      analytics: env.enableAnalytics,
    },
  });
}
