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
    this.route('profile');
    this.route('view-course', { path: '/view-course/:course_id' });
    this.route('instructor', function () {
      this.route('dashboard');
      this.route('enrollment-steps', { path: '/enrollment-steps/:course_id' });
      this.route('create-course', { path: '/create-course/:course_id' });
      this.route('create-test');
      this.route('courses');
      this.route('tests', function () {
        this.route('view', { path: '/:testId' });
        this.route('edit', { path: '/:testId/edit' });
      });
      this.route('reports');
    });
    this.route('test-attempt', { path: '/test-attempt/:test_id' });
  });
});
