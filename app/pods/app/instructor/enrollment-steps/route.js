import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class EnrollmentStepsRoute extends Route {
    async model(params) {
        if (params.course_id === 'new') {
            return { isNew: true, courseId: 'new' };
        }

        try {
            let res = await apiRequest(`/api/instructor/courses/${params.course_id}`);
            let data = await res.json();
            return {
                isNew: false,
                courseId: params.course_id,
                courseData: data.course || data
            };
        } catch (e) {
            console.error('Error fetching course metadata for edit:', e);
            return { isNew: false, courseId: params.course_id };
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.isNew = model.isNew;
        controller.courseId = model.courseId;

        if (!model.isNew && model.courseData) {
            const data = model.courseData;
            controller.courseType = data.courseType || 'Course';
            controller.title = data.title || '';
            controller.category = data.category || '';
            controller.imageUrl = data.imageUrl || '';
            controller.learnObjectives = data.description || '';
            controller.requirements = data.requirements || '';
            controller.whoIsThisFor = data.targetAudience || '';
            controller.timeCommitment = data.timeCommitment || '';
            controller.instructorName = data.instructor || '';
            controller.originalPrice = data.originalPrice || '';
            controller.discountedPrice = data.price || '';
            controller.rating = data.rating || 5;
            controller.badges = data.badges ? data.badges.map(b => b.name || b).join(', ') : '';
        } else {
            // Reset fields
            controller.courseType = 'Course';
            controller.title = '';
            controller.category = '';
            controller.imageUrl = '';
            controller.learnObjectives = '';
            controller.requirements = '';
            controller.whoIsThisFor = '';
            controller.timeCommitment = '';
            controller.instructorName = '';
            controller.originalPrice = '';
            controller.discountedPrice = '';
            controller.rating = 5;
            controller.badges = '';
            controller.currentStep = 1;
        }

        if (!model.isNew) {
            // Bypass course type selection in edit mode
            controller.currentStep = 2;
        }
    }
}
