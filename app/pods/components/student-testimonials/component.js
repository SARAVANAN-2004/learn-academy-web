import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class StudentTestimonialsComponent extends Component {
  @tracked currentIndex = 0;
  timer = null;

  container = null;

  @action
  setupCarousel(element) {
    this.container = element;

    this.timer = setInterval(() => {
      this.nextSlide();
    }, 4000);
  }

  @action
  teardownCarousel() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  @action
  nextSlide() {
    if (!this.args.testimonials) return;

    this.currentIndex =
      (this.currentIndex + 1) % this.args.testimonials.length;

    if (this.container) {
      const cardWidth = 374; // 350 + gap
      this.container.scrollTo({
        left: this.currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  }
}