'use strict';

import dialog from '../modules/dialog';

export default {
    name: 'math',
    display: 'dialog',
    add: function (core) {
        core.addModule([dialog]);

        const context = core.context;
        context.math = {
            focusElement: null,
            previewElement: null,
            fontSizeElement: null,
            _mathExp: null,
            _renderer: null
        };

        /** math dialog */
        let math_dialog = this.setDialog.call(core);
        context.math.modal = math_dialog;
        context.math.focusElement = math_dialog.querySelector('.se-math-exp');
        context.math.previewElement = math_dialog.querySelector('.se-math-preview');
        context.math.fontSizeElement = math_dialog.querySelector('.se-math-size');
        context.math._renderer = function (exp) {
            return this.src.renderToString(exp, this.options);
        }.bind(core.context.option.katex);

        context.math.focusElement.addEventListener('keyup', this._renderMathExp.bind(context.math), false);
        context.math.focusElement.addEventListener('change', this._renderMathExp.bind(context.math), false);
        context.math.fontSizeElement.addEventListener('change', function (e) { this.fontSize = e.target.value; }.bind(context.math.previewElement.style), false);

        /** math controller */
        let math_controller = this.setController_MathButton.call(core);
        context.math.mathController = math_controller;
        context.math._mathExp = null;
        math_controller.addEventListener('mousedown', function (e) { e.stopPropagation(); }, false);

        /** add event listeners */
        math_dialog.querySelector('.se-btn-primary').addEventListener('click', this.submit.bind(core), false);
        math_controller.addEventListener('click', this.onClick_mathController.bind(core));

        /** append html */
        context.dialog.modal.appendChild(math_dialog);
        context.element.relative.appendChild(math_controller);

        /** empty memory */
        math_dialog = null, math_controller = null;
    },

    /** dialog */
    setDialog: function () {
        const lang = this.lang;
        const dialog = this.util.createElement('DIV');

        dialog.className = 'se-dialog-content';
        dialog.style.display = 'none';
        dialog.innerHTML = '' +
        '<form>' +
            '<div class="se-dialog-header">' +
                '<button type="button" data-command="close" class="se-btn se-dialog-close" aria-label="Close" title="' + lang.dialogBox.close + '">' +
                    this.icons.cancel +
                '</button>' +
                '<span class="se-modal-title">' + lang.dialogBox.mathBox.title + '</span>' +
            '</div>' +
            '<div class="se-dialog-body">' +
                '<div class="se-dialog-form">' +
                    '<label>' + lang.dialogBox.mathBox.inputLabel + ' (<a href="https://katex.org/docs/supported.html" target="_blank">KaTeX</a>)</label>' +
                    '<textarea class="se-input-form se-math-exp" type="text"></textarea>' +
                '</div>' +
                '<div class="se-dialog-form">' +
                    '<label>' + lang.dialogBox.mathBox.fontSizeLabel + '</label>' +
                    '<select class="se-input-select se-math-size">' +
                        '<option value="1em">1</option>' +
                        '<option value="1.5em">1.5</option>' +
                        '<option value="2em">2</option>' +
                        '<option value="2.5em">2.5</option>' +
                    '</select>' +
                '</div>' +
                '<div class="se-dialog-form">' +
                    '<label>' + lang.dialogBox.mathBox.previewLabel + '</label>' +
                    '<p class="se-math-preview"></p>' +
                '</div>' +
            '</div>' +
            '<div class="se-dialog-footer">' +
                '<button type="submit" class="se-btn-primary" title="' + lang.dialogBox.submitButton + '"><span>' + lang.dialogBox.submitButton + '</span></button>' +
            '</div>' +
        '</form>';

        return dialog;
    },

    /** modify controller button */
    setController_MathButton: function () {
        const lang = this.lang;
        const math_btn = this.util.createElement('DIV');

        math_btn.className = 'se-controller se-controller-link';
        math_btn.innerHTML = '' +
        '<div class="se-arrow se-arrow-up"></div>' +
        '<div class="link-content">' +
            '<div class="se-btn-group">' +
                '<button type="button" data-command="update" tabindex="-1" class="se-btn se-tooltip">' +
                    this.icons.edit +
                    '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.edit + '</span></span>' +
                '</button>' +
                '<button type="button" data-command="delete" tabindex="-1" class="se-btn se-tooltip">' +
                    this.icons.delete +
                    '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + lang.controller.remove + '</span></span>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '';

        return math_btn;
    },

    open: function () {
        this.plugins.dialog.open.call(this, 'math', 'math' === this.currentControllerName);
    },

    _renderMathExp: function (e) {
        this.previewElement.innerHTML = this._renderer(e.target.value);
    },

    submit: function (e) {
        this.showLoading();

        e.preventDefault();
        e.stopPropagation();

        const submitAction = function () {
            if (this.context.math.focusElement.value.trim().length === 0) return false;

            const contextMath = this.context.math;
            const mathExp = contextMath.focusElement.value;
            const katexEl = contextMath.previewElement.querySelector('.katex');

            if (!katexEl) return false;
            katexEl.setAttribute('contenteditable', false);
            katexEl.setAttribute('data-exp', mathExp);
            katexEl.setAttribute('data-font-size', contextMath.fontSizeElement.value);
            katexEl.style.fontSize = contextMath.fontSizeElement.value;

            if (!this.context.dialog.updateModal) {
                const selectedFormats = this.getSelectedElements();

                if (selectedFormats.length > 1) {
                    const oFormat = this.util.createElement(selectedFormats[0].nodeName);
                    oFormat.appendChild(katexEl);
                    this.insertNode(oFormat);
                } else {
                    this.insertNode(katexEl);
                }

                const empty = this.util.createTextNode(this.util.zeroWidthSpace);
                katexEl.parentNode.insertBefore(empty, katexEl.nextSibling);
                this.setRange(katexEl, 0, katexEl, 1);
            } else {
                const findParent = function (child, className) {
                    if (child.classList.contains(className)) return child;

                    const parent = child.parentNode;

                    if (parent === document.body) return;

                    if (parent.classList.contains(className)) {
                        return parent;
                    } else {
                        findParent(parent, className);
                    }
                };
                const containerEl = findParent(contextMath._mathExp, 'katex');
                containerEl.parentNode.replaceChild(katexEl, containerEl);
                this.setRange(katexEl, 0, katexEl, 1);
            }

            contextMath.focusElement.value = '';
            contextMath.fontSizeElement.value = '1em';
            contextMath.previewElement.style.fontSize = '1em';
            contextMath.previewElement.innerHTML = '';

            return true;
        }.bind(this);

        try {
            if (submitAction()) {
                this.plugins.dialog.close.call(this);
                // history stack
                this.history.push(false);
            }
        } catch (e) {
            this.plugins.dialog.close.call(this);
        } finally {
            this.closeLoading();
        }

        return false;
    },

    active: function (element) {
        if (!element) {
            if (this.controllerArray.indexOf(this.context.math.mathController) > -1) {
                this.controllersOff();
            }
        } else if (element.getAttribute('data-exp')) {
            if (this.controllerArray.indexOf(this.context.math.mathController) < 0) {
                this.setRange(element, 0, element, 1);
                this.plugins.math.call_controller.call(this, element);
            }
            return true;
        }

        return false;
    },

    on: function (update) {
        if (!update) {
            this.plugins.math.init.call(this);
        } else {
            const contextMath = this.context.math;
            if (contextMath._mathExp) {
                const exp = contextMath._mathExp.getAttribute('data-exp');
                const fontSize = contextMath._mathExp.getAttribute('data-font-size') || '1em';
                this.context.dialog.updateModal = true;
                contextMath.focusElement.value = exp;
                contextMath.fontSizeElement.value = fontSize;
                contextMath.previewElement.innerHTML = contextMath._renderer(exp);
                contextMath.previewElement.style.fontSize = fontSize;
            }
        }
    },

    call_controller: function (mathTag) {
        this.context.math._mathExp = mathTag;
        const mathBtn = this.context.math.mathController;

        const offset = this.util.getOffset(mathTag, this.context.element.wysiwygFrame);
        mathBtn.style.top = (offset.top + mathTag.offsetHeight + 10) + 'px';
        mathBtn.style.left = (offset.left - this.context.element.wysiwygFrame.scrollLeft) + 'px';

        mathBtn.style.display = 'block';

        const overLeft = this.context.element.wysiwygFrame.offsetWidth - (mathBtn.offsetLeft + mathBtn.offsetWidth);
        if (overLeft < 0) {
            mathBtn.style.left = (mathBtn.offsetLeft + overLeft) + 'px';
            mathBtn.firstElementChild.style.left = (20 - overLeft) + 'px';
        } else {
            mathBtn.firstElementChild.style.left = '20px';
        }

        this.controllersOn(mathBtn, mathTag, 'math');
    },

    onClick_mathController: function (e) {
        e.stopPropagation();

        const command = e.target.getAttribute('data-command') || e.target.parentNode.getAttribute('data-command');
        if (!command) return;

        e.preventDefault();

        if (/update/.test(command)) {
            this.context.math.focusElement.value = this.context.math._mathExp.getAttribute('data-exp');
            this.plugins.dialog.open.call(this, 'math', true);
        } else {
            /** delete */
            this.util.removeItem(this.context.math._mathExp);
            this.context.math._mathExp = null;
            this.focus();

            // history stack
            this.history.push(false);
        }

        this.controllersOff();
    },

    init: function () {
        const contextMath = this.context.math;
        contextMath.mathController.style.display = 'none';
        contextMath._mathExp = null;
        contextMath.focusElement.value = '';
        contextMath.previewElement.innerHTML = '';
    }
};
