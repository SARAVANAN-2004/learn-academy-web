import Controller from '@ember/controller';
import { action } from '@ember/object';
import { apiRequest } from 'learn-academy-web/utils/api';
import { tracked } from '@glimmer/tracking';

export default class MylearningController extends Controller {
    queryParams = ['type'];
    @tracked type = 'all';

    get filteredModel() {
        let items = this.model || [];
        if (this.type === 'course') {
            return items.filter(i => !i.type || i.type.toUpperCase() !== 'TEST');
        } else if (this.type === 'test') {
            return items.filter(i => i.type && i.type.toUpperCase() === 'TEST');
        }
        return items;
    }

    @action
    setType(newType) {
        this.type = newType;
    }
    @action
    async logout() {
        await apiRequest('/api/logout', {
            method: 'POST'
        });

        window.location.href = '/login';
    }
}
