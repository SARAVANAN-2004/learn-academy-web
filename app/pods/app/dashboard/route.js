import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class DashboardRoute extends Route {

  queryParams = {
    type: { refreshModel: true }
  };

  async beforeModel() {
    let res = await apiRequest('/api/auth/me');

    if (res.status === 401) {
      this.transitionTo('login');
    }
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.isLoading = false;
  }

  async model(params) {
    // We can't easily show skeleton for the initial load via model hook without a bit more complexity,
    // but we can show it for subsequent filter changes by setting isLoading in the action.
    let url = '/api/dashboard';
    if (params.type && params.type !== 'all') {
      url += `?type=${params.type}`;
    }
    let res = await apiRequest(url);
    let data = await res.json();
    // Support generic items array or fallback
    return data.items || data.courses || data.tests || [];
  }
}