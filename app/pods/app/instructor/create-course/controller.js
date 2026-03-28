import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class CreateCourseController extends Controller {
    @service router;
    @service notification;

    @tracked sections = [];
    @tracked summary = '';

    @action
    addSection() {
        this.sections = [...this.sections, { title: '', lessons: [] }];
    }

    @action
    updateSectionTitle(index, event) {
        this.sections = this.sections.map((s, i) =>
            i === index ? { ...s, title: event.target.value } : s
        );
    }

    @action
    addLesson(sectionIndex) {
        this.sections = this.sections.map((s, i) =>
            i === sectionIndex
                ? { ...s, lessons: [...s.lessons, { title: '', video: '', resources: '' }] }
                : s
        );
    }

    @action
    updateLesson(sectionIndex, lessonIndex, field, event) {
        this.sections = this.sections.map((s, si) => {
            if (si !== sectionIndex) return s;
            return {
                ...s,
                lessons: s.lessons.map((l, li) => {
                    if (li !== lessonIndex) return l;
                    let updated = { ...l, [field]: event.target.value };
                    if (field === 'video') {
                        updated.videoEmbed = this.getEmbedUrl(event.target.value);
                    }
                    return updated;
                })
            };
        });
    }

    @action
    updateSummary(event) {
        this.summary = event.target.value;
    }

    getEmbedUrl(url) {
        try {
            if (!url) return '';
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                if (url.includes("youtu.be")) {
                    videoId = url.split("/").pop();
                } else {
                    videoId = new URL(url).searchParams.get("v");
                }
                return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch {
            return '';
        }
        return '';
    }

    @action
    async submitCourse() {
        const courseId = Number(this.model.courseId);

        try {
            let res = await apiRequest('/api/create-course-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, summary: this.summary, sections: this.sections })
            });
            let data = await res.json();
            if (data.success) {
                this.notification.success("Course content uploaded!");
                this.router.transitionTo('app.instructor.dashboard');
            } else {
                this.notification.error(data.message || "Failed to upload content.");
            }
        } catch (e) {
            this.notification.error("Error uploading course content.");
        }
    }
}
