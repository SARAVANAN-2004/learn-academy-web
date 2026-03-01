import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { apiRequest } from 'learn-academy-web/utils/api';
import config from 'learn-academy-web/config/environment';

export default class LoginController extends Controller {

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
  async login(e) {
    e.preventDefault();

    try {
      let response = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      });

      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        let data = await response.json();
        this.message = data.message || 'Invalid credentials';
      }

    } catch (err) {
      this.message = 'Server error';
    }
  }

  @action
  googleLogin() {
    window.location.href =
      `${config.API_HOST}/oauth2/authorization/google`;
  }
}