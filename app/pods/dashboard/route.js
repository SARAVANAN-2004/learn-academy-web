import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class DashboardRoute extends Route {

  async beforeModel() {
    let res = await apiRequest('/api/auth/me');

    if (res.status === 401) {
      this.transitionTo('login');
    }
  }

  async model() {
    let res = await apiRequest('/api/auth/me');
    return res.json();
  }
}