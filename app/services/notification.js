import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class NotificationService extends Service {
    @tracked messages = [];

    _addMessage(message, type) {
        let id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
        let msgObj = { id, text: message, type };
        this.messages = [...this.messages, msgObj];

        setTimeout(() => {
            this.remove(id);
        }, 4000);
    }

    @action
    success(message) {
        this._addMessage(message, 'success');
    }

    @action
    error(message) {
        this._addMessage(message, 'error');
    }

    @action
    info(message) {
        this._addMessage(message, 'info');
    }

    @action
    warning(message) {
        this._addMessage(message, 'warning');
    }

    @action
    remove(id) {
        this.messages = this.messages.filter(m => m.id !== id);
    }
}
