import { type User } from "@/lib/features/user/userSlice";

// API base URL - adjust as needed or use environment variables
const API_BASE_URL = "http://localhost:5000/api/v1/auth";

export interface LoginData {
  email?: string;
  password?: string;
}

export interface SignupData {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: User;
  error?: string;
}

/**
 * Login action to authenticate a user.
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseJSON = await response.json();

    if (!response.ok) {
      throw new Error(
        responseJSON.error || responseJSON.message || "Failed to login"
      );
    }

    return responseJSON;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during login",
    };
  }
}

/**
 * Signup action to register a new user.
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseJSON = await response.json();

    if (!response.ok) {
      throw new Error(
        responseJSON.error || responseJSON.message || "Failed to sign up"
      );
    }

    return responseJSON;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during sign up",
    };
  }
}

/**
 * Logout action to clear the user session.
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const responseJSON = await response.json();

    if (!response.ok) {
      throw new Error(
        responseJSON.error || responseJSON.message || "Failed to logout"
      );
    }

    return responseJSON;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during logout",
    };
  }
}
