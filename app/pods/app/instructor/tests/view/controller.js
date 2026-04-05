import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class InstructorTestsViewController extends Controller {
    @tracked test;
    @tracked activeTab = 'overview';

    get isOverview() { return this.activeTab === 'overview'; }
    get isQuestions() { return this.activeTab === 'questions'; }
    get isAnalytics() { return this.activeTab === 'analytics'; }

    @action
    setTab(tab) {
        this.activeTab = tab;
    }
}
