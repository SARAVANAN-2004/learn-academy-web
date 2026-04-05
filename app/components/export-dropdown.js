import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class ExportDropdownComponent extends Component {
    @service notification;
    @tracked isOpen = false;
    @tracked isExporting = false;

    @action
    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    @action
    closeDropdown() {
        this.isOpen = false;
    }

    @action
    async exportData(format) {
        let endpoint = this.args.endpoint;
        let payload = this.args.payload || {};
        this.isOpen = false;

        let filename = 'export.' + format;
        if (endpoint.includes('course-report')) {
            filename = 'course-report.' + format;
        } else if (endpoint.includes('tests')) {
            filename = 'tests.' + format;
        }

        this.isExporting = true;
        this.notification.success('Export started...');

        try {
            let res = await apiRequest(`${endpoint}?format=${format}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Export failed");

            let blob = await res.blob();
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            this.notification.success('Download ready!');
        } catch (err) {
            console.error('Export error:', err);
            this.notification.error('Export failed. Please try again.');
        } finally {
            this.isExporting = false;
        }
    }
}
