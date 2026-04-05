import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class InstructorTestsEditController extends Controller {
    @service instructorApi;
    @service notification;
    @service router;

    @tracked testData = {};
    @tracked isSaving = false;

    @action
    updateField(field, event) {
        this.testData = {
            ...this.testData,
            [field]: event.target.value
        };
    }

    @action
    async saveTest(event) {
        event.preventDefault();
        if (!this.testData.title || !this.testData.category) {
            this.notification.error('Title and Category are required.');
            return;
        }

        this.isSaving = true;
        try {
            let res = await this.instructorApi.editTest(this.testData.id, this.testData);
            if (res.ok) {
                this.notification.success('Test correctly updated!');
                this.router.transitionTo('app.instructor.tests.view', this.testData.id);
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            console.error('Error updating test:', err);
            this.notification.error('Failed to update test details. Please try again.');
        } finally {
            this.isSaving = false;
        }
    }
}
