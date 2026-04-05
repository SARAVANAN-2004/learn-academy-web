import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';
import { tracked } from '@glimmer/tracking';

export default class DashboardController extends Controller {
  @service notification;
  queryParams = ['type'];
  @tracked type = 'all';

  get filteredModel() {
    let items = this.model || [];
    if (this.type === 'course') {
      return items.filter(i => !i.type || i.type.toUpperCase() !== 'TEST');
    } else if (this.type === 'test') {
      return items.filter(i => i.type && i.type.toUpperCase() === 'TEST');
    }
    return items;
  }

  @action
  setType(newType) {
    this.type = newType;
  }

  @action
  async logout() {
    await apiRequest('/logout', {
      method: 'POST'
    });

    window.location.href = '/login';
  }
  @action
  async enroll(courseId) {
    try {
      let response = await apiRequest('/enroll', {
        method: 'POST',
        body: JSON.stringify({ courseId })
      });

      let data = await response.json();
      this.notification.success(data.message || "Enrolled successfully!");
    } catch (err) {
      console.error("Enrollment failed:", err);
      this.notification.error("Something went wrong. Please try again.");
    }
  }
}