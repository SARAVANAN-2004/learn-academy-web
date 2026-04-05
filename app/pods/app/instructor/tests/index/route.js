import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class InstructorTestsIndexRoute extends Route {
    @service instructorApi;

    async model() {
        try {
            let res = await this.instructorApi.fetchTests();
            let data = await res.json();
            return Array.isArray(data) ? data : (data.tests || []);
        } catch (err) {
            console.error('Error fetching instructor tests:', err);
            return [];
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.tests = model || [];
        controller.isExporting = false;
        controller.isDeleting = false;
        controller.testToDelete = null; // for modal
        controller.showDeleteModal = false;
    }
}
