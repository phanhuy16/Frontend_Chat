import { LoginRequest, RegisterRequest } from "../types/auth.types";


export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 50;
};

export const validateRegisterForm = (data: RegisterRequest): string[] => {
  const errors: string[] = [];

  if (!data.username.trim()) {
    errors.push('Username is required');
  } else if (!validateUsername(data.username)) {
    errors.push('Username must be 3-50 characters');
  }

  if (!data.email.trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.displayName.trim()) {
    errors.push('Display name is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else if (!validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};

export const validateLoginForm = (data: LoginRequest): string[] => {
  const errors: string[] = [];

  if (!data.username.trim()) {
    errors.push('Username is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return errors;
};
