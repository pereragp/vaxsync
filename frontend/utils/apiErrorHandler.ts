import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

/**
 * Global API error handler
 * Handles authentication errors (401), clears tokens, and redirects to login
 */

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Handle 401 Unauthorized errors
 * Clears the auth token and redirects to login
 */
async function handleUnauthorized(): Promise<void> {
  try {
    // Clear the authentication token
    await AsyncStorage.removeItem("userToken");
    console.log("Session expired - token cleared");
    
    // Redirect to login page
    // Use replace to prevent user from going back
    router.replace("/login");
  } catch (error) {
    console.error("Error handling unauthorized access:", error);
    // Even if clearing storage fails, still try to redirect
    router.replace("/login");
  }
}

/**
 * Check API response status and handle authentication errors
 * Does NOT consume the response body - allows caller to parse it
 * @param response - Fetch response object
 * @throws ApiError if status indicates an error
 */
export async function checkApiResponse(response: Response): Promise<void> {
  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    await handleUnauthorized();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  // Handle other error status codes
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If parsing error response fails, use default message
    }

    throw new ApiError(errorMessage, response.status);
  }
}

/**
 * Process API response and handle common error cases
 * Consumes the response body and returns parsed JSON
 * @param response - Fetch response object
 * @returns Parsed JSON data
 * @throws ApiError with appropriate status and message
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  await checkApiResponse(response);

  // Parse and return successful response
  try {
    return await response.json();
  } catch (error) {
    throw new ApiError("Failed to parse server response", response.status);
  }
}

/**
 * Handle errors that occur during API calls
 * @param error - Error object from catch block
 * @param endpoint - API endpoint for logging purposes
 */
export function handleApiError(error: any, endpoint?: string): never {
  const logPrefix = endpoint ? `API request failed for ${endpoint}` : 'API request failed';
  
  // If it's already an ApiError, just log and rethrow
  if (error instanceof ApiError) {
    if (error.status !== 401) { // Don't log 401 errors as they're expected
      console.error(`${logPrefix}:`, error.message);
    }
    throw error;
  }

  // Handle network errors
  if (error.message === 'Network request failed' || error.message.includes('fetch')) {
    console.error(`${logPrefix}: Network error`);
    throw new ApiError('Network connection failed. Please check your internet connection.', 0);
  }

  // Handle other unknown errors
  console.error(`${logPrefix}:`, error);
  throw new ApiError(error.message || 'An unexpected error occurred', error.status || 500);
}

/**
 * Wrapper for authenticated fetch requests
 * Automatically handles common errors including 401
 */
export async function makeAuthenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const token = await AsyncStorage.getItem("userToken");
    
    if (!token) {
      await handleUnauthorized();
      throw new ApiError("No authentication token found", 401);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw handleApiError(error, url);
  }
}
