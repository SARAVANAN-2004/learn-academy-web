import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorReportsRoute extends Route {
    queryParams = {
        type: { refreshModel: true }
    };

    async model(params) {
        try {
            let url = '/api/instructor/course-report';
            if (params.type && params.type !== 'all') {
                url += `?type=${params.type}`;
            }
            let res = await apiRequest(url);
            let data = await res.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch instructor course reports', error);
            return [];
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        let rawItems = [];
        if (Array.isArray(model)) {
            rawItems = model;
        } else if (model) {
            if (model.courses) rawItems = rawItems.concat(model.courses);
            if (model.tests) rawItems = rawItems.concat(model.tests);
            if (!model.courses && !model.tests && model.data) rawItems = model.data;
        }
        controller.initData(rawItems);
    }
}
