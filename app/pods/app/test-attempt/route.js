import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class TestAttemptRoute extends Route {
    @service notification;
    @service router;

    async model(params) {
        let testId = params.test_id;

        try {
            let response = await apiRequest(`/api/tests/${testId}/start`, {
                method: 'POST',
            });

            if (!response.ok) {
                let errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to start test.');
            }

            let data = await response.json();

            let sections = [];
            try {
                let detailsRes = await apiRequest(`/api/tests/${testId}`);
                if (detailsRes.ok) {
                    let details = await detailsRes.json();
                    sections = details.sections || [];
                }
            } catch (e) {
                console.warn('Could not fetch all test sections initially', e);
            }

            return {
                testId,
                attemptId: data.attemptId,
                sections,
                firstSectionId: data.firstSectionId,
                totalSections: data.totalSections,
                totalQuestions: data.totalQuestions,
                timeLimitMinutes: data.timeLimitMinutes,
                status: data.status,
                startedAt: data.startedAt,
            };
        } catch (error) {
            console.error(error);
            this.notification.error(
                error.message || 'Could not launch the test environment.'
            );
            this.router.transitionTo('app.dashboard');
            return null;
        }
    }

    setupController(controller, model) {
        if (!model) return;
        super.setupController(controller, model);
        controller.initializeTest(model);
    }

    resetController(controller, isExiting) {
        if (isExiting) {
            controller.cleanup();
        }
    }
}
