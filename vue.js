const compileUtil = {
    getvalue(expr, vm) {
        return expr.split(".").reduce((data, currentVal) => {
            // console.log(currentVal);
            return data[currentVal];
        }, vm.$data);

    },
    setvalue(expr, vm, val) {
        return expr.split(".").reduce((data, currentVal) => {
            data[currentVal] = val;
        }, vm.$data);
    },
    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getvalue(args[1], vm);
        });
    },
    text(node, expr, vm) {
        let value;
        if (expr.indexOf("{{") !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                // console.log(args);
                new Watcher(vm, args[1], () => {
                    this.updater.textUpdater(node, this.getContentVal(expr, vm));
                });
                return this.getvalue(args[1], vm);
            });
        } else {
            new Watcher(vm, expr, () => {
                this.updater.textUpdater(node, this.getvalue(expr, vm));
            });
            value = this.getvalue(expr, vm);
        }
        this.updater.textUpdater(node, value);
    },
    html(node, expr, vm) {
        const value = this.getvalue(expr, vm);
        new Watcher(vm, expr, (newVal) => {
            this.updater.htmlUpdater(node, newVal);
        });
        this.updater.htmlUpdater(node, value);
    },
    model(node, expr, vm) {
        const value = this.getvalue(expr, vm);

        // 绑定更新函数
        new Watcher(vm, expr, (newVal) => {
            this.updater.modelUpdater(node, newVal);
        });
        // 视图修改实践，绑定model
        node.addEventListener('input', (e) => {
            //设置值
            this.setvalue(expr, vm, e.target.value);
        });

        this.updater.modelUpdater(node, value);
    },
    on(node, expr, vm, eventName) {
        let fn = vm.$options.methods && vm.$options.methods[expr];
        node.addEventListener(eventName, fn.bind(vm), false);
    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value;
        },
        htmlUpdater(node, value) {
            node.innerHTML = value;
        },
        modelUpdater(node, value) {
            node.value = value;
        }
    }
};

class Compile {
    constructor(el, vm) {
        this.el = this.isElemmentNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        // 1. 获取文档碎片对象
        const fragment = this.node2Fragment(this.el);

        // 2. 编译
        this.compile(fragment);

        //3. 追加子元素
        this.el.appendChild(fragment);
    }

    node2Fragment(el) {

        const f = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild);
        }
        return f;
    }

    compile(fragment) {
        // 1.取所有子节点
        const childNodes = fragment.childNodes;
        var nodes = [...childNodes];
        nodes.forEach(child => {

            if (this.isElemmentNode(child)) {
                // 编译元素节点

                this.compileElement(child);
            } else {
                // console.log("文本" + child);
                this.compileText(child);
            }

            if (child && child.childNodes) {
                this.compile(child);
            }
        });
    }

    compileElement(node) {
        const attributes = [...node.attributes];
        attributes.forEach(attr => {
            const { name, value } = attr;
            if (this.isDirective(name)) {
                const [, directive] = name.split("-");
                const [dirName, eventName] = directive.split(":");

                // 更新数据
                compileUtil[dirName](node, value, this.vm, eventName);

                //删除指令标签
                node.removeAttribute(name);
            } else if (this.isEvent(name)) {
                let [, eventName] = name.split("@");
                compileUtil["on"](node, value, this.vm, eventName);
            }
        });
    }

    compileText(node) {
        const content = node.textContent;
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil["text"](node, content, this.vm);
            console.log(content);
        }
    }

    isDirective(attrName) {
        return attrName.indexOf("v-") > -1;
    }

    isEvent(attrName) {
        return attrName.indexOf("@") > -1;
    }

    isElemmentNode(node) {
        return node.nodeType === 1;
    }
}

class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        this.$options = options;
        if (this.$el) {
            // 1.实现数据观察者
            new Observer(this.$data);
            // 2.实现编译器
            new Compile(this.$el, this);
        }
    }
}


