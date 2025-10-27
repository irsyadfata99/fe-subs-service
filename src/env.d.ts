/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    NEXT_PUBLIC_API_URL: string;

    // Application Configuration
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_URL: string;

    // Monitoring
    NEXT_PUBLIC_SENTRY_DSN?: string;
    NEXT_PUBLIC_SENTRY_ENVIRONMENT?: string;

    // Feature Flags
    NEXT_PUBLIC_ENABLE_ADMIN?: string;
    NEXT_PUBLIC_ENABLE_ANALYTICS?: string;

    // Development
    NEXT_PUBLIC_DEBUG?: string;
    NEXT_PUBLIC_API_TIMEOUT?: string;
  }
}
