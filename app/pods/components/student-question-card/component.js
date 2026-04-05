import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class StudentQuestionCardComponent extends Component {
  get question() {
    return this.args.question;
  }

  get userAnswer() {
    return this.question?._state?.userAnswer || {};
  }

  @action
  selectOption(optionId) {
    if (this.args.onAnswer) {
      this.args.onAnswer(this.question.id, {
        selectedOptionId: optionId,
        textAnswer: '',
        answered: true,
      });
    }
  }

  @action
  selectTrueFalse(value) {
    if (this.args.onAnswer) {
      this.args.onAnswer(this.question.id, {
        selectedOptionId: null,
        textAnswer: value,
        answered: true,
      });
    }
  }

  @action
  inputFillAnswer(event) {
    if (this.args.onAnswer) {
      this.args.onAnswer(this.question.id, {
        selectedOptionId: null,
        textAnswer: event.target.value,
        answered: true,
      });
    }
  }
}
