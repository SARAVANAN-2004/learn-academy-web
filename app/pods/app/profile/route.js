import Route from '@ember/routing/route';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class AppProfileRoute extends Route {
    async model() {
        try {
            let res = await apiRequest('/api/profile');
            let data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            // Return a basic structure so the template can still render properly
            return {
                id: null,
                email: 'Could not load profile',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                dateOfBirth: '',
                gender: '',
                profileImageUrl: null,
                bio: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                country: '',
                postalCode: ''
            };
        }
    }

    setupController(controller, model) {
        super.setupController(controller, model);
        controller.isEditing = false;
        controller.notification = null;
        controller.isSaving = false;
    }
}
