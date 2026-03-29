import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class ViewCourseRoute extends Route {
    async model(params) {
        let res = await apiRequest(`/api/viewCourse?courseId=${params.course_id}`);
        if (!res.ok) throw new Error('Course not found');

        let data = await res.json();
        let parsedContent = { sections: [] };
        try {
            if (data.courseContent && data.courseContent.content) {
                let parsed = JSON.parse(data.courseContent.content);
                parsedContent = Array.isArray(parsed) ? { sections: parsed } : parsed;
            }
        } catch (e) {
            console.error("Error parsing course content JSON", e);
        }

        return {
            courseDetails: data.courseDetails,
            content: parsedContent,
            progress: data.progress || []
        };
    }

    setupController(controller, model) {
        super.setupController(controller, model);

        controller.progress = model.progress || [];

        // Initialize the controller with the first lesson's content
        if (model.content?.sections?.length > 0 && model.content.sections[0].lessons?.length > 0) {
            controller.currentLesson = model.content.sections[0].lessons[0];
        } else {
            controller.currentLesson = { title: 'No Lessons Available', video: '', resources: 'None' };
        }
    }
}
