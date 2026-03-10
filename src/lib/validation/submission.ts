import { z } from 'zod';
import type { Question } from '@/types/form';

// Maximum file size: 5MB (as confirmed by user)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5,242,880 bytes

// File Upload Answer Schema
const FileAnswerSchema = z.object({
    fileName: z.string()
        .min(1, 'File name is required')
        .max(255, 'File name too long'),
    fileType: z.string()
        .min(1, 'File type is required')
        .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
    fileSize: z.number()
        .int('File size must be an integer')
        .positive('File size must be positive')
        .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
    base64Data: z.string()
        .regex(/^data:[^;]+;base64,/, 'Invalid base64 data URL format')
        .min(1, 'File data is required')
});

// Signature Answer Schema (base64 PNG)
const SignatureAnswerSchema = z.string()
    .regex(/^data:image\/png;base64,/, 'Signature must be a base64-encoded PNG image')
    .min(100, 'Signature data is too short - may be empty');

// URL Answer Schema — auto-prepend https:// if user omits protocol
const UrlAnswerSchema = z.preprocess(
    (val) => {
        if (typeof val !== 'string' || val.trim() === '') return val;
        const trimmed = val.trim();
        // Auto-prepend https:// if no protocol is provided
        if (!/^https?:\/\//i.test(trimmed)) {
            return `https://${trimmed}`;
        }
        return trimmed;
    },
    z.string().url('Please enter a valid URL')
);

// Email Answer Schema
const EmailAnswerSchema = z.string()
    .email('Please enter a valid email address');

// Number Answer Schema (dynamic based on question min/max)
// Note: HTML input elements return string values, so we coerce to number
const createNumberSchema = (min?: number, max?: number): z.ZodEffects<z.ZodNumber, number, unknown> => {
    let schema = z.coerce.number({
        invalid_type_error: 'Please enter a valid number',
        required_error: 'Number is required'
    });

    if (min !== undefined) {
        schema = schema.min(min, `Value must be at least ${min}`);
    }
    if (max !== undefined) {
        schema = schema.max(max, `Value must not exceed ${max}`);
    }

    return schema;
};

// Text Answer Schema (basic string validation)
const TextAnswerSchema = z.string().max(10000, 'Text is too long');

// Paragraph Answer Schema (longer text)
const ParagraphAnswerSchema = z.string().max(50000, 'Text is too long');

// Choice Answer Schema (single selection)
const createChoiceSchema = (options: { value: string }[]): z.ZodString => {
    const allowedValues = options.map(opt => opt.value);
    return z.string().refine(
        (val) => allowedValues.includes(val),
        'Invalid option selected'
    );
};

// Checkbox Answer Schema (multiple selections)
const createCheckboxSchema = (options: { value: string }[]): z.ZodArray<z.ZodString> => {
    const allowedValues = options.map(opt => opt.value);
    return z.array(z.string()).refine(
        (values) => values.every(val => allowedValues.includes(val)),
        'Invalid options selected'
    );
};

// Date Answer Schema
const DateAnswerSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
);

// DateTime Answer Schema
const DateTimeAnswerSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
    'DateTime must be in ISO format'
);

// Rating Answer Schema (1-5)
const RatingAnswerSchema = z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5');

/**
 * Build a dynamic Zod schema based on form questions
 * @param questions Array of form questions
 * @returns Zod schema for validating submission answers
 */
export function buildSubmissionSchema(questions: Question[]): z.ZodObject<any> {
    const answerSchemas: Record<string, z.ZodTypeAny> = {};

    questions.forEach((question) => {
        let schema: z.ZodTypeAny;

        // Build schema based on question type
        switch (question.type) {
            case 'text':
                schema = TextAnswerSchema;
                break;

            case 'email':
                schema = EmailAnswerSchema;
                break;

            case 'number':
                schema = createNumberSchema(question.min, question.max);
                break;

            case 'paragraph':
                schema = ParagraphAnswerSchema;
                break;

            case 'url':
            case 'website':
                schema = UrlAnswerSchema;
                break;

            case 'date':
                schema = DateAnswerSchema;
                break;

            case 'datetime':
                schema = DateTimeAnswerSchema;
                break;

            case 'rating':
                schema = RatingAnswerSchema;
                break;

            case 'file':
            case 'file-upload':
                schema = FileAnswerSchema;
                // Validate file type if accept pattern is specified
                if (question.accept) {
                    schema = schema.refine(
                        (fileData) => validateFileType(fileData.fileType, question.accept!),
                        { message: `File type not allowed. Expected: ${question.accept}` }
                    );
                }
                break;

            case 'signature':
                schema = SignatureAnswerSchema;
                break;

            case 'radio':
            case 'choice':
            case 'dropdown':
            case 'picture-choice':
                if (question.options && question.options.length > 0) {
                    schema = createChoiceSchema(question.options);
                } else {
                    schema = z.string();
                }
                break;

            case 'checkbox':
                if (question.options && question.options.length > 0) {
                    schema = createCheckboxSchema(question.options);
                } else {
                    schema = z.array(z.string());
                }
                break;

            case 'statement':
            case 'section':
                // These are display-only types, no validation needed
                return;

            default:
                // Fallback for unknown types
                schema = z.any();
        }

        // Make optional if not required
        // Use z.preprocess to normalize empty/whitespace strings to undefined
        // before validation, so optional URL/email fields don't fail on ""
        if (!question.required) {
            schema = z.preprocess(
                (val) => {
                    if (val === undefined || val === null) return undefined;
                    if (typeof val === 'string' && val.trim() === '') return undefined;
                    return val;
                },
                schema.optional()
            );
        }

        answerSchemas[question.id] = schema;
    });

    return z.object({
        answers: z.object(answerSchemas)
    });
}

/**
 * Validate file type against accept pattern
 * @param mimeType File MIME type (e.g., "image/png")
 * @param acceptPattern Accept pattern (e.g., "image/*,application/pdf")
 * @returns true if file type matches pattern
 */
function validateFileType(mimeType: string, acceptPattern: string): boolean {
    const patterns = acceptPattern.split(',').map(p => p.trim());

    return patterns.some(pattern => {
        // Exact match
        if (pattern === mimeType) return true;

        // Wildcard match (e.g., "image/*")
        if (pattern.endsWith('/*')) {
            const category = pattern.slice(0, -2);
            return mimeType.startsWith(category + '/');
        }

        // File extension match (e.g., ".pdf")
        if (pattern.startsWith('.')) {
            const extension = pattern.slice(1);
            return mimeType.includes(extension);
        }

        return false;
    });
}

/**
 * Validate total submission size to prevent database bloat
 * @param answers Submission answers object
 * @returns size in bytes
 */
export function calculateSubmissionSize(answers: Record<string, any>): number {
    const jsonString = JSON.stringify(answers);
    return new Blob([jsonString]).size;
}

/**
 * Check if submission size exceeds recommended limit
 * Recommended limit: 10MB total submission size
 */
export function validateSubmissionSize(answers: Record<string, any>): {
    valid: boolean;
    size: number;
    maxSize: number;
} {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const size = calculateSubmissionSize(answers);

    return {
        valid: size <= maxSize,
        size,
        maxSize
    };
}
