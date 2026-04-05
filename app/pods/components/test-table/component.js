import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class TestTableComponent extends Component {
    @action
    sortTests(field) {
        // Simple mock sort action if needed
    }
}
