import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class EnrollmentStepsController extends Controller {
    @service router;
    @service notification;


    @tracked currentStep = 1;
    @tracked courseType = 'Course';
    @tracked title = '';
    @tracked imageUrl = '';
    @tracked category = '';
    @tracked learnObjectives = '';
    @tracked requirements = '';
    @tracked whoIsThisFor = '';
    @tracked instructorName = '';
    @tracked originalPrice = '';
    @tracked discountedPrice = '';
    @tracked rating = 5;
    @tracked badges = '';
    @tracked timeCommitment = '';

    get progressStyle() {
        let width = (this.currentStep - 1) * 25;
        return htmlSafe(`width: ${width}%`);
    }

    get titleCharCount() {
        return 60 - this.title.length;
    }

    @action
    selectCourseType(type) {
        this.courseType = type;
    }

    @action
    nextStep(step) {
        this.currentStep = step;
    }

    @action
    previousStep(step) {
        this.currentStep = step;
    }

    @action
    updateField(field, event) {
        this[field] = event.target.value;
    }

    @action
    setTime(value) {
        this.timeCommitment = value;
    }

    @action
    exitCourseCreation() {
        if (confirm("Are you sure you want to exit? All progress will be lost.")) {
            this.router.transitionTo('app.instructor.dashboard');
        }
    }

    @action
    async submitCourseData() {
        if (!this.title || !this.category || !this.timeCommitment) {
            this.notification.error("Please fill all required fields.");
            return;
        }

        const courseData = {
            courseType: this.courseType,
            title: this.title.trim(),
            imageUrl: this.imageUrl.trim(),
            category: this.category,
            learnObjectives: this.learnObjectives.trim(),
            requirements: this.requirements.trim(),
            whoIsThisFor: this.whoIsThisFor.trim(),
            timeCommitment: this.timeCommitment,
            instructorName: this.instructorName.trim(),
            originalPrice: parseFloat(this.originalPrice) || 0,
            discountedPrice: parseFloat(this.discountedPrice) || 0,
            rating: parseFloat(this.rating) || 5,
            badges: this.badges ? this.badges.split(',').map(b => b.trim()) : [],
        };

        try {
            let endpoint = '/api/create-course';
            let method = 'POST';

            if (!this.isNew) {
                endpoint = `/api/instructor/courses/${this.courseId}`;
                method = 'PUT';
            }

            let res = await apiRequest(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            if (res.ok) {
                this.notification.success(this.isNew ? "Course created successfully!" : "Course updated successfully!");
                if (this.isNew) {
                    let data = await res.json().catch(() => ({}));
                    let cId = data.courseId || data.course_id || data.id || data.course?.id || 'new';
                    this.router.transitionTo('app.instructor.create-course', cId);
                } else {
                    this.router.transitionTo('app.instructor.courses');
                }
            } else {
                let data = await res.json().catch(() => ({}));
                this.notification.error("Error: " + (data.message || "Failed to save course data."));
            }
        } catch (e) {
            this.notification.error("Failed to process course action.");
            console.error(e);
        }
    }
}
