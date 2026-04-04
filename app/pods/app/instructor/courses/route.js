import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorCoursesRoute extends Route {
    async model() {
        try {
            let res = await apiRequest('/api/instructor/courses');
            let data = await res.json();
            // Assuming data could be an array of courses directly or { courses: [...] } 
            return Array.isArray(data) ? data : (data.courses || []);
        } catch (err) {
            console.error('Error fetching instructor courses:', err);
            return [];
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.courses = model || [];
        controller.selectedCourses = []; // Reset visual selection state when visiting
        controller.isLoading = false;
        controller.isExporting = false;
        controller.isDeleting = false;
        controller.notification = null;
        controller.openDropdownId = null;
    }
}
