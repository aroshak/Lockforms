import DOMPurify from 'isomorphic-dompurify';
import type { FileAnswer } from '@/types/form';

/**
 * Sanitize form submission answers to prevent XSS and injection attacks
 * @param answers Record of question IDs to answer values
 * @returns Sanitized answers object
 */
export function sanitizeAnswers(answers: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [questionId, value] of Object.entries(answers)) {
        sanitized[questionId] = sanitizeValue(value);
    }

    return sanitized;
}

/**
 * Sanitize a single answer value based on its type
 * @param value Answer value (string, number, array, object, etc.)
 * @returns Sanitized value
 */
function sanitizeValue(value: any): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return value;
    }

    // Handle strings
    if (typeof value === 'string') {
        return sanitizeString(value);
    }

    // Handle numbers - pass through as-is
    if (typeof value === 'number') {
        return value;
    }

    // Handle booleans - pass through as-is
    if (typeof value === 'boolean') {
        return value;
    }

    // Handle arrays (e.g., checkbox answers)
    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item));
    }

    // Handle objects (e.g., file upload answers)
    if (typeof value === 'object') {
        return sanitizeObject(value);
    }

    // Fallback: pass through as-is
    return value;
}

/**
 * Sanitize string values to prevent XSS attacks
 * Preserves base64 data URLs for files and signatures
 * @param str String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
    // Skip sanitization for base64 data URLs (files and signatures)
    if (isDataURL(str)) {
        return str;
    }

    // For regular text, strip all HTML tags and attributes
    return DOMPurify.sanitize(str, {
        ALLOWED_TAGS: [],        // No HTML tags allowed
        ALLOWED_ATTR: [],        // No attributes allowed
        KEEP_CONTENT: true,      // Keep text content
        RETURN_TRUSTED_TYPE: false
    });
}

/**
 * Sanitize object values (e.g., FileAnswer objects)
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        // Handle FileAnswer objects specially
        if (isFileAnswer(obj)) {
            sanitized[key] = sanitizeFileAnswer(obj as FileAnswer);
            break; // Process the whole object at once
        }

        // For regular objects, sanitize each property
        sanitized[key] = sanitizeValue(value);
    }

    return sanitized;
}

/**
 * Sanitize FileAnswer object
 * @param fileAnswer FileAnswer object
 * @returns Sanitized FileAnswer
 */
function sanitizeFileAnswer(fileAnswer: FileAnswer): FileAnswer {
    return {
        // Sanitize file name - remove special characters but allow basic chars
        fileName: sanitizeFileName(fileAnswer.fileName),

        // File type should be a valid MIME type - validate format
        fileType: sanitizeMimeType(fileAnswer.fileType),

        // File size is a number - pass through as-is
        fileSize: fileAnswer.fileSize,

        // base64Data is a data URL - preserve it
        base64Data: fileAnswer.base64Data
    };
}

/**
 * Sanitize file name to prevent path traversal and special character attacks
 * @param fileName Original file name
 * @returns Sanitized file name
 */
function sanitizeFileName(fileName: string): string {
    return fileName
        // Remove path separators
        .replace(/[\/\\]/g, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove control characters
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
        // Limit length
        .slice(0, 255)
        // Remove leading/trailing whitespace
        .trim();
}

/**
 * Validate and sanitize MIME type
 * @param mimeType MIME type string
 * @returns Sanitized MIME type or fallback
 */
function sanitizeMimeType(mimeType: string): string {
    // Basic MIME type validation: category/subtype
    const mimeTypeRegex = /^[a-z]+\/[a-z0-9\-\+\.]+$/i;

    if (mimeTypeRegex.test(mimeType)) {
        return mimeType.toLowerCase();
    }

    // Fallback to generic binary type if invalid
    return 'application/octet-stream';
}

/**
 * Check if a string is a data URL (base64 encoded data)
 * @param str String to check
 * @returns true if string is a data URL
 */
function isDataURL(str: string): boolean {
    return str.startsWith('data:') && str.includes(';base64,');
}

/**
 * Check if an object is a FileAnswer
 * @param obj Object to check
 * @returns true if object has FileAnswer structure
 */
function isFileAnswer(obj: any): obj is FileAnswer {
    return (
        typeof obj === 'object' &&
        'fileName' in obj &&
        'fileType' in obj &&
        'fileSize' in obj &&
        'base64Data' in obj
    );
}

/**
 * Sanitize HTML content (for rich text fields if added in future)
 * This is stricter than text sanitization and allows some safe HTML
 * @param html HTML string to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^https?:\/\//
    });
}
