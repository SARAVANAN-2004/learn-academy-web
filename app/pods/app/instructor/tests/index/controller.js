import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorTestsIndexController extends Controller {
    @service instructorApi;
    @service notification;
    @service router;

    @tracked tests = [];
    @tracked isExporting = false;
    @tracked isDeleting = false;
    @tracked testToDelete = null;
    @tracked showDeleteModal = false;
    @tracked showBulkDeleteModal = false;

    @tracked openDropdownId = null;
    @tracked selectedTestIds = [];

    @action
    dismissNotification() {
        if (this.notification && typeof this.notification.clear === 'function') {
            this.notification.clear();
        } else {
            // Assume it manually sets tracked properties if service exposes message and type directly
            this.notification.message = null;
            this.notification.type = null;
        }
    }

    get testsWithSelection() {
        return this.tests.map(test => {
            return {
                ...test,
                isSelected: this.selectedTestIds.includes(test.id)
            };
        });
    }

    get selectedTests() {
        return this.tests.filter(t => this.selectedTestIds.includes(t.id));
    }

    get allSelected() {
        return this.tests.length > 0 && this.selectedTests.length === this.tests.length;
    }

    get exportPayload() {
        return { testIds: this.selectedTestIds };
    }

    @action
    toggleDropdown(testId, event) {
        if (event) {
            event.stopPropagation();
        }
        if (this.openDropdownId === testId) {
            this.openDropdownId = null;
        } else {
            this.openDropdownId = testId;
        }
    }

    @action
    toggleSelection(testId, event) {
        if (event) event.stopPropagation();
        if (this.selectedTestIds.includes(testId)) {
            this.selectedTestIds = this.selectedTestIds.filter(id => id !== testId);
        } else {
            this.selectedTestIds = [...this.selectedTestIds, testId];
        }
    }

    @action
    toggleSelectAll(event) {
        if (event) event.stopPropagation();
        if (this.allSelected) {
            this.selectedTestIds = [];
        } else {
            this.selectedTestIds = this.tests.map(t => t.id);
        }
    }

    @action
    confirmDelete(test) {
        this.testToDelete = test;
        this.showDeleteModal = true;
    }

    @action
    cancelDelete() {
        this.testToDelete = null;
        this.showDeleteModal = false;
    }

    @action
    confirmBulkDelete() {
        if (!this.selectedTestIds || this.selectedTestIds.length === 0) {
            this.notification.error('No tests selected to delete.');
            return;
        }
        this.showBulkDeleteModal = true;
    }

    @action
    cancelBulkDelete() {
        this.showBulkDeleteModal = false;
    }

    @action
    async executeBulkDelete() {
        if (!this.selectedTestIds || this.selectedTestIds.length === 0) return;
        this.isDeleting = true;
        try {
            let response = await apiRequest('/api/instructor/tests/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ testIds: this.selectedTestIds })
            });
            if (response.ok) {
                this.notification.success(`${this.selectedTestIds.length} tests deleted successfully.`);
                this.tests = this.tests.filter(t => !this.selectedTestIds.includes(t.id));
                this.selectedTestIds = [];
            } else {
                throw new Error('Bulk deletion failed on server.');
            }
        } catch (err) {
            console.error('Error in bulk deleting tests:', err);
            this.notification.error('Failed to bulk delete tests. Please try again.');
        } finally {
            this.isDeleting = false;
            this.showBulkDeleteModal = false;
        }
    }

    @action
    async executeDelete() {
        if (!this.testToDelete) return;
        this.isDeleting = true;
        try {
            let response = await this.instructorApi.deleteTest(this.testToDelete.id);
            if (response.ok) {
                this.notification.success('Test deleted successfully.');
                // Optimistically remove from UI
                this.tests = this.tests.filter(t => t.id !== this.testToDelete.id);
            } else {
                throw new Error('Deletion failed on server.');
            }
        } catch (err) {
            console.error('Error deleting test:', err);
            this.notification.error('Failed to delete test. Please try again.');
        } finally {
            this.isDeleting = false;
            this.showDeleteModal = false;
            this.testToDelete = null;
        }
    }

}

