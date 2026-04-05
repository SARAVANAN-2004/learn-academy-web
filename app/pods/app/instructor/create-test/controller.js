import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class CreateTestController extends Controller {
    @service notification;
    @service router;
    @service instructorApi;

    queryParams = ['testId'];
    @tracked testId = null;

    // Test Meta
    @tracked selectedCourseId = '';
    @tracked title = '';
    @tracked description = '';
    @tracked timeLimit = 60;
    @tracked hasNegativeMarking = false;
    @tracked negativeMarkValue = 0;
    @tracked isStrictMode = false;
    @tracked maxTabSwitches = 0;
    @tracked courses = [];

    // Structure
    @tracked sections = [];
    @tracked activeSectionId = null;
    @tracked isSubmitting = false;

    constructor() {
        super(...arguments);
        this.initializeFromDraft();
    }

    initializeFromDraft() {
        this.resetFormState();
        this.loadDraft();

        if (this.sections.length === 0) {
            this.addSection();
        } else if (
            !this.activeSectionId ||
            !this.sections.find((section) => section.id === this.activeSectionId)
        ) {
            this.activeSectionId = this.sections[0]?.id || null;
        }
    }

    initializeFromData(testData) {
        if (testData) {
            this.clearDraft();
            this.testId = testData.id;
            this.selectedCourseId = testData.course?.id || testData.courseId || '';
            this.title = testData.title || testData.testTitle || '';
            this.description = testData.description || '';
            this.timeLimit = testData.timeLimit || 60;
            this.hasNegativeMarking = testData.negativeMarkingEnabled || testData.hasNegativeMarking || false;
            this.negativeMarkValue = testData.negativeMarkValue || 0;
            this.isStrictMode = testData.strictModeEnabled || testData.isStrictMode || false;
            this.maxTabSwitches = testData.maxTabSwitch || testData.maxTabSwitches || 0;

            if (testData.sections && testData.sections.length > 0) {
                this.sections = testData.sections.map(sec => ({
                    id: sec.id || crypto.randomUUID(),
                    title: sec.sectionTitle || sec.title || `Section`,
                    questions: (sec.questions || []).map(q => ({
                        id: q.id || crypto.randomUUID(),
                        text: q.questionText || q.text || '',
                        type: q.questionType || q.type || 'MCQ',
                        marks: q.marks || 1,
                        explanation: q.explanation || '',
                        options: (q.options || []).map(opt => ({
                            id: opt.id || crypto.randomUUID(),
                            text: opt.optionText || opt.text || '',
                            isCorrect: !!opt.isCorrect
                        })),
                        correctAnswer: q.correctAnswer || ''
                    }))
                }));
            } else {
                this.sections = [];
            }
        } else {
            this.testId = null;
            this.initializeFromDraft();
        }

        if (this.sections.length === 0) {
            this.addSection();
        } else if (
            !this.activeSectionId ||
            !this.sections.find((section) => section.id === this.activeSectionId)
        ) {
            this.activeSectionId = this.sections[0]?.id || null;
        }
    }

    resetFormState() {
        this.selectedCourseId = '';
        this.title = '';
        this.description = '';
        this.timeLimit = 60;
        this.hasNegativeMarking = false;
        this.negativeMarkValue = 0;
        this.isStrictMode = false;
        this.maxTabSwitches = 0;
        this.sections = [];
        this.activeSectionId = null;
        this.isSubmitting = false;
    }

    // --- Actions for Test Meta ---
    @action
    updateMeta(field, event) {
        let val =
            event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;

        if (field === 'selectedCourseId') {
            val = val === '' ? '' : Number(val);
        }

        if (['timeLimit', 'negativeMarkValue', 'maxTabSwitches'].includes(field)) {
            val = val === '' ? '' : Number(val);
        }

        this[field] = val;
        this.saveDraft();
    }

    // --- Actions for Sections ---
    @action
    addSection() {
        let newSection = {
            id: crypto.randomUUID(),
            title: `Section ${this.sections.length + 1}`,
            questions: [],
        };
        this.sections = [...this.sections, newSection];
        this.activeSectionId = newSection.id;
        this.saveDraft();
    }

    @action
    selectSection(sectionId) {
        this.activeSectionId = sectionId;
    }

    @action
    removeSection(sectionId) {
        if (this.sections.length <= 1) {
            this.notification.error('A test must have at least one section.');
            return;
        }

        let newSections = this.sections.filter(
            (section) => section.id !== sectionId
        );
        this.sections = newSections;

        if (this.activeSectionId === sectionId) {
            this.activeSectionId = newSections[0]?.id || null;
        }

        this.saveDraft();
    }

    @action
    updateSectionTitle(event) {
        if (!this.activeSectionId) return;

        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                return { ...section, title: event.target.value };
            }

            return section;
        });

        this.saveDraft();
    }

    // --- Actions for Questions ---
    @action
    addQuestion() {
        if (!this.activeSectionId) return;

        let newQuestion = {
            id: crypto.randomUUID(),
            text: '',
            type: 'MCQ',
            marks: 1,
            explanation: '',
            options: [
                { id: crypto.randomUUID(), text: '', isCorrect: true },
                { id: crypto.randomUUID(), text: '', isCorrect: false },
            ],
            correctAnswer: '',
        };

        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                return { ...section, questions: [...section.questions, newQuestion] };
            }

            return section;
        });

        this.saveDraft();
    }

    @action
    updateQuestion(questionId, field, value) {
        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                let updatedQuestions = section.questions.map((question) => {
                    if (question.id === questionId) {
                        if (field === 'type') {
                            if (value === 'TRUE_FALSE') {
                                return {
                                    ...question,
                                    type: value,
                                    correctAnswer: question.correctAnswer != null && question.correctAnswer !== '' ? String(question.correctAnswer) : 'true',
                                };
                            }

                            if (value === 'FILL') {
                                return {
                                    ...question,
                                    type: value,
                                    correctAnswer:
                                        question.type === 'FILL' ? question.correctAnswer : '',
                                };
                            }

                            if (value === 'MCQ') {
                                return {
                                    ...question,
                                    type: value,
                                    correctAnswer: '',
                                    options:
                                        question.options?.length >= 2
                                            ? question.options
                                            : [
                                                {
                                                    id: crypto.randomUUID(),
                                                    text: '',
                                                    isCorrect: true,
                                                },
                                                {
                                                    id: crypto.randomUUID(),
                                                    text: '',
                                                    isCorrect: false,
                                                },
                                            ],
                                };
                            }
                        }

                        return {
                            ...question,
                            [field]: field === 'marks' ? Number(value) : value,
                        };
                    }

                    return question;
                });

                return { ...section, questions: updatedQuestions };
            }

            return section;
        });

        this.saveDraft();
    }

    @action
    removeQuestion(questionId) {
        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                return {
                    ...section,
                    questions: section.questions.filter(
                        (question) => question.id !== questionId
                    ),
                };
            }

            return section;
        });

        this.saveDraft();
    }

    @action
    addOption(questionId) {
        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                let updatedQuestions = section.questions.map((question) => {
                    if (question.id === questionId) {
                        let newOption = {
                            id: crypto.randomUUID(),
                            text: '',
                            isCorrect: false,
                        };
                        return { ...question, options: [...question.options, newOption] };
                    }

                    return question;
                });

                return { ...section, questions: updatedQuestions };
            }

            return section;
        });

        this.saveDraft();
    }

    @action
    updateOption(questionId, optionIndex, field, value) {
        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                let updatedQuestions = section.questions.map((question) => {
                    if (question.id === questionId) {
                        let updatedOptions = [...question.options];

                        if (field === 'isCorrect') {
                            updatedOptions = updatedOptions.map((option, index) => ({
                                ...option,
                                isCorrect: index === optionIndex,
                            }));
                        } else {
                            updatedOptions[optionIndex] = {
                                ...updatedOptions[optionIndex],
                                [field]: value,
                            };
                        }

                        return { ...question, options: updatedOptions };
                    }

                    return question;
                });

                return { ...section, questions: updatedQuestions };
            }

            return section;
        });

        this.saveDraft();
    }

    @action
    removeOption(questionId, optionIndex) {
        this.sections = this.sections.map((section) => {
            if (section.id === this.activeSectionId) {
                let updatedQuestions = section.questions.map((question) => {
                    if (question.id === questionId) {
                        if (question.options.length <= 2) {
                            this.notification.error(
                                'MCQ questions must have at least two options.'
                            );
                            return question;
                        }

                        let updatedOptions = question.options.filter(
                            (option, index) => index !== optionIndex
                        );

                        if (
                            !updatedOptions.some((option) => option.isCorrect) &&
                            updatedOptions[0]
                        ) {
                            updatedOptions[0] = { ...updatedOptions[0], isCorrect: true };
                        }

                        return { ...question, options: updatedOptions };
                    }

                    return question;
                });

                return { ...section, questions: updatedQuestions };
            }

            return section;
        });

        this.saveDraft();
    }

    // --- Draft Handling ---
    saveDraft() {
        let draft = {
            selectedCourseId: this.selectedCourseId,
            title: this.title,
            description: this.description,
            timeLimit: this.timeLimit,
            hasNegativeMarking: this.hasNegativeMarking,
            negativeMarkValue: this.negativeMarkValue,
            isStrictMode: this.isStrictMode,
            maxTabSwitches: this.maxTabSwitches,
            sections: this.sections,
        };

        try {
            localStorage.setItem(
                'instructor_create_test_draft',
                JSON.stringify(draft)
            );
        } catch (error) {
            console.warn('Could not save draft');
        }
    }

    @action
    saveDraftManual() {
        this.saveDraft();
        this.notification.success('Draft saved successfully!');
    }

    @action
    cancel() {
        this.clearDraft();
        this.resetFormState();
        this.addSection();
        this.router.transitionTo('app.instructor.dashboard');
    }

    loadDraft() {
        try {
            let draftStr = localStorage.getItem('instructor_create_test_draft');
            if (draftStr) {
                let draft = JSON.parse(draftStr);
                this.selectedCourseId = draft.selectedCourseId ?? '';
                this.title = draft.title || '';
                this.description = draft.description || '';
                this.timeLimit = draft.timeLimit || 60;
                this.hasNegativeMarking = draft.hasNegativeMarking || false;
                this.negativeMarkValue = draft.negativeMarkValue || 0;
                this.isStrictMode = draft.isStrictMode || false;
                this.maxTabSwitches = draft.maxTabSwitches || 0;

                if (draft.sections && draft.sections.length > 0) {
                    this.sections = draft.sections;
                    this.activeSectionId = draft.sections[0].id;
                }
            }
        } catch (error) {
            console.warn('Could not load draft');
        }
    }

    clearDraft() {
        localStorage.removeItem('instructor_create_test_draft');
    }

    // --- API Submission Flow ---
    get activeSection() {
        if (!this.activeSectionId) return null;
        return this.sections.find((section) => section.id === this.activeSectionId);
    }

    get totalMarks() {
        return this.sections.reduce((sectionTotal, section) => {
            return (
                sectionTotal +
                section.questions.reduce(
                    (questionTotal, question) => questionTotal + (question.marks || 0),
                    0
                )
            );
        }, 0);
    }

    validateForm() {
        if (!this.title.trim()) {
            this.notification.error('Test title is required');
            return false;
        }

        if (
            !Number.isFinite(Number(this.timeLimit)) ||
            Number(this.timeLimit) <= 0
        ) {
            this.notification.error('Time limit must be greater than 0.');
            return false;
        }

        if (
            this.hasNegativeMarking &&
            (!Number.isFinite(Number(this.negativeMarkValue)) ||
                Number(this.negativeMarkValue) < 0)
        ) {
            this.notification.error('Negative mark value must be 0 or greater.');
            return false;
        }

        if (
            this.isStrictMode &&
            (!Number.isFinite(Number(this.maxTabSwitches)) ||
                Number(this.maxTabSwitches) < 0)
        ) {
            this.notification.error('Max tab switches must be 0 or greater.');
            return false;
        }

        if (this.sections.length === 0) {
            this.notification.error('At least one section is required');
            return false;
        }

        for (let section of this.sections) {
            if (!section.title.trim()) {
                this.notification.error('All sections must have a title');
                return false;
            }

            if (section.questions.length === 0) {
                this.notification.error(`Section "${section.title}" has no questions`);
                return false;
            }

            for (let question of section.questions) {
                if (!question.text.trim()) {
                    this.notification.error('All questions must have text');
                    return false;
                }

                if (
                    !Number.isFinite(Number(question.marks)) ||
                    Number(question.marks) <= 0
                ) {
                    this.notification.error(
                        `Question "${question.text}" must have marks greater than 0.`
                    );
                    return false;
                }

                if (question.type === 'MCQ') {
                    if (!question.options || question.options.length < 2) {
                        this.notification.error(
                            `Question "${question.text}" must have at least two options.`
                        );
                        return false;
                    }

                    if (question.options.some((option) => !option.text.trim())) {
                        this.notification.error(
                            `All options in "${question.text}" must have text.`
                        );
                        return false;
                    }

                    if (
                        question.options.filter((option) => option.isCorrect).length !== 1
                    ) {
                        this.notification.error(
                            `Question "${question.text}" must have exactly one correct option.`
                        );
                        return false;
                    }
                } else {
                    let ansStr = question.correctAnswer != null ? String(question.correctAnswer).trim() : '';
                    if (!ansStr) {
                        this.notification.error(
                            `Question "${question.text}" must have a correct answer.`
                        );
                        return false;
                    }
                }
            }
        }

        return true;
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

    @action
    async createTest() {
        if (!this.validateForm()) return;

        this.isSubmitting = true;

        try {
            let testPayload = {
                courseId: this.selectedCourseId ? Number(this.selectedCourseId) : null,
                title: this.title.trim(),
                description: this.description.trim(),
                timeLimit: Number(this.timeLimit),
                negativeMarkingEnabled: this.hasNegativeMarking,
                negativeMarkValue: this.hasNegativeMarking
                    ? Number(this.negativeMarkValue)
                    : 0,
                strictModeEnabled: this.isStrictMode,
                maxTabSwitch: this.isStrictMode ? Number(this.maxTabSwitches) : 0,
                totalMarks: this.totalMarks,
            };

            if (this.testId) {
                await this.instructorApi.editTest(this.testId, testPayload);
                this.notification.success('Test updated successfully! Note: Only test meta details were safely updated.');
            } else {
                let testRes = await this.instructorApi.createTest(testPayload);
                let testData = await this.ensureOk(testRes, 'Failed to create test');
                let createdTestId = testData.id;

                for (let [sectionIndex, section] of this.sections.entries()) {
                    let sectionRes = await this.instructorApi.createSection(createdTestId, {
                        title: section.title.trim(),
                        sectionOrder: sectionIndex + 1,
                    });
                    let sectionData = await this.ensureOk(
                        sectionRes,
                        `Failed to create section ${section.title}`
                    );
                    let createdSectionId = sectionData.id;

                    for (let [questionIndex, question] of section.questions.entries()) {
                        let questionPayload = {
                            questionText: question.text.trim(),
                            questionType: question.type,
                            marks: Number(question.marks),
                            explanation: question.explanation?.trim() || '',
                            questionOrder: questionIndex + 1,
                        };

                        if (question.type !== 'MCQ') {
                            let ansStr = question.correctAnswer != null ? String(question.correctAnswer).trim() : '';
                            questionPayload.correctAnswer = ansStr;
                        }

                        let questionRes = await this.instructorApi.createQuestion(
                            createdSectionId,
                            questionPayload
                        );
                        let questionData = await this.ensureOk(
                            questionRes,
                            `Failed to create question "${question.text}"`
                        );
                        let createdQuestionId = questionData.id;

                        if (question.type === 'MCQ') {
                            for (let option of question.options) {
                                let optionRes = await this.instructorApi.addOption(
                                    createdQuestionId,
                                    {
                                        optionText: option.text.trim(),
                                        isCorrect: option.isCorrect,
                                    }
                                );
                                await this.ensureOk(
                                    optionRes,
                                    `Failed to create options for question "${question.text}"`
                                );
                            }
                        }
                    }
                }
                this.notification.success('Test created successfully!');
            }

            this.clearDraft();
            this.resetFormState();
            this.router.transitionTo('app.instructor.tests');
        } catch (error) {
            console.error(error);
            this.notification.error(`Error saving test. ${error.message}`);
        } finally {
            this.isSubmitting = false;
        }
    }
}
