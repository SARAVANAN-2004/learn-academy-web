import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { apiRequest } from 'learn-academy-web/utils/api';

export default class TestAttemptController extends Controller {
    @service notification;
    @service router;

    @tracked attemptId = null;
    @tracked testId = null;
    @tracked testData = null;
    @tracked firstSectionId = null;

    @tracked activeSection = null;
    @tracked sections = [];
    @tracked questions = [];
    @tracked currentQuestionIndex = 0;

    @tracked remainingTimeSeconds = 0;
    timerInterval = null;

    @tracked showWarningModal = false;
    @tracked warningMessage = '';
    @tracked testStarted = false;
    @tracked isTestCompleted = false;
    @tracked isSubmitting = false;
    @tracked isLoadingSection = false;

    @tracked resultData = null;
    @tracked leaderboard = [];

    sectionResponseCache = new Map();
    isRegisteringViolation = false;
    ignoreFullscreenExit = false;
    lastViolationAt = 0;

    initializeTest(model) {
        this.cleanup();
        this.resetState();

        this.testId = model.testId;
        this.attemptId = model.attemptId;
        this.firstSectionId = model.firstSectionId;
        this.testData = {
            title: model.title || `Assessment #${model.testId}`,
            timeLimit: model.timeLimitMinutes || 60,
            totalSections: model.totalSections || 0,
            totalQuestions: model.totalQuestions || 0,
            status: model.status || 'IN_PROGRESS',
        };

        if (model.sections && model.sections.length > 0) {
            this.sections = model.sections.map((s, i) => ({
                id: s.id,
                title: s.title || `Section ${i + 1}`,
                questionCount: s.questions?.length || null,
            }));
        } else if (this.firstSectionId) {
            this.sections = [
                {
                    id: this.firstSectionId,
                    title: 'Section 1',
                    questionCount: null,
                },
            ];
        }

        this.setupEventListeners();
        this.primeInitialSection();
    }

    async primeInitialSection() {
        if (!this.firstSectionId || !this.attemptId) {
            return;
        }

        try {
            await this.loadSection(this.firstSectionId, {
                preserveQuestionIndex: true,
            });
        } catch (error) {
            console.warn('Initial section preload failed', error);
        }
    }

    resetState() {
        this.activeSection = null;
        this.sections = [];
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.remainingTimeSeconds = 0;
        this.showWarningModal = false;
        this.warningMessage = '';
        this.testStarted = false;
        this.isTestCompleted = false;
        this.isSubmitting = false;
        this.isLoadingSection = false;
        this.resultData = null;
        this.leaderboard = [];
        this.sectionResponseCache = new Map();
        this.isRegisteringViolation = false;
        this.ignoreFullscreenExit = false;
        this.localTabSwitchCount = 0;
    }

    get displayTitle() {
        return this.testData?.title || 'Test Attempt';
    }

    get currentQuestion() {
        if (!this.questions.length) return null;
        return this.questions[this.currentQuestionIndex];
    }

    get currentSectionId() {
        return this.activeSection?.id || null;
    }

    get hasPreviousQuestion() {
        return this.currentQuestionIndex > 0;
    }

    get hasNextQuestion() {
        return this.currentQuestionIndex < this.questions.length - 1;
    }

    get hasNextSection() {
        if (!this.activeSection) return false;
        let currentIndex = this.sections.findIndex((s) => s.id === this.activeSection.id);
        return currentIndex >= 0 && currentIndex < this.sections.length - 1;
    }

    get activeSectionStats() {
        let answered = 0, unanswered = 0, review = 0;
        for (let q of this.questions) {
            if (q._state.markedForReview) {
                review++;
            } else if (q._state.answered) {
                answered++;
            } else {
                unanswered++;
            }
        }
        return { answered, unanswered, review, total: this.questions.length };
    }

    get leaderboardRows() {
        return this.leaderboard || [];
    }

    get resultCorrect() {
        return this.resultData?.correct ?? 0;
    }

    get resultWrong() {
        return this.resultData?.wrong ?? 0;
    }

    get resultPercentage() {
        return this.resultData?.percentage ?? '---';
    }

    @action
    async startTestWithFullscreen() {
        this.testStarted = true;

        try {
            await document.documentElement.requestFullscreen?.();
        } catch (error) {
            console.warn('Could not enter fullscreen:', error);
        }

        if (!this.firstSectionId) {
            this.notification.error(
                'The test could not be started because no section was found.'
            );
            return;
        }

        await this.loadSection(this.firstSectionId);

        if (this.remainingTimeSeconds <= 0) {
            this.remainingTimeSeconds = (this.testData?.timeLimit || 60) * 60;
        }

        this.startTimer();
    }

