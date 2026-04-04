import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class CreateCourseRoute extends Route {
    async model(params) {
        if (params.course_id === 'new') {
            return { isNew: true, courseId: 'new' };
        }

        try {
            let res = await apiRequest(`/api/instructor/courses/${params.course_id}/content`);
            let data = await res.json();
            return {
                isNew: false,
                courseId: params.course_id,
                contentData: data.content || data
            };
        } catch (e) {
            console.error('Error fetching course content for edit:', e);
            return { isNew: false, courseId: params.course_id };
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.isNew = model.isNew;
        controller.courseId = model.courseId;

        if (!model.isNew && model.contentData) {
            let contentSource = model.contentData;

            // If the backend wrapped it inside a root object payload.
            let sectionsArray = Array.isArray(contentSource)
                ? contentSource
                : (contentSource.content || contentSource);

            controller.summary = contentSource.summary || '';
            controller.sections = Array.isArray(sectionsArray) ? sectionsArray : [];
        } else {
            // Reset
            controller.summary = '';
            controller.sections = [];
        }
    }
}
