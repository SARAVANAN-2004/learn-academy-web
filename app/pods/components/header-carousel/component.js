import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class HeaderCarouselComponent extends Component {
  @tracked currentSlide = 0;
  timer = null;

  slides = [
    {
      image: '/assets/images/carousel-1.jpg',
      title: 'The Best Online Learning Platform',
      subtitle: 'Best Online Courses',
      description:
        'Join the best online courses and learn at your own pace from top educators worldwide.'
    },
    {
      image: '/assets/images/carousel-2.jpg',
      title: 'Get Educated Online From Your Home',
      subtitle: 'Best Online Courses',
      description:
        'Join the best online courses and learn at your own pace from top educators worldwide.'
    }
  ];

  get translateValue() {
    return `translateX(-${this.currentSlide * 100}%)`;
  }

  @action
  setupCarousel() {
    this.timer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  @action
  teardownCarousel() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  @action
  nextSlide() {
    this.currentSlide =
      (this.currentSlide + 1) % this.slides.length;
  }

  @action
  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) %
      this.slides.length;
  }
}