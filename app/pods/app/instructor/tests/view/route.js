import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class InstructorTestsViewRoute extends Route {
    @service instructorApi;

    async model(params) {
        try {
            let res = await this.instructorApi.fetchTest(params.testId);
            let data = await res.json();
            return data.test || data; // handle payload variation
        } catch (err) {
            console.error('Error fetching test details:', err);
            return null;
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.test = model;
        controller.activeTab = 'overview';
    }
}
