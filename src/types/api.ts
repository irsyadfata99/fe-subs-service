// Axios error type helper
export interface ApiError {
  response?: {
    status?: number;
    data?: {
      success?: boolean;
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "response" in error;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || "An error occurred";
  }
  return "An unexpected error occurred";
}
