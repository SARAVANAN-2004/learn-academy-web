import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorReportsRoute extends Route {
    async model() {
        try {
            let res = await apiRequest('/api/instructor/course-report');
            let data = await res.json();
            // Data expected: array of courses. Each course has enrolledUsers array.
            return data;
        } catch (error) {
            console.error('Failed to fetch instructor course reports', error);
            return [];
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.initData(Array.isArray(model) ? model : (model.data || []));
    }
}
