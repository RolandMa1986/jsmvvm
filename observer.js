class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldVal = this.getOldVal();
    }
    getOldVal() {
        Dep.target = this;
        return compileUtil.getvalue(this.expr, this.vm);
        Dep.target = null;
    }
    update() {
        const newVal = compileUtil.getvalue(this.expr, this.vm);
        if (newVal !== this.oldVal) {
            this.cb(newVal);
        }
    }
}

class Dep {
    constructor() {
        this.subs = [];
    }

    addSub(watcher) {
        this.subs.push(watcher);
    }

    notify() {
        console.log("watcher was updated");
        this.subs.forEach(watcher => {
            watcher.update();
        });
    }
}


class Observer {
    constructor(data) {
        this.observe(data);
    }

    observe(data) {
        if (data && typeof data === "object") {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            });
        }
    }
    defineReactive(obj, key, value) {
        //递归子对象属性
        this.observe(value);

        const dep = new Dep();

        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: false,
            get() {
                // 订阅数据变化， 添加观察者
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newValue) => {
                if (newValue !== value) {
                    // 观察新对象
                    this.observe(newValue);
                    value = newValue;
                    // 通知变化
                    dep.notify();
                }
            },
        });
    }
}