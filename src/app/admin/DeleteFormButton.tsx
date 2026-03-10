'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteForm } from './builder/actions';

export function DeleteFormButton({ id, title }: { id: string; title: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteForm(id);
            if (!result.success) {
                alert('Failed to delete form: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting form:', error);
            alert('An error occurred while deleting the form.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
