import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class CreateTestRoute extends Route {
  @service instructorApi;

  queryParams = {
    testId: { refreshModel: true }
  };

  async model(params) {
    let courses = [];
    let testData = null;

    try {
      let response = await apiRequest('/api/instructor/courses');
      if (response.ok) {
        let data = await response.json();
        courses = Array.isArray(data) ? data : data.courses || [];
      }
    } catch (error) {
      console.error('Failed to load instructor courses', error);
    }

    if (params.testId) {
      try {
        let response = await this.instructorApi.fetchTest(params.testId);
        if (response.ok) {
          testData = await response.json();
        }
      } catch (err) {
        console.error('Failed to load test data for editing', err);
      }
    }

    return { courses, testData };
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.courses = model?.courses || [];
    controller.initializeFromData(model?.testData);
  }
}
