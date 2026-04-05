import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class CreateTestSidebarComponent extends Component {
    get sections() {
        return this.args.sections || [];
    }

    get activeSectionId() {
        return this.args.activeSectionId;
    }

    @action
    onAddSection() {
        if (this.args.onAddSection) {
            this.args.onAddSection();
        }
    }

    @action
    onSelectSection(sectionId) {
        if (this.args.onSelectSection) {
            this.args.onSelectSection(sectionId);
        }
    }
}
