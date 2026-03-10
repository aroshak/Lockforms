export type QuestionType =
    // Basic Fields
    | 'text'
    | 'email'
    | 'number'
    | 'paragraph'
    | 'url'        // Website link
    | 'website'    // Alias for url (backward compatibility)
    // Choice Fields
    | 'choice'     // Single choice (radio-like but displayed as list)
    | 'radio'      // Explicit radio buttons
    | 'checkbox'   // Multi-select checkboxes
    | 'dropdown'   // Select dropdown
    | 'picture-choice'  // Radio buttons with images
    | 'rating'
    | 'scale'      // Numbered 1-10 scale (NPS-style)
    // Date/Time
    | 'date'
    | 'datetime'
    // Advanced Fields
    | 'file'
    | 'file-upload'     // Alias for file (backward compatibility)
    | 'signature'
    | 'statement'  // Informational screen
    | 'section';   // Section break / divider

export type LogicCondition = 'equals' | 'not_equals';

export interface LogicRule {
    id: string;
    condition: LogicCondition;
    value: string;
    to: string; // Target ID to jump to
}

export interface Question {
    id: string;
    type: QuestionType;
    title: string;
    description?: string;
    required?: boolean;
    placeholder?: string;
    options?: { id: string; label: string; value: string; imageUrl?: string }[]; // For choice, radio, checkbox, dropdown
    min?: number;
    max?: number;
    accept?: string; // For file type (e.g., "image/*,application/pdf")
    logic?: LogicRule[];
}

// Sharing & Embedding Types
export type AccessLevel = 'public' | 'private' | 'link-only' | 'password-protected';

export interface EmbedSettings {
    allowedDomains?: string[]; // Whitelist of domains allowed to embed (empty = all allowed)
    customHeight?: number; // Default embed height in pixels
    customWidth?: number | 'full'; // Default embed width (number or 'full')
    showBranding?: boolean; // Show "Powered by LockForms" branding
    transparentBackground?: boolean; // Transparent iframe background
}

export interface SharingSettings {
    accessLevel: AccessLevel; // Access control level
    allowEmbedding: boolean; // Enable/disable iframe embeds
    password?: string; // Hashed password for password-protected forms
    embedSettings?: EmbedSettings; // Embed customization options
    shareToken?: string; // Secure token for link-only access
    generatedAt?: string; // Timestamp when settings were created/updated
}

export interface FormSchema {
    id: string;
    title: string;
    questions: Question[];
    schema?: Question[];
    settings?: {
        theme?: 'midnight' | 'sunrise' | 'ocean' | 'forest' | 'light' | 'soft' | 'corporate';
        transition?: 'tunnel' | 'slide' | 'fade' | 'stack';
        showProgressBar?: boolean;
        buttonText?: string;
        welcomeScreen?: {
            enabled: boolean;
            title: string;
            description?: string;
            buttonText: string;
        };
        endScreen?: {
            enabled: boolean;
            title: string;
            description?: string;
            buttonText?: string;
            redirectUrl?: string;
        };
        sharing?: SharingSettings; // NEW: Sharing and embedding configuration
    };
}

export interface FormAnswer {
    questionId: string;
    value: string | number | string[] | File;
}

// File Upload Answer Structure
export interface FileAnswer {
    fileName: string;
    fileType: string; // MIME type
    fileSize: number; // bytes
    base64Data: string; // data URL with base64 content
}

// Signature Answer Type (base64 encoded PNG image)
export type SignatureAnswer = string; // data:image/png;base64,...

// Answer Types Union for database storage
export type AnswerValue =
    | string                // text, email, url, radio, dropdown, date, datetime
    | number                // number, rating, scale
    | string[]              // checkbox
    | SignatureAnswer       // signature
    | FileAnswer;          // file
