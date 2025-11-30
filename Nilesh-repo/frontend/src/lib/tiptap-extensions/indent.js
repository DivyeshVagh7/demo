import { Extension } from '@tiptap/core';

const MAX_INDENT = 4;

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          'data-indent': {
            default: 0,
            parseHTML: element => parseInt(element.getAttribute('data-indent') || '0', 10),
            renderHTML: attributes => {
              if (attributes['data-indent'] > 0) {
                return { 'data-indent': attributes['data-indent'] };
              }
              return {};
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs['data-indent'] || 0;
            if (currentIndent < MAX_INDENT) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, 'data-indent': currentIndent + 1 });
            }
          }
        });
        if (dispatch) {
          dispatch(tr);
        }
        return true;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { from, to } = selection;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs['data-indent'] || 0;
            if (currentIndent > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, 'data-indent': currentIndent - 1 });
            }
          }
        });
        if (dispatch) {
          dispatch(tr);
        }
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Backspace': () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (empty && $from.parentOffset === 0) {
          const parentNode = $from.parent;
          if (this.options.types.includes(parentNode.type.name) && parentNode.attrs['data-indent'] > 0) {
            return this.editor.commands.outdent();
          }
        }

        return false; // Let default behavior run
      },
    };
  },
});
