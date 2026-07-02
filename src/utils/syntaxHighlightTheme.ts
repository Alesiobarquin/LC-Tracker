import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';

const zinc200 = '#e4e4e7';
const zinc400 = '#a1a1aa';
const zinc500 = '#71717a';
const emerald400 = '#34d399';
const violet400 = '#c084fc';
const sky400 = '#38bdf8';
const amber400 = '#fbbf24';
const cyan300 = '#67e8f9';

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
    { tag: tags.invalid, color: '#f87171' },
]);

export const syntaxHighlightExtensions = [
    syntaxEditorTheme,
    syntaxHighlighting(syntaxHighlightStyle),
];
