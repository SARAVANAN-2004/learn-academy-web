import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class SiteNavbarComponent extends Component {
  scrollListener = null;

  @action
  setupSticky(element) {
    this.scrollListener = () => {
      if (window.scrollY > 300) {
        element.style.top = '0px';
      } else {
        element.style.top = '-100px';
      }
    };

    window.addEventListener('scroll', this.scrollListener);
  }

  @action
  teardownSticky() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  @action
  scrollTo(sectionId,event) {
    event.preventDefault(); 
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}