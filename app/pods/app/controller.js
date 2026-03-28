import Controller from '@ember/controller';
import { action } from '@ember/object';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class AppController extends Controller {
    @action
    async logout() {
        try {
            await apiRequest('/api/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        }
        window.location.href = '/login';
    }
}
