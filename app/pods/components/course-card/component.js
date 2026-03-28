import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class CourseCardComponent extends Component {
    @service router;
    @service notification;

    @action
    async enroll() {
        try {
            let response = await apiRequest('/api/enroll', {
                method: 'POST',
                body: JSON.stringify({ courseId: this.args.course.id })
            });

            let data = await response.json();
            this.notification.success(data.message || "Enrolled successfully!");
        } catch (err) {
            console.error("Enrollment failed:", err);
            this.notification.error("Something went wrong. Please try again.");
        }
    }

    @action
    goToCourse() {
        this.router.transitionTo('app.view-course', this.args.course.id);
    }
}
