import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildSubmissionSchema, validateSubmissionSize } from '@/lib/validation/submission';
import { sanitizeAnswers } from '@/lib/sanitization/answers';

export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { answers } = body;

        // Basic validation: answers must exist
        if (!answers || typeof answers !== 'object') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_REQUEST',
                        message: 'Answers are required and must be an object'
                    }
                },
                { status: 400 }
            );
        }

        // Find the form with schema
        const form = await prisma.form.findUnique({
            where: { slug: params.slug },
            select: {
                id: true,
                version: true,
                schema: true
            }
        });

        if (!form) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'FORM_NOT_FOUND',
                        message: 'Form not found'
                    }
                },
                { status: 404 }
            );
        }

        // Validate submission size (prevent database bloat)
        const sizeCheck = validateSubmissionSize(answers);
        if (!sizeCheck.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUBMISSION_TOO_LARGE',
                        message: `Submission size (${Math.round(sizeCheck.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(sizeCheck.maxSize / 1024 / 1024)}MB). Please reduce file sizes or remove some files.`
                    }
                },
                { status: 413 } // Payload Too Large
            );
        }

        // Build Zod schema from form questions
        // Schema can be stored as array directly or as object with questions property
        const schema = form.schema as any;
        let questions: any[] = [];

        if (Array.isArray(schema)) {
            questions = schema;
        } else if (schema && typeof schema === 'object' && Array.isArray(schema.questions)) {
            questions = schema.questions;
        }

        const validationSchema = buildSubmissionSchema(questions);

        // Validate answers against schema
        const validationResult = validationSchema.safeParse({ answers });

        if (!validationResult.success) {
            // Format Zod errors for client
            const errors = validationResult.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Form validation failed',
                        details: errors
                    }
                },
                { status: 400 }
            );
        }

        // Sanitize text inputs to prevent XSS attacks
        const sanitizedAnswers = sanitizeAnswers(validationResult.data.answers);

        // Create submission
        const submission = await prisma.submission.create({
            data: {
                formId: form.id,
                answers: sanitizedAnswers,
                formVersion: form.version,
                metadata: {
                    submittedAt: new Date().toISOString(),
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                    submissionSize: sizeCheck.size
                }
            }
        });

        return NextResponse.json({
            success: true,
            submissionId: submission.id
        });

    } catch (error) {
        console.error('Error submitting form:', error);

        // Return structured error response
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred while processing your submission'
                }
            },
            { status: 500 }
        );
    }
}
