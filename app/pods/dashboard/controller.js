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
  @action
  async enroll(courseId) {
    try {
      let response = await apiRequest('/enroll', {
        method: 'POST',
        body: JSON.stringify({ courseId })
      });

      let data = await response.json();
      alert(data.message || "Enrolled successfully!");
    } catch (err) {
      console.error("Enrollment failed:", err);
      alert("Something went wrong. Please try again.");
    }
  }
}