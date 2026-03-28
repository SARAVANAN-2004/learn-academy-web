import EmberRouter from '@ember/routing/router';
import config from 'learn-academy-web/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('home', { path: '/' });
  this.route('signup');
  this.route('login');

  this.route('app', function () {
    this.route('dashboard');
    this.route('mylearning');
    this.route('view-course', { path: '/view-course/:course_id' });
  });
});
