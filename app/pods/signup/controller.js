import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { apiRequest } from 'learn-academy-web/utils/api';
import config from 'learn-academy-web/config/environment';

export default class SignupController extends Controller {

  @tracked email = '';
  @tracked password = '';
  @tracked message = '';

  @action
  updateEmail(e) {
    this.email = e.target.value;
  }

  @action
  updatePassword(e) {
    this.password = e.target.value;
  }

  @action
  async signup(e) {
    e.preventDefault();

    try {
      let response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      });

      let data = await response.json();

      if (response.ok) {
        this.message = "Signup successful! Please login.";
      } else {
        this.message = data.message || "Signup failed.";
      }

    } catch (error) {
      this.message = "Server error";
    }
  }

  @action
  googleLogin() {
    window.location.href =
      `${config.API_HOST}/oauth2/authorization/google`;
  }
}