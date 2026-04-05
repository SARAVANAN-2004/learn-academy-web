import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class TestCardComponent extends Component {
    @service router;
    @service notification;

    @action
    async enroll() {
        try {
            let response = await apiRequest('/api/enroll', {
                method: 'POST',
                // Using Test enrollment payload logic
                body: JSON.stringify({ id: this.args.test.id, type: "test" })
            });

            let data = await response.json();
            this.notification.success(data.message || "Enrolled in test successfully!");
            // Refresh route to pick up enrolled status
            if (this.args.onEnroll) {
                this.args.onEnroll();
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Enrollment failed:", err);
            this.notification.error("Something went wrong. Please try again.");
        }
    }

    @action
    goToTest() {
        // Navigates to test attempt route
        this.router.transitionTo('app.test-attempt', this.args.test.id);
    }
}
