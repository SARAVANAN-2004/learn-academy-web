import Route from '@ember/routing/route';

export default class CreateCourseRoute extends Route {
    model(params) {
        return {
            courseId: params.course_id
        };
    }
}
