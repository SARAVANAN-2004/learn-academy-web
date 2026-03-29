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
            let res = await apiRequest('/api/create-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });
            let data = await res.json();

            if (data.success) {
                this.notification.success("Course created successfully!");
                let cId = data.courseId || data.course_id || data.id || data.course?.id || 'new';
                this.router.transitionTo('app.instructor.create-course', cId);
            } else {
                this.notification.error("Error: " + (data.message || "Something went wrong"));
            }
        } catch (e) {
            this.notification.error("Failed to create course.");
        }
    }
}
