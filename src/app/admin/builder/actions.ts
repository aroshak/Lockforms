'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateId } from '@/lib/utils';


// Input validation schemas


export type FormState = {
    success: boolean;
    message?: string;
    data?: any;
};

export async function upsertForm(
    id: string | null,
    title: string,
    questions: any[],
    settings: any
): Promise<FormState> {
    try {
        // 1. Validate inputs (basic check)
        if (!title) return { success: false, message: 'Title is required' };

        // 2. Prepare data
        // Ensure we use the Prisma JSON type correctly
        const schemaData = questions; // Prisma handles JSON[] automagically
        const settingsData = settings;

        // 3. Upsert
        let form;
        if (id) {
            // Update existing — preserve existing slug
            form = await prisma.form.update({
                where: { id },
                data: {
                    title,
                    schema: schemaData,
                    settings: settingsData,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new — generate slug
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + generateId().substring(0, 4);
            form = await prisma.form.create({
                data: {
                    title,
                    slug,
                    schema: schemaData,
                    settings: settingsData,
                    isPublished: false,
                },
            });
        }

        revalidatePath('/admin');
        return { success: true, message: 'Form saved successfully', data: form };
    } catch (error) {
        console.error('Failed to save form:', error);
        return { success: false, message: 'Failed to save form' };
    }
}

export async function deleteForm(id: string) {
    try {
        await prisma.form.delete({
            where: { id },
        });
        revalidatePath('/admin');
        return { success: true, message: 'Form deleted successfully' };
    } catch (error) {
        console.error('Failed to delete form:', error);
        return { success: false, message: 'Failed to delete form' };
    }
}

export async function getForm(id: string) {
    try {
        const form = await prisma.form.findUnique({
            where: { id },
        });
        return { success: true, data: form };
    } catch (error) {
        console.error('Failed to get form:', error);
        return { success: false, message: 'Failed to retrieve form' };
    }
}

export async function duplicateForm(id: string, newTitle?: string): Promise<FormState> {
    try {
        // 1. Fetch the source form
        const sourceForm = await prisma.form.findUnique({
            where: { id },
        });

        if (!sourceForm) {
            return { success: false, message: 'Source form not found' };
        }

        // 2. Determine new title
        const title = newTitle?.trim() || `Copy of ${sourceForm.title}`;

        // 3. Generate unique slug from new title
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + generateId().substring(0, 4);

        // 4. Create the copy — same schema & settings, fresh metadata
        const newForm = await prisma.form.create({
            data: {
                title,
                slug,
                description: sourceForm.description,
                schema: sourceForm.schema as any,
                settings: sourceForm.settings as any,
                isPublished: false,  // Always start as draft
                enabled: true,
                version: 1,
            },
        });

        revalidatePath('/admin');
        return {
            success: true,
            message: `Form duplicated as "${title}"`,
            data: newForm,
        };
    } catch (error) {
        console.error('Failed to duplicate form:', error);
        return { success: false, message: 'Failed to duplicate form' };
    }
}
