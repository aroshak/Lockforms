import { FormBuilder } from "@/components/form-builder/FormBuilder";

export default function BuilderPage({
    searchParams,
}: {
    searchParams: { id?: string };
}) {
    return <FormBuilder formId={searchParams.id} />;
}
