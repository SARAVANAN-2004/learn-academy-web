import Service from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class InstructorApiService extends Service {
    // Tests
    async createTest(testData) {
        return await apiRequest('/api/instructor/tests', {
            method: 'POST',
            body: JSON.stringify(testData),
        });
    }

    async fetchTests() {
        return await apiRequest('/api/instructor/tests', {
            method: 'GET',
        });
    }

    async fetchTest(testId) {
        return await apiRequest(`/api/instructor/tests/${testId}`, {
            method: 'GET',
        });
    }

    async editTest(testId, testData) {
        return await apiRequest(`/api/instructor/tests/${testId}`, {
            method: 'PUT',
            body: JSON.stringify(testData),
        });
    }

    async deleteTest(testId) {
        return await apiRequest(`/api/instructor/tests/${testId}`, {
            method: 'DELETE',
        });
    }

    async exportTests(format = 'csv', testIds = null) {
        return await apiRequest(`/api/instructor/tests/export?format=${format}`, {
            method: 'POST',
            body: testIds ? JSON.stringify({ testIds }) : null
        });
    }

    // Sections
    async createSection(testId, sectionData) {
        return await apiRequest(`/api/instructor/tests/${testId}/sections`, {
            method: 'POST',
            body: JSON.stringify(sectionData),
        });
    }

    // Questions
    async createQuestion(sectionId, questionData) {
        return await apiRequest(`/api/instructor/sections/${sectionId}/questions`, {
            method: 'POST',
            body: JSON.stringify(questionData),
        });
    }

    // Options (for MCQ)
    async addOption(questionId, optionData) {
        return await apiRequest(`/api/instructor/questions/${questionId}/options`, {
            method: 'POST',
            body: JSON.stringify(optionData),
        });
    }
}
