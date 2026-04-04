import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

class CourseWrapper {
    @tracked isExpanded = false;
    @tracked isSelected = false;
    constructor(course) {
        this.course = course;

        // Compute overall sections for dynamic columns
        this.enrolledUsers = (this.course.enrolledUsers || []).map(u => new EnrolledUserWrapper(u));
    }

    get sectionHeaders() {
        return this.course.sections || [];
    }
}

class EnrolledUserWrapper {
    constructor(user) {
        this.user = user;
        // Transform user section progress if needed
    }

    // Total lessons across all sections for this user
    get totalLessons() {
        if (!this.user.sections) return 0;
        return this.user.sections.reduce((sum, sec) => sum + (sec.totalLessons || 0), 0);
    }

    // Total completed lessons across all sections for this user
    get totalCompletedLessons() {
        if (!this.user.sections) return 0;
        return this.user.sections.reduce((sum, sec) => sum + (sec.completedLessons || 0), 0);
    }

    // Percentage of completion for the user
    get completionRatio() {
        const total = this.totalLessons;
        if (total === 0) return 0;
        return Math.round((this.totalCompletedLessons / total) * 100);
    }
}

export default class InstructorReportsController extends Controller {
    @tracked wrappedCourses = [];
    @tracked searchQuery = '';
    @tracked isExporting = false;
    @tracked notification = null;

    @action
    dismissNotification() {
        this.notification = null;
    }

    autoDismissNotification() {
        if (this.notification && this.notification.type === 'success') {
            setTimeout(() => {
                this.notification = null;
            }, 3500);
        }
    }

    @action
    initData(rawCourses) {
        this.searchQuery = '';
        this.wrappedCourses = rawCourses.map(c => new CourseWrapper(c));
    }

    @action
    updateSearch(event) {
        this.searchQuery = event.target.value;
    }

    @action
    stopPropagation(event) {
        event.stopPropagation();
    }

    get filteredCourses() {
        if (!this.searchQuery) return this.wrappedCourses;
        let q = this.searchQuery.toLowerCase();
        return this.wrappedCourses.filter(w => {
            return (w.course.courseName && w.course.courseName.toLowerCase().includes(q)) ||
                (w.course.courseCategory && w.course.courseCategory.toLowerCase().includes(q));
        });
    }

    get allSelected() {
        return this.filteredCourses.length > 0 && this.filteredCourses.every(w => w.isSelected);
    }

    @action
    toggleSelectAll(event) {
        let isChecked = event.target.checked;
        this.filteredCourses.forEach(w => w.isSelected = isChecked);
    }

    @action
    toggleCourseSelection(wrapper, event) {
        wrapper.isSelected = event.target.checked;
    }

    @action
    toggleRow(wrapper) {
        wrapper.isExpanded = !wrapper.isExpanded;
    }

    @action
    async removeUser(wrapper, userWrapper) {
        let confirmDel = confirm(`Are you sure you want to remove ${userWrapper.user.name || 'this user'} from the course?`);
        if (!confirmDel) return;

        let courseId = wrapper.course.id || wrapper.course.courseId;
        let userId = userWrapper.user.id || userWrapper.user.userId;

        try {
            let res = await apiRequest(`/api/instructor/courses/${courseId}/users/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                this.notification = { type: 'success', message: 'User successfully removed from the course.' };
                this.autoDismissNotification();
                // Remove from local wrapped state instantly
                wrapper.enrolledUsers = wrapper.enrolledUsers.filter(u => u !== userWrapper);
            } else {
                throw new Error("Failed to delete");
            }
        } catch (e) {
            console.error(e);
            this.notification = { type: 'error', message: 'Failed to remove user from course' };
            this.autoDismissNotification();
        }
    }

    @action
    async exportReport(format) {
        let selectedWrappers = this.wrappedCourses.filter(w => w.isSelected);
        if (selectedWrappers.length === 0) {
            alert("Please select at least one course to export.");
            return;
        }

        let courseIds = selectedWrappers.map(w => w.course.id || w.course.courseId);

        this.isExporting = true;
        try {
            let res = await apiRequest(`/api/instructor/course-report/export?format=${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseIds })
            });

            if (!res.ok) throw new Error("Export failed");

            let blob = await res.blob();
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = `instructor-report.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            this.notification = { type: 'success', message: 'Export downloaded successfully!' };
        } catch (e) {
            console.error(e);
            this.notification = { type: 'error', message: 'Error generating export' };
        } finally {
            this.isExporting = false;
            this.autoDismissNotification();
        }
    }
}
