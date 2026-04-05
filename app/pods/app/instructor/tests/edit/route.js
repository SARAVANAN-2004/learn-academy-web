import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class InstructorTestsEditRoute extends Route {
    @service instructorApi;

    async model(params) {
        try {
            let res = await this.instructorApi.fetchTest(params.testId);
            let data = await res.json();
            return data.test || data;
        } catch (err) {
            console.error('Error fetching test details for edit:', err);
            return null;
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        if (model) {
            controller.testData = {
                id: model.id,
                title: model.title || '',
                description: model.description || '',
                category: model.category || '',
                timeLimit: model.timeLimit || null
            };
        }
        controller.isSaving = false;
    }
}
