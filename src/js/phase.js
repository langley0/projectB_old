export default class Phase {

    begin() {
        if (this.begin_callback) {
            this.begin_callback();
        }
    }

    end() {
        if (this.end_callback) {
            this.end_callback();
        }
    }

    onBegin(callback) {
        this.begin_callback = callback;
    }

    onEnd(callback) {
        this.end_callback = callback;
    }

    transitionTo(phase) {
        // 현재 페이즈에서 다음 페이즈로 넘어간다
    }

    onClick(callback) {
        this.click_callback = callback;
    }

    onUpdate(callback) {
        this.update_callback = callback;
    }

    update() {
        if (this.update_callback) {
            this.update_callback();
        }
    }
}