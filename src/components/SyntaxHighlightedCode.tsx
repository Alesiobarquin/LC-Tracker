import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView } from '@codemirror/view';
import { clsx } from 'clsx';
import { SyntaxLanguage } from '../data/syntaxCards';
import { syntaxHighlightExtensions } from '../utils/syntaxHighlightTheme';

type SyntaxHighlightSize = 'sm' | 'md' | 'lg' | 'xl';

interface SyntaxHighlightedCodeProps {
    code: string;
    language: SyntaxLanguage;
    className?: string;
    size?: SyntaxHighlightSize;
}

const languageExtension = (language: SyntaxLanguage) => {
    if (language === 'cpp') return cpp();
    return python();
};

const sizeClasses: Record<SyntaxHighlightSize, string> = {
    sm: 'syntax-highlighted-code--sm',
    md: 'syntax-highlighted-code--md',
    lg: 'syntax-highlighted-code--lg',
    xl: 'syntax-highlighted-code--xl',
};

export const SyntaxHighlightedCode: React.FC<SyntaxHighlightedCodeProps> = ({
    code,
    language,
    className,
    size = 'md',
}) => {
    const extensions = useMemo(
        () => [languageExtension(language), EditorView.lineWrapping, ...syntaxHighlightExtensions],
        [language],
    );

    return (
        <CodeMirror
            value={code}
            extensions={extensions}
            theme="none"
            editable={false}
            readOnly
            basicSetup={false}
            className={clsx('syntax-highlighted-code', sizeClasses[size], className)}
        />
    );
};
