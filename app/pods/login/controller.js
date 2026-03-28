import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { apiRequest } from 'learn-academy-web/utils/api';
import config from 'learn-academy-web/config/environment';

export default class LoginController extends Controller {
  @service notification;

  @tracked email = '';
  @tracked password = '';
  @tracked message = '';
  @tracked isSignUpActive = false;

  @tracked signupUsername = '';
  @tracked signupEmail = '';
  @tracked signupPassword = '';

  @action
  updateEmail(e) {
    this.email = e.target.value;
  }

  @action
  updatePassword(e) {
    this.password = e.target.value;
  }

  @action
  updateSignupUsername(e) {
    this.signupUsername = e.target.value;
  }

  @action
  updateSignupEmail(e) {
    this.signupEmail = e.target.value;
  }

  @action
  updateSignupPassword(e) {
    this.signupPassword = e.target.value;
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
        window.location.href = '/app/dashboard';
      } else {
        let data = await response.json();
        this.message = data.message || 'Invalid credentials';
      }

    } catch (err) {
      this.message = 'Server error';
    }
  }

  @action
  async signupUser(e) {
    e.preventDefault();

    try {
      let response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: this.signupUsername,
          email: this.signupEmail,
          password: this.signupPassword
        })
      });

      if (response.ok) {
        let data = await response.json();
        console.log('Success:', data);
        this.notification.success('Sign up successful!');
        this.isSignUpActive = false;
      } else {
        let text = await response.text();
        this.message = `Server error: ${response.status} - ${text}`;
      }
    } catch (err) {
      this.message = `Error: ${err.message}`;
    }
  }

  @action
  googleLogin() {
    window.location.href =
      `${config.API_HOST}/oauth2/authorization/google`;
  }
}