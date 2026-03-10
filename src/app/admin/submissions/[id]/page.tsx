import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { SubmissionsClient } from './SubmissionsClient';

async function getFormWithSubmissions(id: string) {
    const form = await prisma.form.findUnique({
        where: { id },
        include: {
            submissions: {
                orderBy: { submittedAt: 'desc' }
            }
        }
    });
    return form;
}

export default async function SubmissionsPage({ params }: { params: { id: string } }) {
    const form = await getFormWithSubmissions(params.id);

    if (!form) {
        notFound();
    }

    return (
        <SubmissionsClient form={form} submissions={form.submissions} />
    );
}
