import Model, { attr } from '@ember-data/model';

export default class DashboardModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('number') price;
}
