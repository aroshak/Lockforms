'use client';

import { FormRenderer } from "@/components/form-renderer/FormRenderer";
import { PasswordPrompt } from "@/components/form-renderer/PasswordPrompt";
import { FormSchema } from "@/types/form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DynamicFormPage({ params }: { params: { slug: string } }) {
    const [form, setForm] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [passwordToken, setPasswordToken] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    const isEmbedMode = searchParams.get('embed') === 'true';
    const token = searchParams.get('token');

    useEffect(() => {
        async function loadForm() {
            try {
                // Build URL with query params
                let url = `/api/forms/${params.slug}`;
                const queryParams = new URLSearchParams();

                if (isEmbedMode) queryParams.append('embed', 'true');
                if (token) queryParams.append('token', token);

                const queryString = queryParams.toString();
                if (queryString) url += `?${queryString}`;

                // Build headers — include password token if verified
                const headers: HeadersInit = {};
                if (passwordToken) {
                    headers['X-Password-Token'] = passwordToken;
                }

                const response = await fetch(url, { headers });
                const data = await response.json();

                if (!response.ok) {
                    // Check if password is required
                    if (response.status === 403 && data.requiresPassword) {
                        setRequiresPassword(true);
                        setLoading(false);
                        return;
                    }
                    throw new Error(data.error || 'Failed to load form');
                }

                setForm(data);
                setRequiresPassword(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load form');
            } finally {
                setLoading(false);
            }
        }

        loadForm();
    }, [params.slug, isEmbedMode, token, passwordToken]);

    const handleSubmit = async (answers: Record<string, any>) => {
        const response = await fetch(`/api/forms/${params.slug}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Extract error message from API response
            let errorMessage = 'Submission failed';

            if (data.error) {
                if (data.error.code === 'VALIDATION_ERROR' && data.error.details) {
                    // Deduplicate field IDs and resolve to human-readable question titles
                    const fieldIds = Array.from(new Set(
                        data.error.details.map((d: { field: string }) =>
                            d.field.replace('answers.', '')
                        )
                    )) as string[];
                    const fieldNames = fieldIds.map((id: string) => {
                        const question = form?.questions?.find((q: { id: string }) => q.id === id);
                        return question?.title || id;
                    });
                    errorMessage = `Please check your answers for: ${fieldNames.join(', ')}`;
                } else {
                    errorMessage = data.error.message || errorMessage;
                }
            }

            throw new Error(errorMessage);
        }

        console.log("Form submitted successfully!");
    };

    const handlePasswordSuccess = (verificationToken: string) => {
        setPasswordToken(verificationToken);
        setRequiresPassword(false);
        setLoading(true);
    };

    // Show password prompt if required
    if (requiresPassword && !passwordToken) {
        return <PasswordPrompt formSlug={params.slug} onSuccess={handlePasswordSuccess} />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading form...</p>
                </div>
            </div>
        );
    }

    if (error || !form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📝</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'This form does not exist or has been removed.'}</p>
                    {!isEmbedMode && (
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Go to Homepage
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Wrap in embed mode class if embed parameter is present
    const showBranding = form.settings?.sharing?.embedSettings?.showBranding ?? true;
    const isTransparent = form.settings?.sharing?.embedSettings?.transparentBackground ?? false;

    return (
        <div
            className={`${isEmbedMode ? 'embed-mode' : ''} ${isTransparent ? 'transparent' : ''}`}
            style={isTransparent ? { background: 'transparent' } : undefined}
        >
            <FormRenderer
                form={form}
                onSubmit={handleSubmit}
            />
            {isEmbedMode && !showBranding && (
                <style jsx>{`
                    .embed-mode :global(footer) {
                        display: none;
                    }
                `}</style>
            )}
        </div>
    );
}
