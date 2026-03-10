import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionCard } from '../components/form-renderer/QuestionCard';
import { Question } from '../types/form';
import '@testing-library/jest-dom';

const mockQuestion: Question = {
    id: 'q1',
    type: 'text',
    title: 'Test Question',
    description: 'Test Description',
    required: true,
    placeholder: 'Enter text...'
};

const mockOnAnswer = jest.fn();
const mockOnNext = jest.fn();

describe('QuestionCard Component', () => {
    beforeEach(() => {
        mockOnAnswer.mockClear();
        mockOnNext.mockClear();
    });

    test('renders question title and description', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                isActive={true}
                onAnswer={mockOnAnswer}
                onNext={mockOnNext}
            />
        );
        expect(screen.getByText('Test Question')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('renders text input correctly', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                isActive={true}
                onAnswer={mockOnAnswer}
                onNext={mockOnNext}
            />
        );
        const input = screen.getByPlaceholderText('Enter text...');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'text');
    });

    test('calls onAnswer when typing', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                isActive={true}
                onAnswer={mockOnAnswer}
                onNext={mockOnNext}
            />
        );
        const input = screen.getByPlaceholderText('Enter text...');
        fireEvent.change(input, { target: { value: 'Hello World' } });
        expect(mockOnAnswer).toHaveBeenCalledWith('Hello World');
    });

    test('calls onNext when OK button is clicked', () => {
        render(
            <QuestionCard
                question={mockQuestion}
                isActive={true}
                onAnswer={mockOnAnswer}
                onNext={mockOnNext}
            />
        );
        const button = screen.getByText('OK');
        fireEvent.click(button);
        expect(mockOnNext).toHaveBeenCalled();
    });
});
