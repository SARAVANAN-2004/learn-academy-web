import Route from '@ember/routing/route';

export default class HomeRoute extends Route {
  model() {
    return {
      categories: [
        { name: 'Web Design', count: 49, image: '/assets/images/cat-1.jpg' },
        { name: 'Graphic Design', count: 49, image: '/assets/images/cat-2.jpg' },
        { name: 'Video Editing', count: 49, image: '/assets/images/cat-3.jpg' },
        { name: 'Online Marketing', count: 49, image: '/assets/images/cat-4.jpg' },
      ],
      courses: [
        {
          title: 'Web Design & Development Course for Beginners',
          price: '$149.00',
          reviews: 123,
          stars: [1, 2, 3, 4, 5],
          instructor: 'John Doe',
          duration: '1.49 Hrs',
          students: 30,
          image: '/assets/images/course-1.jpg',
        },
        {
          title: 'Excel Course for Beginners',
          price: '$149.00',
          reviews: 123,
          stars: [1, 2, 3, 4, 5],
          instructor: 'John Doe',
          duration: '1.49 Hrs',
          students: 30,
          image: '/assets/images/course-2.jpg',
        },
        {
          title: 'Data Analytics Course for Beginners',
          price: '$149.00',
          reviews: 123,
          stars: [1, 2, 3, 4, 5],
          instructor: 'John Doe',
          duration: '1.49 Hrs',
          students: 30,
          image: '/assets/images/course-3.jpg',
        },
      ],
      instructors: [
        {
          name: 'Instructor Name',
          designation: 'Designation',
          image: '/assets/images/team-1.jpg',
          social: { facebook: '', twitter: '', instagram: '' },
        },
        {
          name: 'Instructor Name',
          designation: 'Designation',
          image: '/assets/images/team-2.jpg',
          social: { facebook: '', twitter: '', instagram: '' },
        },
        {
          name: 'Instructor Name',
          designation: 'Designation',
          image: '/assets/images/team-3.jpg',
          social: { facebook: '', twitter: '', instagram: '' },
        },
        {
          name: 'Instructor Name',
          designation: 'Designation',
          image: '/assets/images/team-4.jpg',
          social: { facebook: '', twitter: '', instagram: '' },
        },
      ],
      testimonials: [
        {
          name: 'Client Name',
          role: 'Web Developer',
          text: 'This platform has completely transformed my learning experience! The courses are engaging, the instructors are knowledgeable, and the support is outstanding.',
          image: '/assets/images/testimonial-1.jpg',
        },
        {
          name: 'Client Name',
          role: 'Data Analyst',
          text: 'The flexibility of online classes and the quality of resources make this the best learning platform. Highly recommended.',
          image: '/assets/images/testimonial-2.jpg',
        },
        {
          name: 'Client Name',
          role: 'Graphic Designer',
          text: 'I gained practical skills that I could apply immediately. The instructors are truly experts in their fields.',
          image: '/assets/images/testimonial-3.jpg',
        },
        {
          name: 'Client Name',
          role: 'Software Engineer',
          text: 'The interactive lessons and expert guidance made learning so much easier. I feel more confident in my skills now.',
          image: '/assets/images/testimonial-4.jpg',
        },
      ],
    };
  }
}
