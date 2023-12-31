/*!
 * @file jsoneditor.js
 *
 * @brief
 * JSONEditor is a web-based tool to view, edit, and format JSON.
 * It shows data a clear, editable treeview.
 *
 * Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 8+
 *
 * @license
 * This json editor is open sourced with the intention to use the editor as
 * a component in your own application. Not to just copy and monetize the editor
 * as it is.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2011-2013 Jos de Jong, http://www.jsoneditoronline.cn
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2013-02-21
 */
(function() {
    var c = c || {};
    c.JSONEditor = function(e, f, g) {
        if (!(this instanceof c.JSONEditor)) {
            throw new Error('JSONEditor constructor called without "new".')
        }
        if (typeof (JSON) == "undefined") {
            throw new Error("Your browser does not support JSON. \n\nPlease install the newest version of your browser.\n(all modern browsers support JSON).")
        }
        if (!e) {
            throw new Error("No container element provided.")
        }
        this.container = e;
        this.dom = {};
        this.highlighter = new c.Highlighter();
        this.selection = undefined;
        this._setOptions(f);
        if (this.options.history && !this.mode.viewer) {
            this.history = new c.History(this)
        }
        this._createFrame();
        this._createTable();
        this.set(g || {})
    }
    ;
    c.JSONEditor.prototype._setOptions = function(e) {
        this.options = {
            search: true,
            history: true,
            mode: "editor",
            name: undefined
        };
        if (e) {
            for (var f in e) {
                if (e.hasOwnProperty(f)) {
                    this.options[f] = e[f]
                }
            }
            if (e.enableSearch) {
                this.options.search = e.enableSearch;
                console.log('WARNING: Option "enableSearch" is deprecated. Use "search" instead.')
            }
            if (e.enableHistory) {
                this.options.history = e.enableHistory;
                console.log('WARNING: Option "enableHistory" is deprecated. Use "history" instead.')
            }
        }
        this.mode = {
            editor: (this.options.mode != "viewer" && this.options.mode != "form"),
            viewer: (this.options.mode == "viewer"),
            form: (this.options.mode == "form")
        }
    }
    ;
    c.JSONEditor.focusNode = undefined;
    c.JSONEditor.prototype.set = function(f, e) {
        if (e) {
            this.options.name = e
        }
        if (f instanceof Function || (f === undefined)) {
            this.clear()
        } else {
            this.content.removeChild(this.table);
            var i = {
                field: this.options.name,
                value: f
            };
            var h = new c.Node(this,i);
            this._setRoot(h);
            var g = false;
            this.node.expand(g);
            this.content.appendChild(this.table)
        }
        if (this.history) {
            this.history.clear()
        }
    }
    ;
    c.JSONEditor.prototype.get = function() {
        if (c.JSONEditor.focusNode) {
            c.JSONEditor.focusNode.blur()
        }
        if (this.node) {
            return this.node.getValue()
        } else {
            return undefined
        }
    }
    ;
    c.JSONEditor.prototype.setName = function(e) {
        this.options.name = e;
        if (this.node) {
            this.node.updateField(this.options.name)
        }
    }
    ;
    c.JSONEditor.prototype.getName = function() {
        return this.options.name
    }
    ;
    c.JSONEditor.prototype.clear = function() {
        if (this.node) {
            this.node.collapse();
            this.tbody.removeChild(this.node.getDom());
            delete this.node
        }
    }
    ;
    c.JSONEditor.prototype._setRoot = function(e) {
        this.clear();
        this.node = e;
        this.tbody.appendChild(e.getDom())
    }
    ;
    c.JSONEditor.prototype.search = function(f) {
        var e;
        if (this.node) {
            this.content.removeChild(this.table);
            e = this.node.search(f);
            this.content.appendChild(this.table)
        } else {
            e = []
        }
        return e
    }
    ;
    c.JSONEditor.prototype.expandAll = function() {
        if (this.node) {
            this.content.removeChild(this.table);
            this.node.expand();
            this.content.appendChild(this.table)
        }
    }
    ;
    c.JSONEditor.prototype.collapseAll = function() {
        if (this.node) {
            this.content.removeChild(this.table);
            this.node.collapse();
            this.content.appendChild(this.table)
        }
    }
    ;
    c.JSONEditor.prototype._onAction = function(f, g) {
        if (this.history) {
            this.history.add(f, g)
        }
        if (this.options.change) {
            try {
                this.options.change()
            } catch (e) {
                console.log("Error in change callback: ", e)
            }
        }
    }
    ;
    c.JSONEditor.prototype.startAutoScroll = function(h) {
        var j = this;
        var i = this.content;
        var l = c.util.getAbsoluteTop(i);
        var e = i.clientHeight;
        var g = l + e;
        var k = 24;
        var f = 50;
        if ((h < l + k) && i.scrollTop > 0) {
            this.autoScrollStep = ((l + k) - h) / 3
        } else {
            if (h > g - k && e + i.scrollTop < i.scrollHeight) {
                this.autoScrollStep = ((g - k) - h) / 3
            } else {
                this.autoScrollStep = undefined
            }
        }
        if (this.autoScrollStep) {
            if (!this.autoScrollTimer) {
                this.autoScrollTimer = setInterval(function() {
                    if (j.autoScrollStep) {
                        i.scrollTop -= j.autoScrollStep
                    } else {
                        j.stopAutoScroll()
                    }
                }, f)
            }
        } else {
            this.stopAutoScroll()
        }
    }
    ;
    c.JSONEditor.prototype.stopAutoScroll = function() {
        if (this.autoScrollTimer) {
            clearTimeout(this.autoScrollTimer);
            delete this.autoScrollTimer
        }
        if (this.autoScrollStep) {
            delete this.autoScrollStep
        }
    }
    ;
    c.JSONEditor.prototype.setSelection = function(e) {
        if (!e) {
            return
        }
        if ("scrollTop"in e && this.content) {
            this.content.scrollTop = e.scrollTop
        }
        if (e.range) {
            c.util.setSelectionOffset(e.range)
        }
        if (e.dom) {
            e.dom.focus()
        }
    }
    ;
    c.JSONEditor.prototype.getSelection = function() {
        return {
            dom: c.JSONEditor.domFocus,
            scrollTop: this.content ? this.content.scrollTop : 0,
            range: c.util.getSelectionOffset()
        }
    }
    ;
    c.JSONEditor.prototype.scrollTo = function(k, l) {
        var j = this.content;
        if (j) {
            var i = this;
            if (i.animateTimeout) {
                clearTimeout(i.animateTimeout);
                delete i.animateTimeout
            }
            if (i.animateCallback) {
                i.animateCallback(false);
                delete i.animateCallback
            }
            var e = j.clientHeight;
            var h = j.scrollHeight - e;
            var f = Math.min(Math.max(k - e / 4, 0), h);
            var g = function() {
                var n = j.scrollTop;
                var m = (f - n);
                if (Math.abs(m) > 3) {
                    j.scrollTop += m / 3;
                    i.animateCallback = l;
                    i.animateTimeout = setTimeout(g, 50)
                } else {
                    if (l) {
                        l(true)
                    }
                    j.scrollTop = f;
                    delete i.animateTimeout;
                    delete i.animateCallback
                }
            };
            g()
        } else {
            if (l) {
                l(false)
            }
        }
    }
    ;
    c.JSONEditor.prototype._createFrame = function() {
        this.container.innerHTML = "";
        this.frame = document.createElement("div");
        this.frame.className = "jsoneditor";
        this.container.appendChild(this.frame);
        var h = this;
        var k = function(l) {
            h._onEvent(l)
        };
        this.frame.onclick = function(l) {
            k(l);
            c.util.preventDefault(l)
        }
        ;
        this.frame.oninput = k;
        this.frame.onchange = k;
        this.frame.onkeydown = k;
        this.frame.onkeyup = k;
        this.frame.oncut = k;
        this.frame.onpaste = k;
        this.frame.onmousedown = k;
        this.frame.onmouseup = k;
        this.frame.onmouseover = k;
        this.frame.onmouseout = k;
        c.util.addEventListener(this.frame, "focus", k, true);
        c.util.addEventListener(this.frame, "blur", k, true);
        this.frame.onfocusin = k;
        this.frame.onfocusout = k;
        this.menu = document.createElement("div");
        this.menu.className = "menu";
        this.frame.appendChild(this.menu);
        var i = document.createElement("button");
        i.className = "expand-all";
        i.title = "Expand all fields";
        i.onclick = function() {
            h.expandAll()
        }
        ;
        this.menu.appendChild(i);
        var e = document.createElement("button");
        e.title = "Collapse all fields";
        e.className = "collapse-all";
        e.onclick = function() {
            h.collapseAll()
        }
        ;
        this.menu.appendChild(e);
        if (this.history) {
            var j = document.createElement("span");
            j.innerHTML = "&nbsp;";
            this.menu.appendChild(j);
            var f = document.createElement("button");
            f.className = "undo";
            f.title = "Undo last action (Ctrl+Z)";
            f.onclick = function() {
                h._onUndo()
            }
            ;
            this.menu.appendChild(f);
            this.dom.undo = f;
            var g = document.createElement("button");
            g.className = "redo";
            g.title = "Redo (Ctrl+Shift+Z)";
            g.onclick = function() {
                h._onRedo()
            }
            ;
            this.menu.appendChild(g);
            this.dom.redo = g;
            this.history.onChange = function() {
                f.disabled = !h.history.canUndo();
                g.disabled = !h.history.canRedo()
            }
            ;
            this.history.onChange()
        }
        if (this.options.search) {
            this.searchBox = new c.SearchBox(this,this.menu)
        }
    }
    ;
    c.JSONEditor.prototype._onUndo = function() {
        if (this.history) {
            this.history.undo();
            if (this.options.change) {
                this.options.change()
            }
        }
    }
    ;
    c.JSONEditor.prototype._onRedo = function() {
        if (this.history) {
            this.history.redo();
            if (this.options.change) {
                this.options.change()
            }
        }
    }
    ;
    c.JSONEditor.prototype._onEvent = function(f) {
        f = f || window.event;
        var g = f.target || f.srcElement;
        if (f.type == "keydown") {
            this._onKeyDown(f)
        }
        if (f.type == "focus") {
            c.JSONEditor.domFocus = g
        }
        var e = c.Node.getNodeFromTarget(g);
        if (e) {
            e.onEvent(f)
        }
    }
    ;
    c.JSONEditor.prototype._onKeyDown = function(g) {
        var j = g.which || g.keyCode;
        var i = g.ctrlKey;
        var f = g.shiftKey;
        var h = false;
        if (j == 9) {
            setTimeout(function() {
                c.util.selectContentEditable(c.JSONEditor.domFocus)
            }, 0)
        }
        if (this.searchBox) {
            if (i && j == 70) {
                this.searchBox.dom.search.focus();
                this.searchBox.dom.search.select();
                h = true
            } else {
                if (j == 114 || (i && j == 71)) {
                    var e = true;
                    if (!f) {
                        this.searchBox.next(e)
                    } else {
                        this.searchBox.previous(e)
                    }
                    h = true
                }
            }
        }
        if (this.history) {
            if (i && !f && j == 90) {
                this._onUndo();
                h = true
            } else {
                if (i && f && j == 90) {
                    this._onRedo();
                    h = true
                }
            }
        }
        if (h) {
            c.util.preventDefault(g);
            c.util.stopPropagation(g)
        }
    }
    ;
    c.JSONEditor.prototype._createTable = function() {
        var e = document.createElement("div");
        e.className = "outer";
        this.contentOuter = e;
        this.content = document.createElement("div");
        this.content.className = "content";
        e.appendChild(this.content);
        this.table = document.createElement("table");
        this.table.className = "content";
        this.content.appendChild(this.table);
        var g = c.util.getInternetExplorerVersion();
        if (g == 8) {
            this.content.style.overflow = "scroll"
        }
        var f;
        this.colgroupContent = document.createElement("colgroup");
        f = document.createElement("col");
        f.width = "24px";
        this.colgroupContent.appendChild(f);
        f = document.createElement("col");
        f.width = "24px";
        this.colgroupContent.appendChild(f);
        f = document.createElement("col");
        this.colgroupContent.appendChild(f);
        this.table.appendChild(this.colgroupContent);
        this.tbody = document.createElement("tbody");
        this.table.appendChild(this.tbody);
        this.frame.appendChild(e)
    }
    ;
    var c = c || {};
    c.JSONFormatter = function(e, m, k) {
        if (!(this instanceof c.JSONFormatter)) {
            throw new Error('JSONFormatter constructor called without "new".')
        }
        if (typeof (JSON) == "undefined") {
            throw new Error("Your browser does not support JSON. \n\nPlease install the newest version of your browser.\n(all modern browsers support JSON).")
        }
        m = m || {};
        if (m.indentation) {
            this.indentation = Number(m.indentation)
        }
        this.mode = (m.mode == "code") ? "code" : "text";
        if (this.mode == "code") {
            if (typeof ace === "undefined") {
                this.mode = "text";
                console.log("WARNING: Cannot load code editor, Ace library not loaded. Falling back to plain text editor")
            }
            if (c.util.getInternetExplorerVersion() == 8) {
                this.mode = "text";
                console.log("WARNING: Cannot load code editor, Ace is not supported on IE8. Falling back to plain text editor")
            }
        }
        var h = this;
        this.container = e;
        this.editor = undefined;
        this.textarea = undefined;
        this.indentation = 4;
        this.width = e.clientWidth;
        this.height = e.clientHeight;
        this.frame = document.createElement("div");
        this.frame.className = "jsoneditor";
        this.frame.onclick = function(n) {
            c.util.preventDefault(n)
        }
        ;
        this.menu = document.createElement("div");
        this.menu.className = "menu";
        this.frame.appendChild(this.menu);
        var i = document.createElement("button");
        i.className = "format";
        i.title = "Format JSON data, with proper indentation and line feeds";
        this.menu.appendChild(i);
        i.onclick = function() {
            h.format()
        }
        ;
        var l = document.createElement("button");
        l.className = "compact";
        l.title = "Compact JSON data, remove all whitespaces";
        this.menu.appendChild(l);
        l.onclick = function() {
            h.compact()
        }
        ;
        this.content = document.createElement("div");
        this.content.className = "outer";
        this.frame.appendChild(this.content);
        this.container.appendChild(this.frame);
        if (this.mode == "code") {
            this.editorDom = document.createElement("div");
            this.editorDom.style.height = "100%";
            this.editorDom.style.width = "100%";
            this.content.appendChild(this.editorDom);
            var g = ace.edit(this.editorDom);
            g.setTheme("ace/theme/jso");
            g.setShowPrintMargin(false);
            g.setFontSize(13);
            g.getSession().setMode("ace/mode/json");
            g.getSession().setUseSoftTabs(true);
            g.getSession().setUseWrapMode(true);
            this.editor = g;
            var f = document.createElement("a");
            f.appendChild(document.createTextNode("powered by ace"));
            f.href = "http://ace.ajax.org";
            f.target = "_blank";
            f.className = "poweredBy";
            f.onclick = function() {
                window.open(f.href, f.target)
            }
            ;
            this.menu.appendChild(f);
            if (m.change) {
                g.on("change", function() {
                    m.change()
                })
            }
        } else {
            var j = document.createElement("textarea");
            j.className = "content";
            j.spellcheck = false;
            this.content.appendChild(j);
            this.textarea = j;
            if (m.change) {
                if (this.textarea.oninput === null) {
                    this.textarea.oninput = function() {
                        m.change()
                    }
                } else {
                    this.textarea.onchange = function() {
                        m.change()
                    }
                }
            }
        }
        if (typeof (k) == "string") {
            this.setText(k)
        } else {
            this.set(k)
        }
    }
    ;
    c.JSONFormatter.prototype.onError = function(e) {}
    ;
    c.JSONFormatter.prototype.compact = function() {
        try {
            var e = c.util.parse(this.getText());
            this.setText(JSON.stringify(e))
        } catch (f) {
            this.onError(f)
        }
    }
    ;
    c.JSONFormatter.prototype.format = function() {
        try {
            var e = c.util.parse(this.getText());
            this.setText(JSON.stringify(e, null, this.indentation))
        } catch (f) {
            this.onError(f)
        }
    }
    ;
    c.JSONFormatter.prototype.focus = function() {
        if (this.textarea) {
            this.textarea.focus()
        }
        if (this.editor) {
            this.editor.focus()
        }
    }
    ;
    c.JSONFormatter.prototype.resize = function() {
        if (this.editor) {
            var e = false;
            this.editor.resize(e)
        }
    }
    ;
    c.JSONFormatter.prototype.set = function(e) {
        this.setText(JSON.stringify(e, null, this.indentation))
    }
    ;
    c.JSONFormatter.prototype.get = function() {
        return c.util.parse(this.getText())
    }
    ;
    c.JSONFormatter.prototype.getText = function() {
        if (this.textarea) {
            return this.textarea.value
        }
        if (this.editor) {
            return this.editor.getValue()
        }
        return ""
    }
    ;
    c.JSONFormatter.prototype.setText = function(e) {
        if (this.textarea) {
            this.textarea.value = e
        }
        if (this.editor) {
            return this.editor.setValue(e, -1)
        }
    }
    ;
    var c = c || {};
    c.Node = function(e, f) {
        this.editor = e;
        this.dom = {};
        this.expanded = false;
        if (f && (f instanceof Object)) {
            this.setField(f.field, f.fieldEditable);
            this.setValue(f.value, f.type)
        } else {
            this.setField("");
            this.setValue(null)
        }
    }
    ;
    c.Node.prototype.setParent = function(e) {
        this.parent = e
    }
    ;
    c.Node.prototype.setField = function(f, e) {
        this.field = f;
        this.fieldEditable = (e == true)
    }
    ;
    c.Node.prototype.getField = function() {
        if (this.field === undefined) {
            this._getDomField()
        }
        return this.field
    }
    ;
    c.Node.prototype.setValue = function(l, j) {
        var f, m;
        var k = this.childs;
        if (k) {
            while (k.length) {
                this.removeChild(k[0])
            }
        }
        this.type = this._getType(l);
        if (j && j != this.type) {
            if (j == "string" && this.type == "auto") {
                this.type = j
            } else {
                throw new Error('Type mismatch: cannot cast value of type "' + this.type + ' to the specified type "' + j + '"')
            }
        }
        if (this.type == "array") {
            this.childs = [];
            for (var h = 0, e = l.length; h < e; h++) {
                f = l[h];
                if (f !== undefined && !(f instanceof Function)) {
                    m = new c.Node(this.editor,{
                        value: f
                    });
                    this.appendChild(m)
                }
            }
            this.value = ""
        } else {
            if (this.type == "object") {
                this.childs = [];
                for (var g in l) {
                    if (l.hasOwnProperty(g)) {
                        f = l[g];
                        if (f !== undefined && !(f instanceof Function)) {
                            m = new c.Node(this.editor,{
                                field: g,
                                value: f
                            });
                            this.appendChild(m)
                        }
                    }
                }
                this.value = ""
            } else {
                this.childs = undefined;
                this.value = l
            }
        }
    }
    ;
    c.Node.prototype.getValue = function() {
        if (this.type == "array") {
            var e = [];
            this.childs.forEach(function(g) {
                e.push(g.getValue())
            });
            return e
        } else {
            if (this.type == "object") {
                var f = {};
                this.childs.forEach(function(g) {
                    f[g.getField()] = g.getValue()
                });
                return f
            } else {
                if (this.value === undefined) {
                    this._getDomValue()
                }
                return this.value
            }
        }
    }
    ;
    c.Node.prototype.getLevel = function() {
        return (this.parent ? this.parent.getLevel() + 1 : 0)
    }
    ;
    c.Node.prototype.clone = function() {
        var f = new c.Node(this.editor);
        f.type = this.type;
        f.field = this.field;
        f.fieldInnerText = this.fieldInnerText;
        f.fieldEditable = this.fieldEditable;
        f.value = this.value;
        f.valueInnerText = this.valueInnerText;
        f.expanded = this.expanded;
        if (this.childs) {
            var e = [];
            this.childs.forEach(function(h) {
                var g = h.clone();
                g.setParent(f);
                e.push(g)
            });
            f.childs = e
        } else {
            f.childs = undefined
        }
        return f
    }
    ;
    c.Node.prototype.expand = function(e) {
        if (!this.childs) {
            return
        }
        this.expanded = true;
        if (this.dom.expand) {
            this.dom.expand.className = "expanded"
        }
        this.showChilds();
        if (e != false) {
            this.childs.forEach(function(f) {
                f.expand(e)
            })
        }
    }
    ;
    c.Node.prototype.collapse = function(e) {
        if (!this.childs) {
            return
        }
        this.hideChilds();
        if (e != false) {
            this.childs.forEach(function(f) {
                f.collapse(e)
            })
        }
        if (this.dom.expand) {
            this.dom.expand.className = "collapsed"
        }
        this.expanded = false
    }
    ;
    c.Node.prototype.showChilds = function() {
        var i = this.childs;
        if (!i) {
            return
        }
        if (!this.expanded) {
            return
        }
        var h = this.dom.tr;
        var g = h ? h.parentNode : undefined;
        if (g) {
            var e = this.getAppend();
            var f = h.nextSibling;
            if (f) {
                g.insertBefore(e, f)
            } else {
                g.appendChild(e)
            }
            this.childs.forEach(function(j) {
                g.insertBefore(j.getDom(), e);
                j.showChilds()
            })
        }
    }
    ;
    c.Node.prototype.hide = function() {
        var f = this.dom.tr;
        var e = f ? f.parentNode : undefined;
        if (e) {
            e.removeChild(f)
        }
        this.hideChilds()
    }
    ;
    c.Node.prototype.hideChilds = function() {
        var f = this.childs;
        if (!f) {
            return
        }
        if (!this.expanded) {
            return
        }
        var e = this.getAppend();
        if (e.parentNode) {
            e.parentNode.removeChild(e)
        }
        this.childs.forEach(function(g) {
            g.hide()
        })
    }
    ;
    c.Node.prototype.appendChild = function(h) {
        if (this._hasChilds()) {
            h.setParent(this);
            h.fieldEditable = (this.type == "object");
            if (this.type == "array") {
                h.index = this.childs.length
            }
            this.childs.push(h);
            if (this.expanded) {
                var f = h.getDom();
                var e = this.getAppend();
                var g = e ? e.parentNode : undefined;
                if (e && g) {
                    g.insertBefore(f, e)
                }
                h.showChilds()
            }
            this.updateDom({
                updateIndexes: true
            });
            h.updateDom({
                recurse: true
            })
        }
    }
    ;
    c.Node.prototype.moveBefore = function(g, f) {
        if (this._hasChilds()) {
            var e = (this.dom.tr) ? this.dom.tr.parentNode : undefined;
            if (e) {
                var h = document.createElement("tr");
                h.style.height = e.clientHeight + "px";
                e.appendChild(h)
            }
            if (g.parent) {
                g.parent.removeChild(g)
            }
            if (f instanceof c.AppendNode) {
                this.appendChild(g)
            } else {
                this.insertBefore(g, f)
            }
            if (e) {
                e.removeChild(h)
            }
        }
    }
    ;
    c.Node.prototype.moveTo = function(h, g) {
        if (h.parent == this) {
            var e = this.childs.indexOf(h);
            if (e < g) {
                g++
            }
        }
        var f = this.childs[g] || this.append;
        this.moveBefore(h, f)
    }
    ;
    c.Node.prototype.insertBefore = function(j, h) {
        if (this._hasChilds()) {
            if (h == this.append) {
                j.setParent(this);
                j.fieldEditable = (this.type == "object");
                this.childs.push(j)
            } else {
                var g = this.childs.indexOf(h);
                if (g == -1) {
                    throw new Error("Node not found")
                }
                j.setParent(this);
                j.fieldEditable = (this.type == "object");
                this.childs.splice(g, 0, j)
            }
            if (this.expanded) {
                var e = j.getDom();
                var f = h.getDom();
                var i = f ? f.parentNode : undefined;
                if (f && i) {
                    i.insertBefore(e, f)
                }
                j.showChilds()
            }
            this.updateDom({
                updateIndexes: true
            });
            j.updateDom({
                recurse: true
            })
        }
    }
    ;
    c.Node.prototype.insertAfter = function(g, h) {
        if (this._hasChilds()) {
            var f = this.childs.indexOf(h);
            var e = this.childs[f + 1];
            if (e) {
                this.insertBefore(g, e)
            } else {
                this.appendChild(g)
            }
        }
    }
    ;
    c.Node.prototype.search = function(l) {
        var h = [];
        var f;
        var g = l ? l.toLowerCase() : undefined;
        delete this.searchField;
        delete this.searchValue;
        if (this.field != undefined) {
            var k = String(this.field).toLowerCase();
            f = k.indexOf(g);
            if (f != -1) {
                this.searchField = true;
                h.push({
                    node: this,
                    elem: "field"
                })
            }
            this._updateDomField()
        }
        if (this._hasChilds()) {
            if (this.childs) {
                var e = [];
                this.childs.forEach(function(m) {
                    e = e.concat(m.search(l))
                });
                h = h.concat(e)
            }
            if (g != undefined) {
                var i = false;
                if (e.length == 0) {
                    this.collapse(i)
                } else {
                    this.expand(i)
                }
            }
        } else {
            if (this.value != undefined) {
                var j = String(this.value).toLowerCase();
                f = j.indexOf(g);
                if (f != -1) {
                    this.searchValue = true;
                    h.push({
                        node: this,
                        elem: "value"
                    })
                }
            }
            this._updateDomValue()
        }
        return h
    }
    ;
    c.Node.prototype.scrollTo = function(g) {
        if (!this.dom.tr || !this.dom.tr.parentNode) {
            var e = this.parent;
            var f = false;
            while (e) {
                e.expand(f);
                e = e.parent
            }
        }
        if (this.dom.tr && this.dom.tr.parentNode) {
            this.editor.scrollTo(this.dom.tr.offsetTop, g)
        }
    }
    ;
    c.Node.focusElement = undefined;
    c.Node.prototype.focus = function(e) {
        c.Node.focusElement = e;
        if (this.dom.tr && this.dom.tr.parentNode) {
            var f = this.dom;
            switch (e) {
            case "drag":
                if (f.drag) {
                    f.drag.focus()
                } else {
                    f.menu.focus()
                }
                break;
            case "menu":
                f.menu.focus();
                break;
            case "expand":
                if (this._hasChilds()) {
                    f.expand.focus()
                } else {
                    if (f.field && this.fieldEditable) {
                        f.field.focus();
                        c.util.selectContentEditable(f.field)
                    } else {
                        if (f.value && !this._hasChilds()) {
                            f.value.focus();
                            c.util.selectContentEditable(f.value)
                        } else {
                            f.menu.focus()
                        }
                    }
                }
                break;
            case "field":
                if (f.field && this.fieldEditable) {
                    f.field.focus();
                    c.util.selectContentEditable(f.field)
                } else {
                    if (f.value && !this._hasChilds()) {
                        f.value.focus();
                        c.util.selectContentEditable(f.value)
                    } else {
                        if (this._hasChilds()) {
                            f.expand.focus()
                        } else {
                            f.menu.focus()
                        }
                    }
                }
                break;
            case "value":
            default:
                if (f.value && !this._hasChilds()) {
                    f.value.focus();
                    c.util.selectContentEditable(f.value)
                } else {
                    if (f.field && this.fieldEditable) {
                        f.field.focus();
                        c.util.selectContentEditable(f.field)
                    } else {
                        if (this._hasChilds()) {
                            f.expand.focus()
                        } else {
                            f.menu.focus()
                        }
                    }
                }
                break
            }
        }
    }
    ;
    c.Node.select = function(e) {
        setTimeout(function() {
            c.util.selectContentEditable(e)
        }, 0)
    }
    ;
    c.Node.prototype.blur = function() {
        this._getDomValue(false);
        this._getDomField(false)
    }
    ;
    c.Node.prototype._duplicate = function(e) {
        var f = e.clone();
        this.insertAfter(f, e);
        return f
    }
    ;
    c.Node.prototype.containsNode = function(g) {
        if (this == g) {
            return true
        }
        var h = this.childs;
        if (h) {
            for (var f = 0, e = h.length; f < e; f++) {
                if (h[f].containsNode(g)) {
                    return true
                }
            }
        }
        return false
    }
    ;
    c.Node.prototype._move = function(f, e) {
        if (f == e) {
            return
        }
        if (f.containsNode(this)) {
            throw new Error("Cannot move a field into a child of itself")
        }
        if (f.parent) {
            f.parent.removeChild(f)
        }
        var g = f.clone();
        f.clearDom();
        if (e) {
            this.insertBefore(g, e)
        } else {
            this.appendChild(g)
        }
    }
    ;
    c.Node.prototype.removeChild = function(g) {
        if (this.childs) {
            var e = this.childs.indexOf(g);
            if (e != -1) {
                g.hide();
                delete g.searchField;
                delete g.searchValue;
                var f = this.childs.splice(e, 1)[0];
                this.updateDom({
                    updateIndexes: true
                });
                return f
            }
        }
        return undefined
    }
    ;
    c.Node.prototype._remove = function(e) {
        this.removeChild(e)
    }
    ;
    c.Node.prototype.changeType = function(f) {
        var i = this.type;
        if (i == f) {
            return
        }
        if ((f == "string" || f == "auto") && (i == "string" || i == "auto")) {
            this.type = f
        } else {
            var h = this.dom.tr ? this.dom.tr.parentNode : undefined;
            var g;
            if (this.expanded) {
                g = this.getAppend()
            } else {
                g = this.getDom()
            }
            var e = (g && g.parentNode) ? g.nextSibling : undefined;
            this.hide();
            this.clearDom();
            this.type = f;
            if (f == "object") {
                if (!this.childs) {
                    this.childs = []
                }
                this.childs.forEach(function(k, j) {
                    k.clearDom();
                    delete k.index;
                    k.fieldEditable = true;
                    if (k.field == undefined) {
                        k.field = ""
                    }
                });
                if (i == "string" || i == "auto") {
                    this.expanded = true
                }
            } else {
                if (f == "array") {
                    if (!this.childs) {
                        this.childs = []
                    }
                    this.childs.forEach(function(k, j) {
                        k.clearDom();
                        k.fieldEditable = false;
                        k.index = j
                    });
                    if (i == "string" || i == "auto") {
                        this.expanded = true
                    }
                } else {
                    this.expanded = false
                }
            }
            if (h) {
                if (e) {
                    h.insertBefore(this.getDom(), e)
                } else {
                    h.appendChild(this.getDom())
                }
            }
            this.showChilds()
        }
        if (f == "auto" || f == "string") {
            if (f == "string") {
                this.value = String(this.value)
            } else {
                this.value = this._stringCast(String(this.value))
            }
            this.focus()
        }
        this.updateDom({
            updateIndexes: true
        })
    }
    ;
    c.Node.prototype._getDomValue = function(e) {
        if (this.dom.value && this.type != "array" && this.type != "object") {
            this.valueInnerText = c.util.getInnerText(this.dom.value)
        }
        if (this.valueInnerText != undefined) {
            try {
                var h;
                if (this.type == "string") {
                    h = this._unescapeHTML(this.valueInnerText)
                } else {
                    var i = this._unescapeHTML(this.valueInnerText);
                    h = this._stringCast(i)
                }
                if (h !== this.value) {
                    var f = this.value;
                    this.value = h;
                    this.editor._onAction("editValue", {
                        node: this,
                        oldValue: f,
                        newValue: h,
                        oldSelection: this.editor.selection,
                        newSelection: this.editor.getSelection()
                    })
                }
            } catch (g) {
                this.value = undefined;
                if (e != true) {
                    throw g
                }
            }
        }
    }
    ;
    c.Node.prototype._updateDomValue = function() {
        var h = this.dom.value;
        if (h) {
            var f = this.value;
            var g = (this.type == "auto") ? typeof (f) : this.type;
            var e = "";
            if (g == "string") {
                e = "green"
            } else {
                if (g == "number") {
                    e = "red"
                } else {
                    if (g == "boolean") {
                        e = "orange"
                    } else {
                        if (this._hasChilds()) {
                            e = ""
                        } else {
                            if (f === null) {
                                e = "blue"
                            } else {
                                e = "black"
                            }
                        }
                    }
                }
            }
            h.style.color = e;
            var i = (String(this.value) == "" && this.type != "array" && this.type != "object");
            if (i) {
                c.util.addClassName(h, "empty")
            } else {
                c.util.removeClassName(h, "empty")
            }
            if (this.searchValueActive) {
                c.util.addClassName(h, "highlight-active")
            } else {
                c.util.removeClassName(h, "highlight-active")
            }
            if (this.searchValue) {
                c.util.addClassName(h, "highlight")
            } else {
                c.util.removeClassName(h, "highlight")
            }
            c.util.stripFormatting(h)
        }
    }
    ;
    c.Node.prototype._updateDomField = function() {
        var e = this.dom.field;
        if (e) {
            var f = (String(this.field) == "" && this.parent.type != "array");
            if (f) {
                c.util.addClassName(e, "empty")
            } else {
                c.util.removeClassName(e, "empty")
            }
            if (this.searchFieldActive) {
                c.util.addClassName(e, "highlight-active")
            } else {
                c.util.removeClassName(e, "highlight-active")
            }
            if (this.searchField) {
                c.util.addClassName(e, "highlight")
            } else {
                c.util.removeClassName(e, "highlight")
            }
            c.util.stripFormatting(e)
        }
    }
    ;
    c.Node.prototype._getDomField = function(e) {
        if (this.dom.field && this.fieldEditable) {
            this.fieldInnerText = c.util.getInnerText(this.dom.field)
        }
        if (this.fieldInnerText != undefined) {
            try {
                var h = this._unescapeHTML(this.fieldInnerText);
                if (h !== this.field) {
                    var f = this.field;
                    this.field = h;
                    this.editor._onAction("editField", {
                        node: this,
                        oldValue: f,
                        newValue: h,
                        oldSelection: this.editor.selection,
                        newSelection: this.editor.getSelection()
                    })
                }
            } catch (g) {
                this.field = undefined;
                if (e != true) {
                    throw g
                }
            }
        }
    }
    ;
    c.Node.prototype.clearDom = function() {
        this.dom = {}
    }
    ;
    c.Node.prototype.getDom = function() {
        var j = this.dom;
        if (j.tr) {
            return j.tr
        }
        j.tr = document.createElement("tr");
        j.tr.node = this;
        if (this.editor.mode.editor) {
            var g = document.createElement("td");
            if (this.parent) {
                var f = document.createElement("button");
                j.drag = f;
                f.className = "dragarea";
                f.title = "Drag to move this field (Alt+Shift+Arrows)";
                g.appendChild(f)
            }
            j.tr.appendChild(g);
            var h = document.createElement("td");
            var i = document.createElement("button");
            j.menu = i;
            i.className = "contextmenu";
            i.title = "Click to open the actions menu (Ctrl+M)";
            h.appendChild(j.menu);
            j.tr.appendChild(h)
        }
        var e = document.createElement("td");
        j.tr.appendChild(e);
        j.tree = this._createDomTree();
        e.appendChild(j.tree);
        this.updateDom({
            updateIndexes: true
        });
        return j.tr
    }
    ;
    c.Node.prototype._onDragStart = function(f) {
        f = f || window.event;
        var e = this;
        if (!this.mousemove) {
            this.mousemove = c.util.addEventListener(document, "mousemove", function(g) {
                e._onDrag(g)
            })
        }
        if (!this.mouseup) {
            this.mouseup = c.util.addEventListener(document, "mouseup", function(g) {
                e._onDragEnd(g)
            })
        }
        this.editor.highlighter.lock();
        this.drag = {
            oldCursor: document.body.style.cursor,
            startParent: this.parent,
            startIndex: this.parent.childs.indexOf(this),
            mouseX: c.util.getMouseX(f),
            level: this.getLevel()
        };
        document.body.style.cursor = "move";
        c.util.preventDefault(f)
    }
    ;
    c.Node.prototype._onDrag = function(z) {
        z = z || window.event;
        var o = c.util.getMouseY(z);
        var p = c.util.getMouseX(z);
        var A, q, r, i, m, s;
        var w, x;
        var t, h, g, f, k, u;
        var n = false;
        A = this.dom.tr;
        t = c.util.getAbsoluteTop(A);
        f = A.offsetHeight;
        if (o < t) {
            q = A;
            do {
                q = q.previousSibling;
                w = c.Node.getNodeFromTarget(q);
                h = q ? c.util.getAbsoluteTop(q) : 0
            } while (q && o < h);
            if (w && !w.parent) {
                w = undefined
            }
            if (!w) {
                s = A.parentNode.firstChild;
                q = s ? s.nextSibling : undefined;
                w = c.Node.getNodeFromTarget(q);
                if (w == this) {
                    w = undefined
                }
            }
            if (w) {
                q = w.dom.tr;
                h = q ? c.util.getAbsoluteTop(q) : 0;
                if (o > h + f) {
                    w = undefined
                }
            }
            if (w) {
                w.parent.moveBefore(this, w);
                n = true
            }
        } else {
            m = (this.expanded && this.append) ? this.append.getDom() : this.dom.tr;
            i = m ? m.nextSibling : undefined;
            if (i) {
                g = c.util.getAbsoluteTop(i);
                r = i;
                do {
                    x = c.Node.getNodeFromTarget(r);
                    if (r) {
                        k = r.nextSibling ? c.util.getAbsoluteTop(r.nextSibling) : 0;
                        u = r ? (k - g) : 0;
                        if (x.parent.childs.length == 1 && x.parent.childs[0] == this) {
                            t += 24 - 1
                        }
                    }
                    r = r.nextSibling
                } while (r && o > t + u);
                if (x && x.parent) {
                    var v = (p - this.drag.mouseX);
                    var y = Math.round(v / 24 / 2);
                    var e = this.drag.level + y;
                    var j = x.getLevel();
                    q = x.dom.tr.previousSibling;
                    while (j < e && q) {
                        w = c.Node.getNodeFromTarget(q);
                        if (w == this || w._isChildOf(this)) {} else {
                            if (w instanceof c.AppendNode) {
                                var l = w.parent.childs;
                                if (l.length > 1 || (l.length == 1 && l[0] != this)) {
                                    x = c.Node.getNodeFromTarget(q);
                                    j = x.getLevel()
                                } else {
                                    break
                                }
                            } else {
                                break
                            }
                        }
                        q = q.previousSibling
                    }
                    if (m.nextSibling != x.dom.tr) {
                        x.parent.moveBefore(this, x);
                        n = true
                    }
                }
            }
        }
        if (n) {
            this.drag.mouseX = p;
            this.drag.level = this.getLevel()
        }
        this.editor.startAutoScroll(o);
        c.util.preventDefault(z)
    }
    ;
    c.Node.prototype._onDragEnd = function(e) {
        e = e || window.event;
        var f = {
            node: this,
            startParent: this.drag.startParent,
            startIndex: this.drag.startIndex,
            endParent: this.parent,
            endIndex: this.parent.childs.indexOf(this)
        };
        if ((f.startParent != f.endParent) || (f.startIndex != f.endIndex)) {
            this.editor._onAction("moveNode", f)
        }
        document.body.style.cursor = this.drag.oldCursor;
        this.editor.highlighter.unlock();
        delete this.drag;
        if (this.mousemove) {
            c.util.removeEventListener(document, "mousemove", this.mousemove);
            delete this.mousemove
        }
        if (this.mouseup) {
            c.util.removeEventListener(document, "mouseup", this.mouseup);
            delete this.mouseup
        }
        this.editor.stopAutoScroll();
        c.util.preventDefault(e)
    }
    ;
    c.Node.prototype._isChildOf = function(e) {
        var f = this.parent;
        while (f) {
            if (f == e) {
                return true
            }
            f = f.parent
        }
        return false
    }
    ;
    c.Node.prototype._createDomField = function() {
        return document.createElement("div")
    }
    ;
    c.Node.prototype.setHighlight = function(e) {
        if (this.dom.tr) {
            this.dom.tr.className = (e ? "highlight" : "");
            if (this.append) {
                this.append.setHighlight(e)
            }
            if (this.childs) {
                this.childs.forEach(function(f) {
                    f.setHighlight(e)
                })
            }
        }
    }
    ;
    c.Node.prototype.updateValue = function(e) {
        this.value = e;
        this.updateDom()
    }
    ;
    c.Node.prototype.updateField = function(e) {
        this.field = e;
        this.updateDom()
    }
    ;
    c.Node.prototype.updateDom = function(e) {
        var j = this.dom.tree;
        if (j) {
            j.style.marginLeft = this.getLevel() * 24 + "px"
        }
        var h = this.dom.field;
        if (h) {
            if (this.fieldEditable == true) {
                h.contentEditable = this.editor.mode.editor;
                h.spellcheck = false;
                h.className = "field"
            } else {
                h.className = "readonly"
            }
            var i;
            if (this.index != undefined) {
                i = this.index
            } else {
                if (this.field != undefined) {
                    i = this.field
                } else {
                    if (this._hasChilds()) {
                        i = this.type
                    } else {
                        i = ""
                    }
                }
            }
            h.innerHTML = this._escapeHTML(i)
        }
        var g = this.dom.value;
        if (g) {
            var f = this.childs ? this.childs.length : 0;
            if (this.type == "array") {
                g.innerHTML = "[" + f + "]";
                g.title = this.type + " containing " + f + " items"
            } else {
                if (this.type == "object") {
                    g.innerHTML = "{" + f + "}";
                    g.title = this.type + " containing " + f + " items"
                } else {
                    g.innerHTML = this._escapeHTML(this.value);
                    delete g.title
                }
            }
        }
        this._updateDomField();
        this._updateDomValue();
        if (e && e.updateIndexes == true) {
            this._updateDomIndexes()
        }
        if (e && e.recurse == true) {
            if (this.childs) {
                this.childs.forEach(function(k) {
                    k.updateDom(e)
                })
            }
        }
        if (this.append) {
            this.append.updateDom()
        }
    }
    ;
    c.Node.prototype._updateDomIndexes = function() {
        var e = this.dom.value;
        var f = this.childs;
        if (e && f) {
            if (this.type == "array") {
                f.forEach(function(i, g) {
                    i.index = g;
                    var h = i.dom.field;
                    if (h) {
                        h.innerHTML = g
                    }
                })
            } else {
                if (this.type == "object") {
                    f.forEach(function(g) {
                        if (g.index != undefined) {
                            delete g.index;
                            if (g.field == undefined) {
                                g.field = ""
                            }
                        }
                    })
                }
            }
        }
    }
    ;
    c.Node.prototype._createDomValue = function() {
        var e;
        if (this.type == "array") {
            e = document.createElement("div");
            e.className = "readonly";
            e.innerHTML = "[...]"
        } else {
            if (this.type == "object") {
                e = document.createElement("div");
                e.className = "readonly";
                e.innerHTML = "{...}"
            } else {
                if (this.type == "string") {
                    e = document.createElement("div");
                    e.contentEditable = !this.editor.mode.viewer;
                    e.spellcheck = false;
                    e.className = "value";
                    e.innerHTML = this._escapeHTML(this.value)
                } else {
                    e = document.createElement("div");
                    e.contentEditable = !this.editor.mode.viewer;
                    e.spellcheck = false;
                    e.className = "value";
                    e.innerHTML = this._escapeHTML(this.value)
                }
            }
        }
        return e
    }
    ;
    c.Node.prototype._createDomExpandButton = function() {
        var e = document.createElement("button");
        if (this._hasChilds()) {
            e.className = this.expanded ? "expanded" : "collapsed";
            e.title = "Click to expand/collapse this field (Ctrl+E). \nCtrl+Click to expand/collapse including all childs."
        } else {
            e.className = "invisible";
            e.title = ""
        }
        return e
    }
    ;
    c.Node.prototype._createDomTree = function() {
        var k = this.dom;
        var l = document.createElement("table");
        var i = document.createElement("tbody");
        l.style.borderCollapse = "collapse";
        l.appendChild(i);
        var j = document.createElement("tr");
        i.appendChild(j);
        var e = document.createElement("td");
        e.className = "tree";
        j.appendChild(e);
        k.expand = this._createDomExpandButton();
        e.appendChild(k.expand);
        k.tdExpand = e;
        var g = document.createElement("td");
        g.className = "tree";
        j.appendChild(g);
        k.field = this._createDomField();
        g.appendChild(k.field);
        k.tdField = g;
        var h = document.createElement("td");
        h.className = "tree";
        j.appendChild(h);
        if (this.type != "object" && this.type != "array") {
            h.appendChild(document.createTextNode(":"));
            h.className = "separator"
        }
        k.tdSeparator = h;
        var f = document.createElement("td");
        f.className = "tree";
        j.appendChild(f);
        k.value = this._createDomValue();
        f.appendChild(k.value);
        k.tdValue = f;
        return l
    }
    ;
    c.Node.prototype.onEvent = function(g) {
        var p = g.type;
        var o = g.target || g.srcElement;
        var n = this.dom;
        var k = this;
        var h = this._hasChilds();
        if (o == n.drag || o == n.menu) {
            if (p == "mouseover") {
                this.editor.highlighter.highlight(this)
            } else {
                if (p == "mouseout") {
                    this.editor.highlighter.unhighlight()
                }
            }
        }
        if (p == "mousedown" && o == n.drag) {
            this._onDragStart(g)
        }
        if (p == "click" && o == n.menu) {
            var q = k.editor.highlighter;
            q.highlight(k);
            q.lock();
            c.util.addClassName(n.menu, "selected");
            this.showContextMenu(n.menu, function() {
                c.util.removeClassName(n.menu, "selected");
                q.unlock();
                q.unhighlight()
            })
        }
        var m = n.expand;
        if (p == "click" && o == n.expand) {
            if (h) {
                var f = g.ctrlKey;
                this._onExpand(f)
            }
        }
        var l = n.value;
        if (o == l) {
            switch (p) {
            case "focus":
                c.JSONEditor.focusNode = this;
                break;
            case "blur":
            case "change":
                this._getDomValue(true);
                this._updateDomValue();
                if (this.value) {
                    l.innerHTML = this._escapeHTML(this.value)
                }
                break;
            case "input":
                this._getDomValue(true);
                this._updateDomValue();
                break;
            case "keydown":
            case "mousedown":
                this.editor.selection = this.editor.getSelection();
                break;
            case "keyup":
                this._getDomValue(true);
                this._updateDomValue();
                break;
            case "cut":
            case "paste":
                setTimeout(function() {
                    k._getDomValue(true);
                    k._updateDomValue()
                }, 1);
                break
            }
        }
        var j = n.field;
        if (o == j) {
            switch (p) {
            case "focus":
                c.JSONEditor.focusNode = this;
                break;
            case "blur":
            case "change":
                this._getDomField(true);
                this._updateDomField();
                if (this.field) {
                    j.innerHTML = this._escapeHTML(this.field)
                }
                break;
            case "input":
                this._getDomField(true);
                this._updateDomField();
                break;
            case "keydown":
            case "mousedown":
                this.editor.selection = this.editor.getSelection();
                break;
            case "keyup":
                this._getDomField(true);
                this._updateDomField();
                break;
            case "cut":
            case "paste":
                setTimeout(function() {
                    k._getDomField(true);
                    k._updateDomField()
                }, 1);
                break
            }
        }
        var e = n.tree;
        if (o == e.parentNode) {
            switch (p) {
            case "click":
                var i = (g.offsetX != undefined) ? (g.offsetX < (this.getLevel() + 1) * 24) : (c.util.getMouseX(g) < c.util.getAbsoluteLeft(n.tdSeparator));
                if (i || h) {
                    if (j) {
                        c.util.setEndOfContentEditable(j);
                        j.focus()
                    }
                } else {
                    if (l) {
                        c.util.setEndOfContentEditable(l);
                        l.focus()
                    }
                }
                break
            }
        }
        if ((o == n.tdExpand && !h) || o == n.tdField || o == n.tdSeparator) {
            switch (p) {
            case "click":
                if (j) {
                    c.util.setEndOfContentEditable(j);
                    j.focus()
                }
                break
            }
        }
        if (p == "keydown") {
            this.onKeyDown(g)
        }
    }
    ;
    c.Node.prototype.onKeyDown = function(q) {
        var u = q.which || q.keyCode;
        var w = q.target || q.srcElement;
        var f = q.ctrlKey;
        var n = q.shiftKey;
        var e = q.altKey;
        var l = false;
        var o, h, i, v;
        if (u == 68) {
            if (f) {
                this._onDuplicate();
                l = true
            }
        } else {
            if (u == 69) {
                if (f) {
                    this._onExpand(n);
                    w.focus();
                    l = true
                }
            } else {
                if (u == 77) {
                    if (f) {
                        this.showContextMenu(w);
                        l = true
                    }
                } else {
                    if (u == 46) {
                        if (f) {
                            this._onRemove();
                            l = true
                        }
                    } else {
                        if (u == 45) {
                            if (f && !n) {
                                this._onInsertBefore();
                                l = true
                            } else {
                                if (f && n) {
                                    this._onInsertAfter();
                                    l = true
                                }
                            }
                        } else {
                            if (u == 35) {
                                if (e) {
                                    var k = this._lastNode();
                                    if (k) {
                                        k.focus(c.Node.focusElement || this._getElementName(w))
                                    }
                                    l = true
                                }
                            } else {
                                if (u == 36) {
                                    if (e) {
                                        var p = this._firstNode();
                                        if (p) {
                                            p.focus(c.Node.focusElement || this._getElementName(w))
                                        }
                                        l = true
                                    }
                                } else {
                                    if (u == 37) {
                                        if (e && !n) {
                                            var t = this._previousElement(w);
                                            if (t) {
                                                this.focus(this._getElementName(t))
                                            }
                                            l = true
                                        } else {
                                            if (e && n) {
                                                if (this.expanded) {
                                                    var m = this.getAppend();
                                                    i = m ? m.nextSibling : undefined
                                                } else {
                                                    var s = this.getDom();
                                                    i = s.nextSibling
                                                }
                                                if (i) {
                                                    h = c.Node.getNodeFromTarget(i);
                                                    v = i.nextSibling;
                                                    g = c.Node.getNodeFromTarget(v);
                                                    if (h && h instanceof c.AppendNode && !(this.parent.childs.length == 1) && g && g.parent) {
                                                        g.parent.moveBefore(this, g);
                                                        this.focus(c.Node.focusElement || this._getElementName(w))
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        if (u == 38) {
                                            if (e && !n) {
                                                o = this._previousNode();
                                                if (o) {
                                                    o.focus(c.Node.focusElement || this._getElementName(w))
                                                }
                                                l = true
                                            } else {
                                                if (e && n) {
                                                    o = this._previousNode();
                                                    if (o && o.parent) {
                                                        o.parent.moveBefore(this, o);
                                                        this.focus(c.Node.focusElement || this._getElementName(w))
                                                    }
                                                    l = true
                                                }
                                            }
                                        } else {
                                            if (u == 39) {
                                                if (e && !n) {
                                                    var j = this._nextElement(w);
                                                    if (j) {
                                                        this.focus(this._getElementName(j))
                                                    }
                                                    l = true
                                                } else {
                                                    if (e && n) {
                                                        s = this.getDom();
                                                        var r = s.previousSibling;
                                                        if (r) {
                                                            o = c.Node.getNodeFromTarget(r);
                                                            if (o && o.parent && (o instanceof c.AppendNode) && !o.isVisible()) {
                                                                o.parent.moveBefore(this, o);
                                                                this.focus(c.Node.focusElement || this._getElementName(w))
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (u == 40) {
                                                    if (e && !n) {
                                                        h = this._nextNode();
                                                        if (h) {
                                                            h.focus(c.Node.focusElement || this._getElementName(w))
                                                        }
                                                        l = true
                                                    } else {
                                                        if (e && n) {
                                                            if (this.expanded) {
                                                                h = this.append ? this.append._nextNode() : undefined
                                                            } else {
                                                                h = this._nextNode()
                                                            }
                                                            i = h ? h.getDom() : undefined;
                                                            if (this.parent.childs.length == 1) {
                                                                v = i
                                                            } else {
                                                                v = i ? i.nextSibling : undefined
                                                            }
                                                            var g = c.Node.getNodeFromTarget(v);
                                                            if (g && g.parent) {
                                                                g.parent.moveBefore(this, g);
                                                                this.focus(c.Node.focusElement || this._getElementName(w))
                                                            }
                                                            l = true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (l) {
            c.util.preventDefault(q);
            c.util.stopPropagation(q)
        }
    }
    ;
    c.Node.prototype._onExpand = function(f) {
        if (f) {
            var e = this.dom.tr.parentNode;
            var h = e.parentNode;
            var g = h.scrollTop;
            h.removeChild(e)
        }
        if (this.expanded) {
            this.collapse(f)
        } else {
            this.expand(f)
        }
        if (f) {
            h.appendChild(e);
            h.scrollTop = g
        }
    }
    ;
    c.Node.prototype._onRemove = function() {
        this.editor.highlighter.unhighlight();
        var h = this.parent.childs;
        var g = h.indexOf(this);
        var f = this.editor.getSelection();
        if (h[g + 1]) {
            h[g + 1].focus()
        } else {
            if (h[g - 1]) {
                h[g - 1].focus()
            } else {
                this.parent.focus()
            }
        }
        var e = this.editor.getSelection();
        this.parent._remove(this);
        this.editor._onAction("removeNode", {
            node: this,
            parent: this.parent,
            index: g,
            oldSelection: f,
            newSelection: e
        })
    }
    ;
    c.Node.prototype._onDuplicate = function() {
        var f = this.editor.getSelection();
        var g = this.parent._duplicate(this);
        g.focus();
        var e = this.editor.getSelection();
        this.editor._onAction("duplicateNode", {
            node: this,
            clone: g,
            parent: this.parent,
            oldSelection: f,
            newSelection: e
        })
    }
    ;
    c.Node.prototype._onInsertBefore = function(j, i, h) {
        var f = this.editor.getSelection();
        var g = new c.Node(this.editor,{
            field: (j != undefined) ? j : "",
            value: (i != undefined) ? i : "",
            type: h
        });
        g.expand(true);
        this.parent.insertBefore(g, this);
        this.editor.highlighter.unhighlight();
        g.focus("field");
        var e = this.editor.getSelection();
        this.editor._onAction("insertBeforeNode", {
            node: g,
            beforeNode: this,
            parent: this.parent,
            oldSelection: f,
            newSelection: e
        })
    }
    ;
    c.Node.prototype._onInsertAfter = function(j, i, h) {
        var f = this.editor.getSelection();
        var g = new c.Node(this.editor,{
            field: (j != undefined) ? j : "",
            value: (i != undefined) ? i : "",
            type: h
        });
        g.expand(true);
        this.parent.insertAfter(g, this);
        this.editor.highlighter.unhighlight();
        g.focus("field");
        var e = this.editor.getSelection();
        this.editor._onAction("insertAfterNode", {
            node: g,
            afterNode: this,
            parent: this.parent,
            oldSelection: f,
            newSelection: e
        })
    }
    ;
    c.Node.prototype._onAppend = function(j, i, h) {
        var f = this.editor.getSelection();
        var g = new c.Node(this.editor,{
            field: (j != undefined) ? j : "",
            value: (i != undefined) ? i : "",
            type: h
        });
        g.expand(true);
        this.parent.appendChild(g);
        this.editor.highlighter.unhighlight();
        g.focus("field");
        var e = this.editor.getSelection();
        this.editor._onAction("appendNode", {
            node: g,
            parent: this.parent,
            oldSelection: f,
            newSelection: e
        })
    }
    ;
    c.Node.prototype._onChangeType = function(g) {
        var h = this.type;
        if (g != h) {
            var f = this.editor.getSelection();
            this.changeType(g);
            var e = this.editor.getSelection();
            this.editor._onAction("changeType", {
                node: this,
                oldType: h,
                newType: g,
                oldSelection: f,
                newSelection: e
            })
        }
    }
    ;
    c.Node.prototype._onSort = function(h) {
        if (this._hasChilds()) {
            var e = (h == "desc") ? -1 : 1;
            var i = (this.type == "array") ? "value" : "field";
            this.hideChilds();
            var g = this.childs;
            var f = this.sort;
            this.childs = this.childs.concat();
            this.childs.sort(function(k, j) {
                if (k[i] > j[i]) {
                    return e
                }
                if (k[i] < j[i]) {
                    return -e
                }
                return 0
            });
            this.sort = (e == 1) ? "asc" : "desc";
            this.editor._onAction("sort", {
                node: this,
                oldChilds: g,
                oldSort: f,
                newChilds: this.childs,
                newSort: this.sort
            });
            this.showChilds()
        }
    }
    ;
    c.Node.prototype.getAppend = function() {
        if (!this.append) {
            this.append = new c.AppendNode(this.editor);
            this.append.setParent(this)
        }
        return this.append.getDom()
    }
    ;
    c.Node.getNodeFromTarget = function(e) {
        while (e) {
            if (e.node) {
                return e.node
            }
            e = e.parentNode
        }
        return undefined
    }
    ;
    c.Node.prototype._previousNode = function() {
        var e = null;
        var f = this.getDom();
        if (f && f.parentNode) {
            var g = f;
            do {
                g = g.previousSibling;
                e = c.Node.getNodeFromTarget(g)
            } while (g && (e instanceof c.AppendNode && !e.isVisible()))
        }
        return e
    }
    ;
    c.Node.prototype._nextNode = function() {
        var e = null;
        var g = this.getDom();
        if (g && g.parentNode) {
            var f = g;
            do {
                f = f.nextSibling;
                e = c.Node.getNodeFromTarget(f)
            } while (f && (e instanceof c.AppendNode && !e.isVisible()))
        }
        return e
    }
    ;
    c.Node.prototype._firstNode = function() {
        var e = null;
        var g = this.getDom();
        if (g && g.parentNode) {
            var f = g.parentNode.firstChild;
            e = c.Node.getNodeFromTarget(f)
        }
        return e
    }
    ;
    c.Node.prototype._lastNode = function() {
        var f = null;
        var g = this.getDom();
        if (g && g.parentNode) {
            var e = g.parentNode.lastChild;
            f = c.Node.getNodeFromTarget(e);
            while (e && (f instanceof c.AppendNode && !f.isVisible())) {
                e = e.previousSibling;
                f = c.Node.getNodeFromTarget(e)
            }
        }
        return f
    }
    ;
    c.Node.prototype._previousElement = function(e) {
        var f = this.dom;
        switch (e) {
        case f.value:
            if (this.fieldEditable) {
                return f.field
            }
        case f.field:
            if (this._hasChilds()) {
                return f.expand
            }
        case f.expand:
            return f.menu;
        case f.menu:
            if (f.drag) {
                return f.drag
            }
        default:
            return null
        }
    }
    ;
    c.Node.prototype._nextElement = function(e) {
        var f = this.dom;
        switch (e) {
        case f.drag:
            return f.menu;
        case f.menu:
            if (this._hasChilds()) {
                return f.expand
            }
        case f.expand:
            if (this.fieldEditable) {
                return f.field
            }
        case f.field:
            if (!this._hasChilds()) {
                return f.value
            }
        default:
            return null
        }
    }
    ;
    c.Node.prototype._getElementName = function(f) {
        var g = this.dom;
        for (var e in g) {
            if (g.hasOwnProperty(e)) {
                if (g[e] == f) {
                    return e
                }
            }
        }
        return null
    }
    ;
    c.Node.prototype._hasChilds = function() {
        return this.type == "array" || this.type == "object"
    }
    ;
    c.Node.TYPE_TITLES = {
        auto: 'Field type "auto". The field type is automatically determined from the value and can be a string, number, boolean, or null.',
        object: 'Field type "object". An object contains an unordered set of key/value pairs.',
        array: 'Field type "array". An array contains an ordered collection of values.',
        string: 'Field type "string". Field type is not determined from the value, but always returned as string.'
    };
    c.Node.prototype.showContextMenu = function(g, e) {
        var h = this;
        var l = c.Node.TYPE_TITLES;
        var f = [];
        f.push({
            text: "Type",
            title: "Change the type of this field",
            className: "type-" + this.type,
            submenu: [{
                text: "Auto",
                className: "type-auto" + (this.type == "auto" ? " selected" : ""),
                title: l.auto,
                click: function() {
                    h._onChangeType("auto")
                }
            }, {
                text: "Array",
                className: "type-array" + (this.type == "array" ? " selected" : ""),
                title: l.array,
                click: function() {
                    h._onChangeType("array")
                }
            }, {
                text: "Object",
                className: "type-object" + (this.type == "object" ? " selected" : ""),
                title: l.object,
                click: function() {
                    h._onChangeType("object")
                }
            }, {
                text: "String",
                className: "type-string" + (this.type == "string" ? " selected" : ""),
                title: l.string,
                click: function() {
                    h._onChangeType("string")
                }
            }]
        });
        if (this._hasChilds()) {
            var j = ((this.sort == "asc") ? "desc" : "asc");
            f.push({
                text: "Sort",
                title: "Sort the childs of this " + this.type,
                className: "sort-" + j,
                click: function() {
                    h._onSort(j)
                },
                submenu: [{
                    text: "Ascending",
                    className: "sort-asc",
                    title: "Sort the childs of this " + this.type + " in ascending order",
                    click: function() {
                        h._onSort("asc")
                    }
                }, {
                    text: "Descending",
                    className: "sort-desc",
                    title: "Sort the childs of this " + this.type + " in descending order",
                    click: function() {
                        h._onSort("desc")
                    }
                }]
            })
        }
        if (this.parent && this.parent._hasChilds()) {
            f.push({
                type: "separator"
            });
            var i = h.parent.childs;
            if (h == i[i.length - 1]) {
                f.push({
                    text: "Append",
                    title: "Append a new field with type 'auto' after this field (Ctrl+Shift+Ins)",
                    submenuTitle: "Select the type of the field to be appended",
                    className: "append",
                    click: function() {
                        h._onAppend("", "", "auto")
                    },
                    submenu: [{
                        text: "Auto",
                        className: "type-auto",
                        title: l.auto,
                        click: function() {
                            h._onAppend("", "", "auto")
                        }
                    }, {
                        text: "Array",
                        className: "type-array",
                        title: l.array,
                        click: function() {
                            h._onAppend("", [])
                        }
                    }, {
                        text: "Object",
                        className: "type-object",
                        title: l.object,
                        click: function() {
                            h._onAppend("", {})
                        }
                    }, {
                        text: "String",
                        className: "type-string",
                        title: l.string,
                        click: function() {
                            h._onAppend("", "", "string")
                        }
                    }]
                })
            }
            f.push({
                text: "Insert",
                title: "Insert a new field with type 'auto' before this field (Ctrl+Ins)",
                submenuTitle: "Select the type of the field to be inserted",
                className: "insert",
                click: function() {
                    h._onInsertBefore("", "", "auto")
                },
                submenu: [{
                    text: "Auto",
                    className: "type-auto",
                    title: l.auto,
                    click: function() {
                        h._onInsertBefore("", "", "auto")
                    }
                }, {
                    text: "Array",
                    className: "type-array",
                    title: l.array,
                    click: function() {
                        h._onInsertBefore("", [])
                    }
                }, {
                    text: "Object",
                    className: "type-object",
                    title: l.object,
                    click: function() {
                        h._onInsertBefore("", {})
                    }
                }, {
                    text: "String",
                    className: "type-string",
                    title: l.string,
                    click: function() {
                        h._onInsertBefore("", "", "string")
                    }
                }]
            });
            f.push({
                text: "Duplicate",
                title: "Duplicate this field (Ctrl+D)",
                className: "duplicate",
                click: function() {
                    h._onDuplicate()
                }
            });
            f.push({
                text: "Remove",
                title: "Remove this field (Ctrl+Del)",
                className: "remove",
                click: function() {
                    h._onRemove()
                }
            })
        }
        var k = new c.ContextMenu(f,{
            close: e
        });
        k.show(g)
    }
    ;
    c.Node.prototype._getType = function(e) {
        if (e instanceof Array) {
            return "array"
        }
        if (e instanceof Object) {
            return "object"
        }
        if (typeof (e) == "string" && typeof (this._stringCast(e)) != "string") {
            return "string"
        }
        return "auto"
    }
    ;
    c.Node.prototype._stringCast = function(h) {
        var g = h.toLowerCase()
          , f = Number(h)
          , e = parseFloat(h);
        if (h == "") {
            return ""
        } else {
            if (g == "null") {
                return null
            } else {
                if (g == "true") {
                    return true
                } else {
                    if (g == "false") {
                        return false
                    } else {
                        if (!isNaN(f) && !isNaN(e)) {
                            return f
                        } else {
                            return h
                        }
                    }
                }
            }
        }
    }
    ;
    c.Node.prototype._escapeHTML = function(g) {
        var e = String(g).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/  /g, " &nbsp;").replace(/^ /, "&nbsp;").replace(/ $/, "&nbsp;");
        var f = JSON.stringify(e);
        return f.substring(1, f.length - 1)
    }
    ;
    c.Node.prototype._unescapeHTML = function(g) {
        var f = '"' + this._escapeJSON(g) + '"';
        var e = c.util.parse(f);
        return e.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    }
    ;
    c.Node.prototype._escapeJSON = function(h) {
        var g = "";
        var f = 0
          , e = h.length;
        while (f < e) {
            var j = h.charAt(f);
            if (j == "\n") {
                g += "\\n"
            } else {
                if (j == "\\") {
                    g += j;
                    f++;
                    j = h.charAt(f);
                    if ('"\\/bfnrtu'.indexOf(j) == -1) {
                        g += "\\"
                    }
                    g += j
                } else {
                    if (j == '"') {
                        g += '\\"'
                    } else {
                        g += j
                    }
                }
            }
            f++
        }
        return g
    }
    ;
    var c = c || {};
    c.AppendNode = function(e) {
        this.editor = e;
        this.dom = {}
    }
    ;
    c.AppendNode.prototype = new c.Node();
    c.AppendNode.prototype.getDom = function() {
        var k = this.dom;
        if (k.tr) {
            return k.tr
        }
        var e = document.createElement("tr");
        e.node = this;
        k.tr = e;
        if (!this.editor.mode.editor) {
            return e
        }
        var f = document.createElement("td");
        k.tdDrag = f;
        var i = document.createElement("td");
        var j = document.createElement("button");
        j.className = "contextmenu";
        j.title = "Click to open the actions menu (Ctrl+M)";
        k.menu = j;
        k.tdMenu = i;
        i.appendChild(k.menu);
        var g = document.createElement("td");
        var h = document.createElement("div");
        h.innerHTML = "(empty)";
        h.className = "readonly";
        g.appendChild(h);
        k.td = g;
        k.text = h;
        this.updateDom();
        return e
    }
    ;
    c.AppendNode.prototype.updateDom = function() {
        var h = this.dom;
        var f = h.td;
        if (f) {
            f.style.paddingLeft = (this.getLevel() * 24 + 26) + "px"
        }
        var g = h.text;
        if (g) {
            g.innerHTML = "(empty " + this.parent.type + ")"
        }
        var e = h.tr;
        if (!this.isVisible()) {
            if (h.tr.firstChild) {
                e.removeChild(h.tdDrag);
                e.removeChild(h.tdMenu);
                e.removeChild(f)
            }
        } else {
            if (!h.tr.firstChild) {
                e.appendChild(h.tdDrag);
                e.appendChild(h.tdMenu);
                e.appendChild(f)
            }
        }
    }
    ;
    c.AppendNode.prototype.isVisible = function() {
        return (this.parent.childs.length == 0)
    }
    ;
    c.AppendNode.prototype.showContextMenu = function(g, e) {
        var h = this;
        var j = c.Node.TYPE_TITLES;
        var f = [{
            text: "Append",
            title: "Append a new field with type 'auto' (Ctrl+Shift+Ins)",
            submenuTitle: "Select the type of the field to be appended",
            className: "insert",
            click: function() {
                h._onAppend("", "", "auto")
            },
            submenu: [{
                text: "Auto",
                className: "type-auto",
                title: j.auto,
                click: function() {
                    h._onAppend("", "", "auto")
                }
            }, {
                text: "Array",
                className: "type-array",
                title: j.array,
                click: function() {
                    h._onAppend("", [])
                }
            }, {
                text: "Object",
                className: "type-object",
                title: j.object,
                click: function() {
                    h._onAppend("", {})
                }
            }, {
                text: "String",
                className: "type-string",
                title: j.string,
                click: function() {
                    h._onAppend("", "", "string")
                }
            }]
        }];
        var i = new c.ContextMenu(f,{
            close: e
        });
        i.show(g)
    }
    ;
    c.AppendNode.prototype.onEvent = function(g) {
        var f = g.type;
        var h = g.target || g.srcElement;
        var j = this.dom;
        var i = j.menu;
        if (h == i) {
            if (f == "mouseover") {
                this.editor.highlighter.highlight(this.parent)
            } else {
                if (f == "mouseout") {
                    this.editor.highlighter.unhighlight()
                }
            }
        }
        if (f == "click" && h == j.menu) {
            var e = this.editor.highlighter;
            e.highlight(this.parent);
            e.lock();
            c.util.addClassName(j.menu, "selected");
            this.showContextMenu(j.menu, function() {
                c.util.removeClassName(j.menu, "selected");
                e.unlock();
                e.unhighlight()
            })
        }
        if (f == "keydown") {
            this.onKeyDown(g)
        }
    }
    ;
    var c = c || {};
    c.ContextMenu = function(i, m) {
        this.dom = {};
        var k = this;
        var f = this.dom;
        this.anchor = undefined;
        this.items = i;
        this.eventListeners = {};
        this.selection = undefined;
        this.visibleSubmenu = undefined;
        this.onClose = m ? m.close : undefined;
        var e = document.createElement("div");
        e.className = "jsoneditor-contextmenu";
        f.menu = e;
        var h = document.createElement("ul");
        h.className = "menu";
        e.appendChild(h);
        f.list = h;
        f.items = [];
        var j = document.createElement("button");
        f.focusButton = j;
        var l = document.createElement("li");
        l.style.overflow = "hidden";
        l.style.height = "0";
        l.appendChild(j);
        h.appendChild(l);
        function g(p, n, o) {
            o.forEach(function(A) {
                if (A.type == "separator") {
                    var u = document.createElement("div");
                    u.className = "separator";
                    z = document.createElement("li");
                    z.appendChild(u);
                    p.appendChild(z)
                } else {
                    var r = {};
                    var z = document.createElement("li");
                    p.appendChild(z);
                    var v = document.createElement("button");
                    v.className = A.className;
                    r.button = v;
                    if (A.title) {
                        v.title = A.title
                    }
                    if (A.click) {
                        v.onclick = function() {
                            k.hide();
                            A.click()
                        }
                    }
                    z.appendChild(v);
                    if (A.submenu) {
                        var s = document.createElement("div");
                        s.className = "icon";
                        v.appendChild(s);
                        v.appendChild(document.createTextNode(A.text));
                        var q;
                        if (A.click) {
                            v.className += " default";
                            var y = document.createElement("button");
                            r.buttonExpand = y;
                            y.className = "expand";
                            y.innerHTML = '<div class="expand"></div>';
                            z.appendChild(y);
                            if (A.submenuTitle) {
                                y.title = A.submenuTitle
                            }
                            q = y
                        } else {
                            var t = document.createElement("div");
                            t.className = "expand";
                            v.appendChild(t);
                            q = v
                        }
                        q.onclick = function() {
                            k._onExpandItem(r);
                            q.focus()
                        }
                        ;
                        var x = [];
                        r.subItems = x;
                        var w = document.createElement("ul");
                        r.ul = w;
                        w.className = "menu";
                        w.style.height = "0";
                        z.appendChild(w);
                        g(w, x, A.submenu)
                    } else {
                        v.innerHTML = '<div class="icon"></div>' + A.text
                    }
                    n.push(r)
                }
            })
        }
        g(h, this.dom.items, i);
        this.maxHeight = 0;
        i.forEach(function(o) {
            var n = (i.length + (o.submenu ? o.submenu.length : 0)) * 24;
            k.maxHeight = Math.max(k.maxHeight, n)
        })
    }
    ;
    c.ContextMenu.prototype._getVisibleButtons = function() {
        var f = [];
        var e = this;
        this.dom.items.forEach(function(g) {
            f.push(g.button);
            if (g.buttonExpand) {
                f.push(g.buttonExpand)
            }
            if (g.subItems && g == e.expandedItem) {
                g.subItems.forEach(function(h) {
                    f.push(h.button);
                    if (h.buttonExpand) {
                        f.push(h.buttonExpand)
                    }
                })
            }
        });
        return f
    }
    ;
    c.ContextMenu.visibleMenu = undefined;
    c.ContextMenu.prototype.show = function(e) {
        this.hide();
        var l = c.util.getWindowHeight();
        var j = e.offsetHeight;
        var k = this.maxHeight;
        var i = c.util.getAbsoluteLeft(e);
        var h = c.util.getAbsoluteTop(e);
        if (h + j + k < l) {
            this.dom.menu.style.left = i + "px";
            this.dom.menu.style.top = (h + j) + "px";
            this.dom.menu.style.bottom = ""
        } else {
            this.dom.menu.style.left = i + "px";
            this.dom.menu.style.top = "";
            this.dom.menu.style.bottom = (l - h) + "px"
        }
        document.body.appendChild(this.dom.menu);
        var f = this;
        var g = this.dom.list;
        this.eventListeners.mousedown = c.util.addEventListener(document, "mousedown", function(m) {
            m = m || window.event;
            var n = m.target || m.srcElement;
            if ((n != g) && !f._isChildOf(n, g)) {
                f.hide();
                c.util.stopPropagation(m);
                c.util.preventDefault(m)
            }
        });
        this.eventListeners.mousewheel = c.util.addEventListener(document, "mousewheel", function() {
            c.util.stopPropagation(event);
            c.util.preventDefault(event)
        });
        this.eventListeners.keydown = c.util.addEventListener(document, "keydown", function(m) {
            f._onKeyDown(m)
        });
        this.selection = c.util.getSelection();
        this.anchor = e;
        setTimeout(function() {
            f.dom.focusButton.focus()
        }, 0);
        if (c.ContextMenu.visibleMenu) {
            c.ContextMenu.visibleMenu.hide()
        }
        c.ContextMenu.visibleMenu = this
    }
    ;
    c.ContextMenu.prototype.hide = function() {
        if (this.dom.menu.parentNode) {
            this.dom.menu.parentNode.removeChild(this.dom.menu);
            if (this.onClose) {
                this.onClose()
            }
        }
        for (var e in this.eventListeners) {
            if (this.eventListeners.hasOwnProperty(e)) {
                var f = this.eventListeners[e];
                if (f) {
                    c.util.removeEventListener(document, e, f)
                }
                delete this.eventListeners[e]
            }
        }
        if (c.ContextMenu.visibleMenu == this) {
            c.ContextMenu.visibleMenu = undefined
        }
    }
    ;
    c.ContextMenu.prototype._onExpandItem = function(i) {
        var j = this;
        var h = (i == this.expandedItem);
        var f = this.expandedItem;
        if (f) {
            f.ul.style.height = "0";
            f.ul.style.padding = "";
            setTimeout(function() {
                if (j.expandedItem != f) {
                    f.ul.style.display = "";
                    c.util.removeClassName(f.ul.parentNode, "selected")
                }
            }, 300);
            this.expandedItem = undefined
        }
        if (!h) {
            var g = i.ul;
            g.style.display = "block";
            var e = g.clientHeight;
            setTimeout(function() {
                if (j.expandedItem == i) {
                    g.style.height = (g.childNodes.length * 24) + "px";
                    g.style.padding = "5px 10px"
                }
            }, 0);
            c.util.addClassName(g.parentNode, "selected");
            this.expandedItem = i
        }
    }
    ;
    c.ContextMenu.prototype._onKeyDown = function(h) {
        h = h || window.event;
        var j = h.target || h.srcElement;
        var l = h.which || h.keyCode;
        var i = false;
        var g, e, f, k;
        if (l == 27) {
            if (this.selection) {
                c.util.setSelection(this.selection)
            }
            if (this.anchor) {
                this.anchor.focus()
            }
            this.hide();
            i = true
        } else {
            if (l == 9) {
                if (!h.shiftKey) {
                    g = this._getVisibleButtons();
                    e = g.indexOf(j);
                    if (e == g.length - 1) {
                        g[0].focus();
                        i = true
                    }
                } else {
                    g = this._getVisibleButtons();
                    e = g.indexOf(j);
                    if (e == 0) {
                        g[g.length - 1].focus();
                        i = true
                    }
                }
            } else {
                if (l == 37) {
                    if (j.className == "expand") {
                        g = this._getVisibleButtons();
                        e = g.indexOf(j);
                        f = g[e - 1];
                        if (f) {
                            f.focus()
                        }
                    }
                    i = true
                } else {
                    if (l == 38) {
                        g = this._getVisibleButtons();
                        e = g.indexOf(j);
                        f = g[e - 1];
                        if (f && f.className == "expand") {
                            f = g[e - 2]
                        }
                        if (!f) {
                            f = g[g.length - 1]
                        }
                        if (f) {
                            f.focus()
                        }
                        i = true
                    } else {
                        if (l == 39) {
                            g = this._getVisibleButtons();
                            e = g.indexOf(j);
                            k = g[e + 1];
                            if (k && k.className == "expand") {
                                k.focus()
                            }
                            i = true
                        } else {
                            if (l == 40) {
                                g = this._getVisibleButtons();
                                e = g.indexOf(j);
                                k = g[e + 1];
                                if (k && k.className == "expand") {
                                    k = g[e + 2]
                                }
                                if (!k) {
                                    k = g[0]
                                }
                                if (k) {
                                    k.focus();
                                    i = true
                                }
                                i = true
                            }
                        }
                    }
                }
            }
        }
        if (i) {
            c.util.stopPropagation(h);
            c.util.preventDefault(h)
        }
    }
    ;
    c.ContextMenu.prototype._isChildOf = function(h, f) {
        var g = h.parentNode;
        while (g) {
            if (g == f) {
                return true
            }
            g = g.parentNode
        }
        return false
    }
    ;
    var c = c || {};
    c.History = function(e) {
        this.editor = e;
        this.clear();
        this.actions = {
            editField: {
                undo: function(f) {
                    f.node.updateField(f.oldValue)
                },
                redo: function(f) {
                    f.node.updateField(f.newValue)
                }
            },
            editValue: {
                undo: function(f) {
                    f.node.updateValue(f.oldValue)
                },
                redo: function(f) {
                    f.node.updateValue(f.newValue)
                }
            },
            appendNode: {
                undo: function(f) {
                    f.parent.removeChild(f.node)
                },
                redo: function(f) {
                    f.parent.appendChild(f.node)
                }
            },
            insertBeforeNode: {
                undo: function(f) {
                    f.parent.removeChild(f.node)
                },
                redo: function(f) {
                    f.parent.insertBefore(f.node, f.beforeNode)
                }
            },
            insertAfterNode: {
                undo: function(f) {
                    f.parent.removeChild(f.node)
                },
                redo: function(f) {
                    f.parent.insertAfter(f.node, f.afterNode)
                }
            },
            removeNode: {
                undo: function(h) {
                    var g = h.parent;
                    var f = g.childs[h.index] || g.append;
                    g.insertBefore(h.node, f)
                },
                redo: function(f) {
                    f.parent.removeChild(f.node)
                }
            },
            duplicateNode: {
                undo: function(f) {
                    f.parent.removeChild(f.clone)
                },
                redo: function(f) {
                    f.parent.insertAfter(f.clone, f.node)
                }
            },
            changeType: {
                undo: function(f) {
                    f.node.changeType(f.oldType)
                },
                redo: function(f) {
                    f.node.changeType(f.newType)
                }
            },
            moveNode: {
                undo: function(f) {
                    f.startParent.moveTo(f.node, f.startIndex)
                },
                redo: function(f) {
                    f.endParent.moveTo(f.node, f.endIndex)
                }
            },
            sort: {
                undo: function(g) {
                    var f = g.node;
                    f.hideChilds();
                    f.sort = g.oldSort;
                    f.childs = g.oldChilds;
                    f.showChilds()
                },
                redo: function(g) {
                    var f = g.node;
                    f.hideChilds();
                    f.sort = g.newSort;
                    f.childs = g.newChilds;
                    f.showChilds()
                }
            }
        }
    }
    ;
    c.History.prototype.onChange = function() {}
    ;
    c.History.prototype.add = function(e, f) {
        this.index++;
        this.history[this.index] = {
            action: e,
            params: f,
            timestamp: new Date()
        };
        if (this.index < this.history.length - 1) {
            this.history.splice(this.index + 1, this.history.length - this.index - 1)
        }
        this.onChange()
    }
    ;
    c.History.prototype.clear = function() {
        this.history = [];
        this.index = -1;
        this.onChange()
    }
    ;
    c.History.prototype.canUndo = function() {
        return (this.index >= 0)
    }
    ;
    c.History.prototype.canRedo = function() {
        return (this.index < this.history.length - 1)
    }
    ;
    c.History.prototype.undo = function() {
        if (this.canUndo()) {
            var f = this.history[this.index];
            if (f) {
                var e = this.actions[f.action];
                if (e && e.undo) {
                    e.undo(f.params);
                    if (f.params.oldSelection) {
                        this.editor.setSelection(f.params.oldSelection)
                    }
                } else {
                    console.log('Error: unknown action "' + f.action + '"')
                }
            }
            this.index--;
            this.onChange()
        }
    }
    ;
    c.History.prototype.redo = function() {
        if (this.canRedo()) {
            this.index++;
            var f = this.history[this.index];
            if (f) {
                var e = this.actions[f.action];
                if (e && e.redo) {
                    e.redo(f.params);
                    if (f.params.newSelection) {
                        this.editor.setSelection(f.params.newSelection)
                    }
                } else {
                    console.log('Error: unknown action "' + f.action + '"')
                }
            }
            this.onChange()
        }
    }
    ;
    var c = c || {};
    c.SearchBox = function(k, e) {
        var q = this;
        this.editor = k;
        this.timeout = undefined;
        this.delay = 200;
        this.lastText = undefined;
        this.dom = {};
        this.dom.container = e;
        var r = document.createElement("table");
        this.dom.table = r;
        r.className = "search";
        e.appendChild(r);
        var i = document.createElement("tbody");
        this.dom.tbody = i;
        r.appendChild(i);
        var n = document.createElement("tr");
        i.appendChild(n);
        var g = document.createElement("td");
        n.appendChild(g);
        var h = document.createElement("div");
        this.dom.results = h;
        h.className = "results";
        g.appendChild(h);
        g = document.createElement("td");
        n.appendChild(g);
        var p = document.createElement("div");
        this.dom.input = p;
        p.className = "frame";
        p.title = "Search fields and values";
        g.appendChild(p);
        var f = document.createElement("table");
        p.appendChild(f);
        var m = document.createElement("tbody");
        f.appendChild(m);
        n = document.createElement("tr");
        m.appendChild(n);
        var o = document.createElement("button");
        o.className = "refresh";
        g = document.createElement("td");
        g.appendChild(o);
        n.appendChild(g);
        var s = document.createElement("input");
        this.dom.search = s;
        s.oninput = function(t) {
            q._onDelayedSearch(t)
        }
        ;
        s.onchange = function(t) {
            q._onSearch(t)
        }
        ;
        s.onkeydown = function(t) {
            q._onKeyDown(t)
        }
        ;
        s.onkeyup = function(t) {
            q._onKeyUp(t)
        }
        ;
        o.onclick = function(t) {
            s.select()
        }
        ;
        g = document.createElement("td");
        g.appendChild(s);
        n.appendChild(g);
        var j = document.createElement("button");
        j.title = "Next result (Enter)";
        j.className = "next";
        j.onclick = function() {
            q.next()
        }
        ;
        g = document.createElement("td");
        g.appendChild(j);
        n.appendChild(g);
        var l = document.createElement("button");
        l.title = "Previous result (Shift+Enter)";
        l.className = "previous";
        l.onclick = function() {
            q.previous()
        }
        ;
        g = document.createElement("td");
        g.appendChild(l);
        n.appendChild(g)
    }
    ;
    c.SearchBox.prototype.next = function(e) {
        if (this.results != undefined) {
            var f = (this.resultIndex != undefined) ? this.resultIndex + 1 : 0;
            if (f > this.results.length - 1) {
                f = 0
            }
            this._setActiveResult(f, e)
        }
    }
    ;
    c.SearchBox.prototype.previous = function(f) {
        if (this.results != undefined) {
            var e = this.results.length - 1;
            var g = (this.resultIndex != undefined) ? this.resultIndex - 1 : e;
            if (g < 0) {
                g = e
            }
            this._setActiveResult(g, f)
        }
    }
    ;
    c.SearchBox.prototype._setActiveResult = function(h, g) {
        if (this.activeResult) {
            var f = this.activeResult.node;
            var e = this.activeResult.elem;
            if (e == "field") {
                delete f.searchFieldActive
            } else {
                delete f.searchValueActive
            }
            f.updateDom()
        }
        if (!this.results || !this.results[h]) {
            this.resultIndex = undefined;
            this.activeResult = undefined;
            return
        }
        this.resultIndex = h;
        var j = this.results[this.resultIndex].node;
        var i = this.results[this.resultIndex].elem;
        if (i == "field") {
            j.searchFieldActive = true
        } else {
            j.searchValueActive = true
        }
        this.activeResult = this.results[this.resultIndex];
        j.updateDom();
        j.scrollTo(function() {
            if (g) {
                j.focus(i)
            }
        })
    }
    ;
    c.SearchBox.prototype._clearDelay = function() {
        if (this.timeout != undefined) {
            clearTimeout(this.timeout);
            delete this.timeout
        }
    }
    ;
    c.SearchBox.prototype._onDelayedSearch = function(e) {
        this._clearDelay();
        var f = this;
        this.timeout = setTimeout(function(g) {
            f._onSearch(g)
        }, this.delay)
    }
    ;
    c.SearchBox.prototype._onSearch = function(f, h) {
        this._clearDelay();
        var g = this.dom.search.value;
        var i = (g.length > 0) ? g : undefined;
        if (i != this.lastText || h) {
            this.lastText = i;
            this.results = this.editor.search(i);
            this._setActiveResult(undefined);
            if (i != undefined) {
                var e = this.results.length;
                switch (e) {
                case 0:
                    this.dom.results.innerHTML = "no&nbsp;results";
                    break;
                case 1:
                    this.dom.results.innerHTML = "1&nbsp;result";
                    break;
                default:
                    this.dom.results.innerHTML = e + "&nbsp;results";
                    break
                }
            } else {
                this.dom.results.innerHTML = ""
            }
        }
    }
    ;
    c.SearchBox.prototype._onKeyDown = function(e) {
        e = e || window.event;
        var f = e.which || e.keyCode;
        if (f == 27) {
            this.dom.search.value = "";
            this._onSearch(e);
            c.util.preventDefault(e);
            c.util.stopPropagation(e)
        } else {
            if (f == 13) {
                if (e.ctrlKey) {
                    this._onSearch(e, true)
                } else {
                    if (e.shiftKey) {
                        this.previous()
                    } else {
                        this.next()
                    }
                }
                c.util.preventDefault(e);
                c.util.stopPropagation(e)
            }
        }
    }
    ;
    c.SearchBox.prototype._onKeyUp = function(e) {
        e = e || window.event;
        var f = e.which || e.keyCode;
        if (f != 27 && f != 13) {
            this._onDelayedSearch(e)
        }
    }
    ;
    var c = c || {};
    c.Highlighter = function() {
        this.locked = false
    }
    ;
    c.Highlighter.prototype.highlight = function(e) {
        if (this.locked) {
            return
        }
        if (this.node != e) {
            if (this.node) {
                this.node.setHighlight(false)
            }
            this.node = e;
            this.node.setHighlight(true)
        }
        this._cancelUnhighlight()
    }
    ;
    c.Highlighter.prototype.unhighlight = function() {
        if (this.locked) {
            return
        }
        var e = this;
        if (this.node) {
            this._cancelUnhighlight();
            this.unhighlightTimer = setTimeout(function() {
                e.node.setHighlight(false);
                e.node = undefined;
                e.unhighlightTimer = undefined
            }, 0)
        }
    }
    ;
    c.Highlighter.prototype._cancelUnhighlight = function() {
        if (this.unhighlightTimer) {
            clearTimeout(this.unhighlightTimer);
            this.unhighlightTimer = undefined
        }
    }
    ;
    c.Highlighter.prototype.lock = function() {
        this.locked = true
    }
    ;
    c.Highlighter.prototype.unlock = function() {
        this.locked = false
    }
    ;
    var c = c || {};
    c.util = {};
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(f) {
            for (var e = 0; e < this.length; e++) {
                if (this[e] == f) {
                    return e
                }
            }
            return -1
        }
    }
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(h, g) {
            for (var f = 0, e = this.length; f < e; ++f) {
                h.call(g || this, this[f], f, this)
            }
        }
    }
    if (typeof console === "undefined") {
        console = {
            log: function() {}
        }
    }
    c.util.parse = function(e) {
        try {
            return JSON.parse(e)
        } catch (g) {
            var f = c.util.validate(e) || g;
            throw new Error(f)
        }
    }
    ;
    c.util.validate = function(e) {
        var g = undefined;
        try {
            if (typeof (jsonlint) != "undefined") {
                jsonlint.parse(e)
            } else {
                JSON.parse(e)
            }
        } catch (f) {
            g = '<pre class="error">' + f.toString() + "</pre>";
            if (typeof (jsonlint) != "undefined") {
                g += '<a class="error" href="http://zaach.github.com/jsonlint/" target="_blank">validated by jsonlint</a>'
            }
        }
        return g
    }
    ;
    c.util.getAbsoluteLeft = function(g) {
        var i = g.offsetLeft;
        var f = document.body;
        var h = g.offsetParent;
        while (h != null && g != f) {
            i += h.offsetLeft;
            i -= h.scrollLeft;
            h = h.offsetParent
        }
        return i
    }
    ;
    c.util.getAbsoluteTop = function(g) {
        var i = g.offsetTop;
        var f = document.body;
        var h = g.offsetParent;
        while (h != null && h != f) {
            i += h.offsetTop;
            i -= h.scrollTop;
            h = h.offsetParent
        }
        return i
    }
    ;
    c.util.getMouseY = function(f) {
        var e;
        if ("pageY"in f) {
            e = f.pageY
        } else {
            e = (f.clientY + document.documentElement.scrollTop)
        }
        return e
    }
    ;
    c.util.getMouseX = function(f) {
        var e;
        if ("pageX"in f) {
            e = f.pageX
        } else {
            e = (f.clientX + document.documentElement.scrollLeft)
        }
        return e
    }
    ;
    c.util.getWindowHeight = function() {
        if ("innerHeight"in window) {
            return window.innerHeight
        } else {
            return Math.max(document.body.clientHeight, document.documentElement.clientHeight)
        }
    }
    ;
    c.util.addClassName = function(g, f) {
        var e = g.className.split(" ");
        if (e.indexOf(f) == -1) {
            e.push(f);
            g.className = e.join(" ")
        }
    }
    ;
    c.util.removeClassName = function(h, g) {
        var f = h.className.split(" ");
        var e = f.indexOf(g);
        if (e != -1) {
            f.splice(e, 1);
            h.className = f.join(" ")
        }
    }
    ;
    c.util.stripFormatting = function(f) {
        var m = f.childNodes;
        for (var k = 0, e = m.length; k < e; k++) {
            var n = m[k];
            if (n.style) {
                n.removeAttribute("style")
            }
            var g = n.attributes;
            if (g) {
                for (var h = g.length - 1; h >= 0; h--) {
                    var l = g[h];
                    if (l.specified == true) {
                        n.removeAttribute(l.name)
                    }
                }
            }
            c.util.stripFormatting(n)
        }
    }
    ;
    c.util.setEndOfContentEditable = function(f) {
        var e, g;
        if (document.createRange) {
            e = document.createRange();
            e.selectNodeContents(f);
            e.collapse(false);
            g = window.getSelection();
            g.removeAllRanges();
            g.addRange(e)
        } else {
            if (document.selection) {
                e = document.body.createTextRange();
                e.moveToElementText(f);
                e.collapse(false);
                e.select()
            }
        }
    }
    ;
    c.util.selectContentEditable = function(f) {
        if (!f || f.nodeName != "DIV") {
            return
        }
        var g, e;
        if (window.getSelection && document.createRange) {
            e = document.createRange();
            e.selectNodeContents(f);
            g = window.getSelection();
            g.removeAllRanges();
            g.addRange(e)
        } else {
            if (document.body.createTextRange) {
                e = document.body.createTextRange();
                e.moveToElementText(f);
                e.select()
            }
        }
    }
    ;
    c.util.getSelection = function() {
        if (window.getSelection) {
            var e = window.getSelection();
            if (e.getRangeAt && e.rangeCount) {
                return e.getRangeAt(0)
            }
        } else {
            if (document.selection && document.selection.createRange) {
                return document.selection.createRange()
            }
        }
        return null
    }
    ;
    c.util.setSelection = function(e) {
        if (e) {
            if (window.getSelection) {
                var f = window.getSelection();
                f.removeAllRanges();
                f.addRange(e)
            } else {
                if (document.selection && e.select) {
                    e.select()
                }
            }
        }
    }
    ;
    c.util.getSelectionOffset = function() {
        var e = c.util.getSelection();
        if (e && "startOffset"in e && "endOffset"in e && e.startContainer && (e.startContainer == e.endContainer)) {
            return {
                startOffset: e.startOffset,
                endOffset: e.endOffset,
                container: e.startContainer.parentNode
            }
        } else {}
        return null
    }
    ;
    c.util.setSelectionOffset = function(g) {
        if (document.createRange && window.getSelection) {
            var f = window.getSelection();
            if (f) {
                var e = document.createRange();
                e.setStart(g.container.firstChild, g.startOffset);
                e.setEnd(g.container.firstChild, g.endOffset);
                c.util.setSelection(e)
            }
        } else {}
    }
    ;
    c.util.getInnerText = function(h, f) {
        var k = (f == undefined);
        if (k) {
            f = {
                text: "",
                flush: function() {
                    var i = this.text;
                    this.text = "";
                    return i
                },
                set: function(i) {
                    this.text = i
                }
            }
        }
        if (h.nodeValue) {
            return f.flush() + h.nodeValue
        }
        if (h.hasChildNodes()) {
            var o = h.childNodes;
            var l = "";
            for (var j = 0, g = o.length; j < g; j++) {
                var e = o[j];
                if (e.nodeName == "DIV" || e.nodeName == "P") {
                    var n = o[j - 1];
                    var m = n ? n.nodeName : undefined;
                    if (m && m != "DIV" && m != "P" && m != "BR") {
                        l += "\n";
                        f.flush()
                    }
                    l += c.util.getInnerText(e, f);
                    f.set("\n")
                } else {
                    if (e.nodeName == "BR") {
                        l += f.flush();
                        f.set("\n")
                    } else {
                        l += c.util.getInnerText(e, f)
                    }
                }
            }
            return l
        } else {
            if (h.nodeName == "P" && c.util.getInternetExplorerVersion() != -1) {
                return f.flush()
            }
        }
        return ""
    }
    ;
    c.util.getInternetExplorerVersion = function() {
        if (d == -1) {
            var g = -1;
            if (navigator.appName == "Microsoft Internet Explorer") {
                var e = navigator.userAgent;
                var f = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
                if (f.exec(e) != null) {
                    g = parseFloat(RegExp.$1)
                }
            }
            d = g
        }
        return d
    }
    ;
    var d = -1;
    c.util.addEventListener = function(g, j, i, e) {
        if (g.addEventListener) {
            if (e === undefined) {
                e = false
            }
            if (j === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
                j = "DOMMouseScroll"
            }
            g.addEventListener(j, i, e);
            return i
        } else {
            var h = function() {
                return i.call(g, window.event)
            };
            g.attachEvent("on" + j, h);
            return h
        }
    }
    ;
    c.util.removeEventListener = function(f, h, g, e) {
        if (f.removeEventListener) {
            if (e === undefined) {
                e = false
            }
            if (h === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
                h = "DOMMouseScroll"
            }
            f.removeEventListener(h, g, e)
        } else {
            f.detachEvent("on" + h, g)
        }
    }
    ;
    c.util.stopPropagation = function(e) {
        if (!e) {
            e = window.event
        }
        if (e.stopPropagation) {
            e.stopPropagation()
        } else {
            e.cancelBubble = true
        }
    }
    ;
    c.util.preventDefault = function(e) {
        if (!e) {
            e = window.event
        }
        if (e.preventDefault) {
            e.preventDefault()
        } else {
            e.returnValue = false
        }
    }
    ;
    var b = {
        JSONEditor: c.JSONEditor,
        JSONFormatter: c.JSONFormatter,
        util: c.util
    };
    var a = function() {
        var f = document.getElementsByTagName("script");
        var g = f[f.length - 1].src.split("?")[0];
        var e = g.substring(0, g.length - 2) + "css";
        var h = document.createElement("link");
        h.type = "text/css";
        h.rel = "stylesheet";
        h.href = e;
        document.getElementsByTagName("head")[0].appendChild(h)
    };
    if (typeof (module) != "undefined" && typeof (exports) != "undefined") {
        a();
        module.exports = exports = b
    }
    if (typeof (require) != "undefined" && typeof (define) != "undefined") {
        define(function() {
            a();
            return b
        })
    } else {
        window.jsoneditor = b
    }
}
)();
