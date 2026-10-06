import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';

const zinc200 = 'var(--palette-foreground)';
const zinc400 = 'var(--palette-muted)';
const zinc500 = 'var(--palette-subtle)';
const emerald400 = 'var(--palette-accent)';
const violet400 = 'var(--palette-violet)';
const sky400 = 'var(--palette-info)';
const amber400 = 'var(--palette-warning)';
const cyan300 = 'var(--palette-cyan)';

export const syntaxEditorTheme = EditorView.theme({
    '&': {
        color: zinc200,
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
    { tag: tags.keyword, color: violet400 },
    { tag: tags.operatorKeyword, color: violet400 },
    { tag: [tags.operator, tags.compareOperator, tags.logicOperator, tags.arithmeticOperator],
        color: cyan300 },
    { tag: [tags.string, tags.special(tags.string), tags.inserted],
        color: emerald400 },
    { tag: [tags.comment, tags.meta, tags.lineComment, tags.blockComment],
        color: zinc500 },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
        color: sky400 },
    { tag: [tags.className, tags.typeName, tags.namespace],
        color: amber400 },
    { tag: [tags.number, tags.integer, tags.float, tags.bool, tags.atom],
        color: amber400 },
    { tag: tags.propertyName, color: sky400 },
    { tag: [tags.variableName, tags.definition(tags.variableName)],
        color: zinc200 },
    { tag: [tags.name, tags.labelName],
        color: zinc200 },
    { tag: [tags.punctuation, tags.separator, tags.bracket, tags.paren, tags.squareBracket, tags.brace],
        color: zinc400 },
    { tag: tags.invalid, color: 'var(--palette-danger)' },
]);

export const syntaxHighlightExtensions = [
    syntaxEditorTheme,
    syntaxHighlighting(syntaxHighlightStyle),
];
