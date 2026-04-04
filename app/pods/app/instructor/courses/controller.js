import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorCoursesController extends Controller {
    @tracked courses = [];
    @tracked selectedCourses = [];

    @tracked isLoading = false;
    @tracked isExporting = false;
    @tracked isDeleting = false;
    @tracked notification = null;

    @tracked openDropdownId = null;

    get allSelected() {
        return this.courses.length > 0 && this.selectedCourses.length === this.courses.length;
    }

    get someSelected() {
        return this.selectedCourses.length > 0 && this.selectedCourses.length < this.courses.length;
    }

    get coursesWithSelection() {
        return this.courses.map(course => ({
            ...course,
            isSelected: this.selectedCourses.includes(course.id)
        }));
    }

    @action
    toggleSelectAll(event) {
        const isChecked = event.target.checked;
        if (isChecked) {
            this.selectedCourses = this.courses.map(c => c.id);
        } else {
            this.selectedCourses = [];
        }
    }

    @action
    toggleSelection(courseId, event) {
        const isChecked = event.target.checked;
        if (isChecked) {
            if (!this.selectedCourses.includes(courseId)) {
                this.selectedCourses = [...this.selectedCourses, courseId];
            }
        } else {
            this.selectedCourses = this.selectedCourses.filter(id => id !== courseId);
        }
    }

    @action
    toggleDropdown(courseId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (this.openDropdownId === courseId) {
            this.openDropdownId = null;
        } else {
            this.openDropdownId = courseId;
        }

        // Setup document click listener to close dropdown when clicking outside
        if (this.openDropdownId) {
            const closeListener = () => {
                this.openDropdownId = null;
                document.removeEventListener('click', closeListener);
            };
            // Use setTimeout to avoid immediate trigger capturing the current click
            setTimeout(() => {
                document.addEventListener('click', closeListener);
            }, 0);
        }
    }

    @action
    async bulkDelete() {
        if (!this.selectedCourses.length) return;

        if (!confirm(`Are you sure you want to completely delete ${this.selectedCourses.length} course(s)?`)) {
            return;
        }

        this.isDeleting = true;
        this.notification = null;

        try {
            const res = await apiRequest('/api/instructor/courses', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseIds: this.selectedCourses })
            });

            if (!res.ok) {
                // Explicit Fallback check noted by user specification
                const fallbackRes = await apiRequest('/api/instructor/courses/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseIds: this.selectedCourses })
                });

                if (!fallbackRes.ok) {
                    throw new Error('Bulk deletion failed using both DELETE and POST fallback.');
                }
            }

            // Remove successfully deleted courses locally
            this.courses = this.courses.filter(c => !this.selectedCourses.includes(c.id));
            this.selectedCourses = [];
            this.notification = { type: 'success', message: 'Selected courses have been deleted successfully.' };
        } catch (error) {
            console.error(error);
            this.notification = { type: 'error', message: 'Failed to delete selected courses. Please try again.' };
        } finally {
            this.isDeleting = false;
            this.autoDismissNotification();
        }
    }

    @action
    async deleteSingle(courseId) {
        if (!confirm('Are you certain you want to delete this specific course?')) return;

        this.isDeleting = true;
        this.openDropdownId = null;

        try {
            const res = await apiRequest(`/api/instructor/courses/${courseId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Failed to delete single course');
            }

            this.courses = this.courses.filter(c => c.id !== courseId);
            this.selectedCourses = this.selectedCourses.filter(id => id !== courseId);
            this.notification = { type: 'success', message: 'Course was deleted.' };
        } catch (error) {
            console.error(error);
            this.notification = { type: 'error', message: 'An error occurred while deleting the course.' };
        } finally {
            this.isDeleting = false;
            this.autoDismissNotification();
        }
    }

    @action
    async exportCourses(format) {
        if (!this.selectedCourses.length) return;

        this.isExporting = true;
        this.notification = null;

        try {
            const res = await apiRequest(`/api/instructor/courses/export?format=${format}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseIds: this.selectedCourses })
            });

            if (!res.ok) {
                throw new Error(`Failed to export using format ${format}`);
            }

            // Handle blob parsing explicitly
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            // Generate phantom anchor tag and click to download cleanly
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `instructor_courses_export_${new Date().getTime()}.${format}`;
            document.body.appendChild(a);
            a.click();

            // Clean DOM payload memory
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            this.notification = { type: 'success', message: `Export to ${format.toUpperCase()} triggered successfully.` };
        } catch (error) {
            console.error(error);
            this.notification = { type: 'error', message: `Export to ${format.toUpperCase()} failed.` };
        } finally {
            this.isExporting = false;
            this.autoDismissNotification();
        }
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
}
