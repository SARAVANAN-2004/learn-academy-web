import Controller from '@ember/controller';
import { action } from '@ember/object';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class DashboardController extends Controller {

  @action
  async logout() {
    await apiRequest('/logout', {
      method: 'POST'
    });

    window.location.href = '/login';
  }
}