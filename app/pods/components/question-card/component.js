import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class QuestionCardComponent extends Component {
  get question() {
    return this.args.question || {};
  }

  get displayIndex() {
    return Number(this.args.index || 0) + 1;
  }

  get questionTypes() {
    return ['MCQ', 'TRUE_FALSE', 'FILL'];
  }

  @action
  onUpdateField(field, event) {
    if (this.args.onUpdateQuestion) {
      this.args.onUpdateQuestion(this.question.id, field, event.target.value);
    }
  }

  @action
  onUpdateOption(optionIndex, field, event) {
    if (this.args.onUpdateOption) {
      let value =
        field === 'isCorrect' ? event.target.checked : event.target.value;
      this.args.onUpdateOption(this.question.id, optionIndex, field, value);
    }
  }

  @action
  onAddOption() {
    if (this.args.onAddOption) {
      this.args.onAddOption(this.question.id);
    }
  }
}
