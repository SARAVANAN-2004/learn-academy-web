import Route from '@ember/routing/route';

export default class DashboardRoute extends Route {
  model() {
    debugger;
    return this.store.query('dashboard', {
      userId: 13,
    });
  }
}
