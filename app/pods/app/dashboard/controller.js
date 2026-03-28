import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class DashboardController extends Controller {
  @service notification;

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