    async parseError(response, fallbackMessage) {
        let payload = null;

        try {
            payload = await response.clone().json();
        } catch (jsonError) {
            try {
                payload = await response.text();
            } catch (textError) {
                payload = null;
            }
        }

        if (typeof payload === 'string' && payload.trim()) {
            return payload;
        }

        if (payload?.message) {
            return payload.message;
        }

        if (payload?.error) {
            return payload.error;
        }

        return fallbackMessage;
    }

    async ensureOk(response, fallbackMessage) {
        if (response.ok) {
            return response.json();
        }

        throw new Error(await this.parseError(response, fallbackMessage));
    }

    normalizeQuestion(question, paletteStatus) {
        let options = question.options || question.answerOptions || [];

        return {
            id: question.id,
            text: question.questionText || question.text || '',
            type: question.questionType || question.type,
            marks: question.marks,
            order: question.questionOrder || question.order,
            options: options.map((option) => ({
                id: option.id,
                text: option.optionText || option.text,
            })),
            _state: {
                userAnswer: {
                    selectedOptionId: question.savedSelectedOptionId || null,
                    textAnswer: question.savedTextAnswer || '',
                },
                selectedOptionId: question.savedSelectedOptionId || null,
                textAnswer: question.savedTextAnswer || '',
                markedForReview: Boolean(question.markedForReview),
                answered: Boolean(question.answered),
                paletteStatus:
                    paletteStatus || (question.answered ? 'ANSWERED' : 'NOT_ANSWERED'),
            },
        };
    }

    upsertSection(sectionData, fallbackTitle = null, questionCount = null) {
        let title =
            sectionData.sectionTitle ||
            fallbackTitle ||
            `Section ${this.sections.length + 1}`;
        let updated = false;

        this.sections = this.sections.map((section) => {
            if (section.id === sectionData.sectionId) {
                updated = true;
                return {
                    ...section,
                    title,
                    questionCount:
                        questionCount !== null ? questionCount : section.questionCount,
                };
            }

            return section;
        });

        if (!updated) {
            this.sections = [
                ...this.sections,
                { id: sectionData.sectionId, title, questionCount },
            ];
        }
    }

    ensureAdjacentSection(sectionId, fallbackIndex) {
        if (
            !sectionId ||
            this.sections.some((section) => section.id === sectionId)
        ) {
            return;
        }

        let insertTitle = `Section ${fallbackIndex}`;
        this.sections = [
            ...this.sections,
            { id: sectionId, title: insertTitle, questionCount: null },
        ];
    }

    applySectionData(sectionData) {
        let responseData = sectionData.section || sectionData;
        let paletteByQuestionId = new Map(
            (responseData.palette || []).map((item) => [item.questionId, item.status])
        );
        let responseQuestions = responseData.questions || [];

        this.upsertSection(
            responseData,
            this.activeSection?.title,
            responseQuestions.length
        );

        let currentIndex =
            this.sections.findIndex(
                (section) => section.id === responseData.sectionId
            ) + 1;

        this.ensureAdjacentSection(responseData.nextSectionId, currentIndex + 1);
        if (responseData.previousSectionId) {
            this.ensureAdjacentSection(
                responseData.previousSectionId,
                Math.max(currentIndex - 1, 1)
            );
        }

        this.activeSection = {
            id: responseData.sectionId,
            title:
                this.sections.find((section) => section.id === responseData.sectionId)
                    ?.title || responseData.sectionTitle,
            locked: Boolean(responseData.locked),
            nextSectionId: responseData.nextSectionId,
            previousSectionId: responseData.previousSectionId,
        };

        this.questions = responseQuestions.map((question) =>
            this.normalizeQuestion(question, paletteByQuestionId.get(question.id))
        );
        this.currentQuestionIndex = 0;
        this.remainingTimeSeconds =
            responseData.remainingTimeSeconds ?? this.remainingTimeSeconds;
        this.sectionResponseCache.set(responseData.sectionId, responseData);
    }

