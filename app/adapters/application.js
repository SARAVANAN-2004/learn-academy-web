import JSONAPIAdapter from '@ember-data/adapter/json-api';
import config from 'learn-academy-web/config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter {
  host = config.API_HOST;
  namespace = 'api';
}
