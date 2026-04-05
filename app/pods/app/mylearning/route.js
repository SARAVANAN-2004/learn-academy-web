import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class MylearningRoute extends Route {
    async beforeModel() {
        let res = await apiRequest('/api/auth/me');

        if (res.status === 401) {
            this.transitionTo('login');
        }
    }

    queryParams = {
        type: { refreshModel: true }
    };

    async model(params) {
        let url = '/api/mylearning';
        if (params.type && params.type !== 'all') {
            url += `?type=${params.type}`;
        }
        let res = await apiRequest(url);
        let data = await res.json();
        return data.items || data.courses || data.tests || [];
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.isLoading = false;
    }
}
