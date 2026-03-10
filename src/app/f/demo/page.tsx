'use client';

import { FormRenderer } from "@/components/form-renderer/FormRenderer";
import { FormSchema } from "@/types/form";

// Comprehensive demo form showing all field types
const demoForm: FormSchema = {
    id: "demo-all-fields",
    title: "LockForms Field Type Demo",
    questions: [
        {
            id: "q1",
            type: "text",
            title: "What is your name?",
            description: "Short text input with placeholder",
            placeholder: "Jane Doe",
            required: true,
        },
        {
            id: "q2",
            type: "email",
            title: "What is your email address?",
            description: "Email validation is automatic",
            placeholder: "name@example.com",
            required: true,
        },
        {
            id: "q3",
            type: "number",
            title: "How many years of experience do you have?",
            placeholder: "Enter a number",
            min: 0,
            max: 50,
        },
        {
            id: "q4",
            type: "paragraph",
            title: "Tell us about yourself",
            description: "Long text area for detailed responses",
            placeholder: "Write your story...",
        },
        {
            id: "q5",
            type: "date",
            title: "When did you start using form builders?",
            description: "Date picker field",
        },
        {
            id: "q6",
            type: "rating",
            title: "How would you rate your experience?",
            description: "Click a star to rate (1-5)",
            required: true,
        },
        {
            id: "q7",
            type: "radio",
            title: "Which product interests you most?",
            description: "Single choice (radio buttons)",
            options: [
                { id: "opt1", label: "LockForms Basic", value: "basic" },
                { id: "opt2", label: "LockForms Pro", value: "pro" },
                { id: "opt3", label: "LockForms Enterprise", value: "enterprise" },
            ],
        },
        {
            id: "q8",
            type: "checkbox",
            title: "Which features do you need?",
            description: "Multi-select (checkboxes)",
            options: [
                { id: "opt4", label: "Form Builder", value: "builder" },
                { id: "opt5", label: "Analytics", value: "analytics" },
                { id: "opt6", label: "Integrations", value: "integrations" },
                { id: "opt7", label: "Custom Branding", value: "branding" },
            ],
        },
        {
            id: "q9",
            type: "dropdown",
            title: "What is your company size?",
            description: "Dropdown select",
            placeholder: "Choose an option...",
            options: [
                { id: "opt8", label: "1-10 employees", value: "small" },
                { id: "opt9", label: "11-50 employees", value: "medium" },
                { id: "opt10", label: "51-200 employees", value: "large" },
                { id: "opt11", label: "200+ employees", value: "enterprise" },
            ],
        },
        {
            id: "q10",
            type: "statement",
            title: "We are almost done!",
            description: "Just a few more questions about your preferences.",
        },
        {
            id: "q11",
            type: "radio",
            title: "Choose a template style",
            description: "Picture Choice Example (images disabled in air-gapped mode)",
            options: [
                { id: "p1", label: "Minimal", value: "minimal" },
                { id: "p2", label: "Bold", value: "bold" },
                { id: "p3", label: "Corporate", value: "corporate" },
            ]
        },
        {
            id: "q12",
            type: "url",
            title: "Visit our documentation",
            description: "Learn more about our features.",
        },
        {
            id: "q13",
            type: "text",
            title: "Any final thoughts?",
            description: "Thank you for testing all our field types!",
            placeholder: "Share your feedback...",
            required: false,
        },
    ],
    settings: {
        welcomeScreen: {
            enabled: true,
            title: "Welcome to the Demo",
            description: "Experience the new features of LockForms.",
            buttonText: "Let's Start"
        },
        endScreen: {
            enabled: true,
            title: "You're All Set!",
            description: "Thanks for trying out the demo.",
            buttonText: "Restart Demo",
            redirectUrl: ""
        }
    }
};

export default function DemoFormPage() {
    const handleSubmit = (answers: Record<string, any>) => {
        console.log("Submitted answers:", answers);
        alert("Form submitted! Check console for all answers.");
    };

    return <FormRenderer form={demoForm} onSubmit={handleSubmit} />;
}
