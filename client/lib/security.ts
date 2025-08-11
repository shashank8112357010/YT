/**
 * Security utilities for production-ready input validation and sanitization
 */

import { z } from "zod";

// YouTube URL validation schema with strict security checks
export const youtubeUrlSchema = z.string()
  .min(1, "URL is required")
  .max(2048, "URL too long") // Prevent excessively long URLs
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS YouTube URLs
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }
      
      // Strict domain validation - only youtube.com and youtu.be
      const allowedDomains = [
        'www.youtube.com',
        'youtube.com', 
        'youtu.be',
        'www.youtu.be'
      ];
      
      if (!allowedDomains.includes(parsedUrl.hostname.toLowerCase())) {
        return false;
      }
      
      // Validate YouTube URL patterns with additional security checks
      const securePatterns = [
        /^https:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}(&.*)?$/,
        /^https:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}(\?.*)?$/,
        /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}(\?.*)?$/
      ];
      
      return securePatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }, "Invalid or insecure YouTube URL");

// Tab count validation schema
export const tabCountSchema = z.number()
  .int("Tab count must be an integer")
  .min(1, "Minimum 1 tab required")
  .max(10, "Maximum 10 tabs allowed for security"); // Reduced from 20 for security

// Sanitize URL parameters to prevent injection attacks
export function sanitizeUrlParameter(value: string): string {
  return value
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .substring(0, 100); // Limit parameter length
}

// Validate and sanitize YouTube URL with comprehensive security checks
export function validateAndSanitizeYouTubeUrl(url: string): { 
  isValid: boolean; 
  sanitizedUrl?: string; 
  error?: string 
} {
  try {
    // Trim and basic sanitization
    const trimmedUrl = url.trim();
    
    // Schema validation
    const validation = youtubeUrlSchema.safeParse(trimmedUrl);
    if (!validation.success) {
      return {
        isValid: false,
        error: validation.error.errors[0].message
      };
    }
    
    // Additional security: Parse and reconstruct URL to ensure safety
    const parsedUrl = new URL(trimmedUrl);
    const videoId = extractVideoId(trimmedUrl);
    
    if (!videoId) {
      return {
        isValid: false,
        error: "Invalid video ID"
      };
    }
    
    // Reconstruct as safe YouTube URL
    const sanitizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    return {
      isValid: true,
      sanitizedUrl
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid URL format"
    };
  }
}

// Extract video ID with security validation
function extractVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.substring(1);
      return isValidVideoId(videoId) ? videoId : null;
    }
    
    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId && isValidVideoId(videoId) ? videoId : null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Validate YouTube video ID format
function isValidVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

// Rate limiting for security
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) { // 5 attempts per minute
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier = 'default'): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Increment attempts
    record.count++;
    record.lastAttempt = now;

    return record.count <= this.maxAttempts;
  }

  getRemainingTime(identifier = 'default'): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Note: Consider removing unsafe-inline in production
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https://www.youtube.com", "https://youtu.be"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: true
};

// Error messages that don't leak sensitive information
export const SAFE_ERROR_MESSAGES = {
  INVALID_URL: "Please enter a valid YouTube URL",
  RATE_LIMITED: "Too many requests. Please wait before trying again",
  SECURITY_VIOLATION: "Security validation failed",
  POPUP_BLOCKED: "Browser blocked popup windows. Please allow popups for this site",
  NETWORK_ERROR: "Network request failed. Please try again",
  UNKNOWN_ERROR: "An error occurred. Please try again"
} as const;
