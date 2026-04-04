import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class AppProfileController extends Controller {
    @tracked isEditing = false;
    @tracked isSaving = false;
    @tracked notification = null;
    @tracked formData = {};

    get fullName() {
        if (this.model.firstName && this.model.lastName) {
            return `${this.model.firstName} ${this.model.lastName}`;
        }
        if (this.model.firstName) return this.model.firstName;
        if (this.model.lastName) return this.model.lastName;
        return 'User Profile';
    }

    get initials() {
        if (this.model.firstName && this.model.lastName) {
            return `${this.model.firstName.charAt(0)}${this.model.lastName.charAt(0)}`.toUpperCase();
        } else if (this.model.email && this.model.email !== 'Could not load profile') {
            return this.model.email.charAt(0).toUpperCase();
        }
        return '?';
    }

    @action
    toggleEdit() {
        if (!this.isEditing) {
            // Copy current model data into formData to make edits safely
            this.formData = {
                firstName: this.model.firstName || '',
                lastName: this.model.lastName || '',
                phoneNumber: this.model.phoneNumber || '',
                dateOfBirth: this.model.dateOfBirth ? this.model.dateOfBirth.split('T')[0] : '', // Format for date input if datetime
                gender: this.model.gender || '',
                profileImageUrl: this.model.profileImageUrl || '',
                bio: this.model.bio || '',
                addressLine1: this.model.addressLine1 || '',
                addressLine2: this.model.addressLine2 || '',
                city: this.model.city || '',
                state: this.model.state || '',
                country: this.model.country || '',
                postalCode: this.model.postalCode || ''
            };
        }
        this.isEditing = !this.isEditing;
    }

    @action
    cancelEdit() {
        this.isEditing = false;
        this.formData = {};
    }

    @action
    updateField(field, event) {
        this.formData = {
            ...this.formData,
            [field]: event.target.value
        };
    }

    @action
    async saveProfile(event) {
        event.preventDefault();
        this.isSaving = true;
        this.notification = null;

        try {
            const res = await apiRequest('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });

            const parsedData = await res.json().catch(() => this.formData);
            this.model = { ...this.model, ...this.formData, ...parsedData };

            this.notification = {
                type: 'success',
                message: 'Profile updated successfully!'
            };
            this.isEditing = false;
        } catch (error) {
            console.error(error);
            this.notification = {
                type: 'error',
                message: 'There was a problem updating your profile.'
            };
        } finally {
            this.isSaving = false;
            // Auto clear success message
            if (this.notification && this.notification.type === 'success') {
                setTimeout(() => {
                    this.notification = null;
                }, 4000);
            }
        }
    }

    @action
    dismissNotification() {
        this.notification = null;
    }
}
