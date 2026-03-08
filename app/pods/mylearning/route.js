import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class MylearningRoute extends Route {
    async beforeModel() {
        let res = await apiRequest('/api/auth/me');

        if (res.status === 401) {
            this.transitionTo('login');
        }
    }

    async model() {
        let res = await apiRequest('/api/mylearning');
        let data = await res.json();
        return Array.isArray(data) ? data : (data.courses || []);
    }
}
