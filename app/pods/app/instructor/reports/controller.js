import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { apiRequest } from 'learn-academy-web/utils/api';

class CourseWrapper {
    @tracked isExpanded = false;
    @tracked isSelected = false;
    @tracked enrolledUsers = [];
    constructor(course) {
        this.course = course;

        this.enrolledUsers = (this.course.enrolledUsers || []).map(
            (u) => new EnrolledUserWrapper(u)
        );
    }

    get sectionHeaders() {
        return this.course.sections || [];
    }

    get isTest() {
        return (
            typeof this.course.type === 'string' &&
            this.course.type.toUpperCase() === 'TEST'
        );
    }

    get itemId() {
        return this.course.id || this.course.courseId || this.course.testId;
    }

    get displayTitle() {
        return (
            this.course.courseName ||
            this.course.testTitle ||
            this.course.title ||
            'Untitled'
        );
    }

    get avgProgress() {
        if (!this.enrolledUsers || this.enrolledUsers.length === 0) return 0;

        if (this.isTest) {
            let usersWithAttempts = this.enrolledUsers.filter(u => (u.user.attemptsCount || 0) > 0).length;
            return Math.round((usersWithAttempts / this.enrolledUsers.length) * 100);
        }

        let sum = this.enrolledUsers.reduce((acc, user) => acc + user.completionRatio, 0);
        return Math.round(sum / this.enrolledUsers.length);
    }
}

class EnrolledUserWrapper {
    constructor(user) {
        this.user = user;
    }

    get userId() {
        return this.user.id || this.user.userId;
    }

    get displayName() {
        return (
            this.user.userName || this.user.name || this.user.email || 'this user'
        );
    }

    // Total lessons across all sections for this user
    get totalLessons() {
        if (!this.user.sections) return 0;
        return this.user.sections.reduce(
            (sum, sec) => sum + (sec.totalLessons || 0),
            0
        );
    }

    // Total completed lessons across all sections for this user
    get totalCompletedLessons() {
        if (!this.user.sections) return 0;
        return this.user.sections.reduce(
            (sum, sec) => sum + (sec.completedLessons || 0),
            0
        );
    }

    // Percentage of completion for the user
    get completionRatio() {
        const total = this.totalLessons;
        if (total === 0) return 0;
        return Math.round((this.totalCompletedLessons / total) * 100);
    }

    // Test specific properties
    get isTest() {
        return (
            this.user.bestScore !== undefined || this.user.attemptsCount !== undefined
        );
    }

    get displayScore() {
        if (this.isTest) {
            return `Score: ${this.user.bestScore || 0}`;
        }
        return `${this.completionRatio}%`;
    }
}

export default class InstructorReportsController extends Controller {
    queryParams = ['type'];
    @tracked type = 'all';

    @tracked wrappedCourses = [];
    @tracked searchQuery = '';
    @tracked isExporting = false;
    @tracked notification = null;

    @action
    setType(newType) {
        this.type = newType;
    }

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
    initData(rawItems) {
        this.searchQuery = '';
        this.wrappedCourses = rawItems.map((c) => new CourseWrapper(c));
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
        let items = this.wrappedCourses;
        if (this.type === 'course') {
            items = items.filter(
                (w) => !w.course.type || w.course.type.toUpperCase() !== 'TEST'
            );
        } else if (this.type === 'test') {
            items = items.filter(
                (w) => w.course.type && w.course.type.toUpperCase() === 'TEST'
            );
        }

        if (!this.searchQuery) return items;
        let q = this.searchQuery.toLowerCase();
        return items.filter((w) => {
            let name =
                w.course.courseName || w.course.testTitle || w.course.title || '';
            let cat = w.course.courseCategory || '';
            return name.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
        });
    }

    get allSelected() {
        return (
            this.filteredCourses.length > 0 &&
            this.filteredCourses.every((w) => w.isSelected)
        );
    }

    @action
    toggleSelectAll(event) {
        let isChecked = event.target.checked;
        this.filteredCourses.forEach((w) => (w.isSelected = isChecked));
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
        let itemType = wrapper.isTest ? 'test' : 'course';
        let confirmDel = confirm(
            `Are you sure you want to remove ${userWrapper.displayName} from the ${itemType}?`
        );
        if (!confirmDel) return;

        let itemId = wrapper.itemId;
        let userId = userWrapper.userId;
        let endpoint = wrapper.isTest
            ? `/api/instructor/tests/${itemId}/users/${userId}`
            : `/api/instructor/courses/${itemId}/users/${userId}`;

        try {
            let res = await apiRequest(endpoint, {
                method: 'DELETE',
            });

            if (res.ok) {
                this.notification = {
                    type: 'success',
                    message: `User successfully removed from the ${itemType}.`,
                };
                this.autoDismissNotification();
                wrapper.enrolledUsers = wrapper.enrolledUsers.filter(
                    (u) => u !== userWrapper
                );
            } else {
                let errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Failed to remove user from the ${itemType}.`
                );
            }
        } catch (e) {
            console.error(e);
            this.notification = {
                type: 'error',
                message: e.message || `Failed to remove user from the ${itemType}.`,
            };
            this.autoDismissNotification();
        }
    }

    get exportPayload() {
        let selectedWrappers = this.wrappedCourses.filter((w) => w.isSelected);
        let courseIds = selectedWrappers
            .filter((w) => !w.isTest)
            .map((w) => w.itemId);
        let testIds = selectedWrappers.filter((w) => w.isTest).map((w) => w.itemId);
        return { courseIds, testIds };
    }
}