    @action
    async loadSection(sectionId, options = {}) {
        if (!sectionId || !this.attemptId) return;

        this.isLoadingSection = true;

        try {
            let response = await apiRequest(
                `/api/tests/${this.testId}/sections/${sectionId}?attemptId=${this.attemptId}&randomizeQuestions=false&randomizeOptions=false`
            );
            let sectionData = await this.ensureOk(
                response,
                'Failed to load section data.'
            );
            this.applySectionData(sectionData);
            if (options.preserveQuestionIndex) {
                this.currentQuestionIndex = 0;
            }
        } catch (error) {
            this.notification.error(error.message || 'Failed to load section data.');
            throw error;
        } finally {
            this.isLoadingSection = false;
        }
    }

    @action
    async submitAnswer(questionId, answerPayload) {
        try {
            let response = await apiRequest(
                `/api/tests/attempts/${this.attemptId}/answer`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        questionId,
                        ...answerPayload,
                    }),
                }
            );
            let savedAnswer = await this.ensureOk(response, 'Autosave failed.');
            this.updateQuestionState(questionId, {
                ...answerPayload,
                paletteStatus: savedAnswer.paletteStatus,
                answered: savedAnswer.answered,
                markedForReview: savedAnswer.markedForReview,
            });
        } catch (error) {
            this.notification.error(
                error.message || 'Autosave failed. Check connection.'
            );
        }
    }

    @action
    async markForReview(questionId, isMarked) {
        try {
            let response = await apiRequest(
                `/api/tests/attempts/${this.attemptId}/mark-review`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        questionId,
                        markedForReview: isMarked,
                    }),
                }
            );
            let savedAnswer = await this.ensureOk(
                response,
                'Failed to mark review status.'
            );
            this.updateQuestionState(questionId, {
                markedForReview: savedAnswer.markedForReview,
                paletteStatus: savedAnswer.paletteStatus,
            });
        } catch (error) {
            this.notification.error(error.message || 'Failed to mark review status.');
        }
    }

    updateQuestionState(questionId, data) {
        this.questions = this.questions.map((question) => {
            if (question.id !== questionId) {
                return question;
            }

            let nextSelectedOptionId =
                data.selectedOptionId !== undefined
                    ? data.selectedOptionId
                    : question._state.selectedOptionId;
            let nextTextAnswer =
                data.textAnswer !== undefined
                    ? data.textAnswer
                    : question._state.textAnswer;

            return {
                ...question,
                _state: {
                    ...question._state,
                    ...data,
                    userAnswer: {
                        selectedOptionId: nextSelectedOptionId,
                        textAnswer: nextTextAnswer,
                    },
                    selectedOptionId: nextSelectedOptionId,
                    textAnswer: nextTextAnswer,
                },
            };
        });
    }

    @action
    async completeSection() {
        if (!this.activeSection?.id) return;

        try {
            let response = await apiRequest(
                `/api/tests/attempts/${this.attemptId}/complete-section`,
                {
                    method: 'POST',
                    body: JSON.stringify({ sectionId: this.activeSection.id }),
                }
            );
            let completion = await this.ensureOk(
                response,
                'Failed to complete section.'
            );

            if (completion.nextSectionId) {
                await this.loadSection(completion.nextSectionId);
            } else {
                await this.submitTest();
            }
        } catch (error) {
            this.notification.error(error.message || 'Failed to complete section.');
        }
    }

    @action
    async submitTest() {
        if (this.isSubmitting || this.isTestCompleted) return;

        this.isSubmitting = true;

        try {
            let response = await apiRequest(
                `/api/tests/attempts/${this.attemptId}/submit`,
                { method: 'POST' }
            );
            this.resultData = await this.ensureOk(response, 'Failed to submit test.');
            this.notification.success('Test submitted successfully!');
        } catch (error) {
            this.notification.warning('Test submitted, but leaderboard calculation failed on the server.');
        }

        this.isTestCompleted = true;
        this.isSubmitting = false;
        this.cleanup();
        await this.fetchResultsAndLeaderboard();
    }

    async fetchResultsAndLeaderboard() {
        try {
            let resultResponse = await apiRequest(
                `/api/tests/${this.testId}/result/${this.attemptId}`
            );
            this.resultData = await this.ensureOk(
                resultResponse,
                'Failed to load test results.'
            );
            await this.fetchLeaderboard();
        } catch (error) {
            this.notification.error(error.message || 'Failed to load test results.');
        }
    }

    async fetchLeaderboard() {
        let leaderboardResponse = await apiRequest(
            `/api/tests/${this.testId}/leaderboard`
        );
        let leaderboardData = await this.ensureOk(
            leaderboardResponse,
            'Failed to load leaderboard.'
        );
        this.leaderboard = leaderboardData.leaderboard || [];
    }

    @action
    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestionIndex = index;
        }
    }

    @action
    nextQuestion() {
        if (this.hasNextQuestion) {
            this.currentQuestionIndex += 1;
        } else if (this.hasNextSection) {
            let currentIndex = this.sections.findIndex((s) => s.id === this.activeSection.id);
            this.loadSection(this.sections[currentIndex + 1].id);
        }
    }

    @action
    prevQuestion() {
        if (this.hasPreviousQuestion) {
            this.currentQuestionIndex -= 1;
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.remainingTimeSeconds > 0) {
                this.remainingTimeSeconds -= 1;
            } else {
                clearInterval(this.timerInterval);
                this.notification.error('Time is up! Auto-submitting...');
                this.submitTest();
            }
        }, 1000);
    }

    get formattedTime() {
        let minutes = Math.floor(this.remainingTimeSeconds / 60);
        let seconds = this.remainingTimeSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    }

    setupEventListeners() {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
        document.addEventListener('contextmenu', this.preventDefault);
        document.addEventListener('copy', this.preventDefault);
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('blur', this.handleWindowBlur);
        window.addEventListener('pagehide', this.handlePageHide);
    }

    cleanup() {
        document.removeEventListener(
            'visibilitychange',
            this.handleVisibilityChange
        );
        document.removeEventListener(
            'fullscreenchange',
            this.handleFullscreenChange
        );
        document.removeEventListener('contextmenu', this.preventDefault);
        document.removeEventListener('copy', this.preventDefault);
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('blur', this.handleWindowBlur);
        window.removeEventListener('pagehide', this.handlePageHide);

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.ignoreFullscreenExit = true;
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        }
    }

    @action
    preventDefault(event) {
        event.preventDefault();
    }

    @action
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (!this.testStarted || this.isTestCompleted) return;
            this.showWarningModal = true;
            this.warningMessage = "You pressed the Escape key! Please do not attempt to exit fullscreen mode during the test.";
            // The fullscreenchange listener will log an actual exit if the browser allows escape from fullscreen natively.
        }
    }

    async registerViolation(reason) {
        if (
            !this.testStarted ||
            this.isTestCompleted ||
            this.isRegisteringViolation ||
            !this.attemptId
        ) {
            return;
        }

        let now = Date.now();
        if (now - this.lastViolationAt < 1000) {
            return;
        }

        this.lastViolationAt = now;
        this.isRegisteringViolation = true;
        this.localTabSwitchCount = (this.localTabSwitchCount || 0) + 1;

        try {
            let response = await apiRequest(
                `/api/tests/attempts/${this.attemptId}/tab-switch`,
                { method: 'POST' }
            );
            let violation = await this.ensureOk(
                response,
                'Failed to record test violation.'
            );
            this.localTabSwitchCount = violation.tabSwitchCount || this.localTabSwitchCount;

            this.showWarningModal = true;
            this.warningMessage =
                reason === 'fullscreen'
                    ? `You exited fullscreen. This was recorded as violation ${this.localTabSwitchCount}.`
                    : `You switched tabs. This was recorded as violation ${this.localTabSwitchCount}.`;

            if (violation.autoSubmitted) {
                this.notification.error(
                    'The test was auto-submitted because the violation limit was exceeded.'
                );
                this.showWarningModal = false;
                await this.submitTest();
            }
        } catch (error) {
            // Show generic warning even if backend fails to save it
            this.showWarningModal = true;
            this.warningMessage =
                reason === 'fullscreen'
                    ? `You exited fullscreen. This is violation ${this.localTabSwitchCount}.`
                    : `You switched tabs. This is violation ${this.localTabSwitchCount}.`;

            // Local fallback logic since backend is failing to process tab violations
            if (this.localTabSwitchCount >= 3) {
                this.notification.error(
                    'The test was auto-submitted because the violation limit was exceeded.'
                );
                this.showWarningModal = false;
                await this.submitTest();
            }
        } finally {
            this.isRegisteringViolation = false;
        }
    }

    handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
            await this.registerViolation('tab');
        }
    };

    handleWindowBlur = async () => {
        await this.registerViolation('tab');
    };

    handlePageHide = async () => {
        await this.registerViolation('tab');
    };

    handleFullscreenChange = async () => {
        if (
            this.ignoreFullscreenExit ||
            !this.testStarted ||
            this.isTestCompleted
        ) {
            return;
        }

        if (!document.fullscreenElement) {
            await this.registerViolation('fullscreen');
        }
    };

    @action
    closeWarningModal() {
        this.showWarningModal = false;
        this.startTestWithFullscreen();
    }
}
