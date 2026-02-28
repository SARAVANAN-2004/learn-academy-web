import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class BackToTopComponent extends Component {
  @tracked isVisible = false;

  @action
  setupScroll(element) {
    this.scrollListener = () => {
      if (window.scrollY > 300) {
        this.isVisible = true;
      } else {
        this.isVisible = false;
      }
    };
    window.addEventListener('scroll', this.scrollListener);
  }

  @action
  teardownScroll() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  @action
  scrollToTop(event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
