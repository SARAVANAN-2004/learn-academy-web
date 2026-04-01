import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorDashboardRoute extends Route {

  async model() {
    let res = await apiRequest('/api/instructor-dashboard');
    let data = await res.json();

    return data;
  }

}