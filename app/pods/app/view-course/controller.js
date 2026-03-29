import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class ViewCourseController extends Controller {
    @tracked currentLesson = null;
    @tracked progress = [];

    get progressMap() {
        let map = {};
        this.progress.forEach(p => {
            map[p.lesson_id] = p.completed;
        });
        return map;
    }

    get embedVideoUrl() {
        if (!this.currentLesson || !this.currentLesson.video) return '';

        try {
            let url = new URL(this.currentLesson.video);
            let videoId = '';

            if (url.hostname === 'youtu.be') {
                videoId = url.pathname.slice(1);
            } else if (url.hostname.includes('youtube.com')) {
                videoId = url.searchParams.get('v');
            }

            if (videoId) {
                // 🔥 FORCE reload using timestamp
                return htmlSafe(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`);
            }
        } catch (e) {
            console.error(e);
        }

        return '';
    }

    @action
    selectLesson(lesson) {
        this.currentLesson = null;
        setTimeout(() => {
            this.currentLesson = lesson;
        }, 0);
    }

    isLessonCompleted(lessonId) {
        return this.progress.some(p => p.lesson_id === lessonId && p.completed);
    }

    @action
    async toggleLesson(lesson, event) {
        let checked = event.target.checked;
        let lessonId = lesson.lesson_id;

        if (checked) {
            this.progress = [...this.progress, { lesson_id: lessonId, completed: true }];
        } else {
            this.progress = this.progress.filter(p => p.lesson_id !== lessonId);
        }

        try {
            await apiRequest('/api/toggle-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: this.model.courseDetails.id,
                    lessonId: lessonId,
                    completed: checked
                })
            });
        } catch (e) {
            console.error('API Error:', e);
        }
    }

    @action
    async logout() {
        await apiRequest('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    }
}
