import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';

export const syntaxEditorTheme = EditorView.theme({
    '&': {
        color: 'var(--palette-foreground)',
        backgroundColor: 'transparent',
    },
    '.cm-content': {
        caretColor: 'transparent',
    },
    '.cm-line': {
        padding: 0,
    },
}, { dark: true });

export const syntaxHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: 'var(--palette-code-keyword)' },
    { tag: tags.operatorKeyword, color: 'var(--palette-code-keyword)' },
    { tag: [tags.operator, tags.compareOperator, tags.logicOperator, tags.arithmeticOperator],
        color: 'var(--palette-code-operator)' },
    { tag: [tags.string, tags.special(tags.string), tags.inserted],
        color: 'var(--palette-code-string)' },
    { tag: [tags.comment, tags.meta, tags.lineComment, tags.blockComment],
        color: 'var(--palette-subtle)' },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
        color: 'var(--palette-code-function)' },
    { tag: [tags.className, tags.typeName, tags.namespace],
        color: 'var(--palette-code-type)' },
    { tag: [tags.number, tags.integer, tags.float, tags.bool, tags.atom],
        color: 'var(--palette-code-number)' },
    { tag: tags.propertyName, color: 'var(--palette-code-property)' },
    { tag: [tags.variableName, tags.definition(tags.variableName)],
        color: 'var(--palette-foreground)' },
    { tag: [tags.name, tags.labelName],
        color: 'var(--palette-foreground)' },
    { tag: [tags.punctuation, tags.separator, tags.bracket, tags.paren, tags.squareBracket, tags.brace],
        color: 'var(--palette-muted)' },
    { tag: tags.invalid, color: 'var(--palette-danger)' },
]);

export const syntaxHighlightExtensions = [
    syntaxEditorTheme,
    syntaxHighlighting(syntaxHighlightStyle),
];
