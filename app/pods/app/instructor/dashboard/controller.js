import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Chart from 'chart.js/auto';

const FONT = { family: "'Inter', 'DM Sans', sans-serif", size: 12 };

const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1f2937',
            bodyColor: '#4b5563',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: { ...FONT, weight: '600' },
            bodyFont: FONT,
            displayColors: false
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: '#6b7280', font: FONT },
            border: { display: false },
        },
        y: {
            grid: { display: false },
            ticks: { color: '#6b7280', font: FONT },
            border: { display: false },
        },
    },
};

function makeGradient(ctx, colorTop, colorBottom) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    return gradient;
}

export default class InstructorDashboardController extends Controller {
    @service router;

    get roundedAvgCompletion() {
        const val = this.model?.avgCompletion;
        if (val == null) return '0';
        return Math.round(val * 10) / 10;
    }

    @action
    setupCharts() {
        if (this._chartsInitialized) return;

        const data = this.model;
        if (!data || !data.courseAnalytics?.length) return;

        const titles = data.courseAnalytics.map(c => c.title);
        const students = data.courseAnalytics.map(c => c.students);
        const completed = data.courseAnalytics.map(c => c.completedLessons);

        // Student Growth (Line)
        const sGrowth = data.studentGrowth || [];
        const growthLabels = sGrowth.map((_, i) => `T${i + 1}`);
        const ctxGrowth = document.getElementById('growthChart');
        if (ctxGrowth) {
            new Chart(ctxGrowth, {
                type: 'line',
                data: {
                    labels: growthLabels,
                    datasets: [{
                        data: sGrowth,
                        borderColor: '#6c63ff',
                        borderWidth: 3,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#6c63ff',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: baseOptions
            });
        }

        // Engagement Trend (Area)
        const eTrend = data.engagementTrend || [];
        const eLabels = eTrend.map((_, i) => `T${i + 1}`);
        const ctxEngagement = document.getElementById('engagementChart');
        if (ctxEngagement) {
            new Chart(ctxEngagement, {
                type: 'line',
                data: {
                    labels: eLabels,
                    datasets: [{
                        data: eTrend,
                        borderColor: '#00c9a7',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        backgroundColor: (ctx) => {
                            const { ctx: c, chartArea: a } = ctx.chart;
                            return a ? makeGradient(c, 'rgba(0,201,167,0.4)', 'rgba(0,201,167,0.0)') : 'rgba(0,201,167,0.2)';
                        }
                    }]
                },
                options: baseOptions
            });
        }

        // Students per Course (Bar)
        const ctxStudents = document.getElementById('studentsChart');
        if (ctxStudents) {
            new Chart(ctxStudents, {
                type: 'bar',
                data: {
                    labels: titles,
                    datasets: [{
                        data: students,
                        backgroundColor: '#6c63ff',
                        borderRadius: 6,
                    }]
                },
                options: baseOptions
            });
        }

        // Completed Lessons (Bar)
        const ctxCompleted = document.getElementById('completedChart');
        if (ctxCompleted) {
            new Chart(ctxCompleted, {
                type: 'bar',
                data: {
                    labels: titles,
                    datasets: [{
                        data: completed,
                        backgroundColor: '#00c9a7',
                        borderRadius: 6,
                    }]
                },
                options: baseOptions
            });
        }

        // Overall Completion (Doughnut)
        const ctxCompletion = document.getElementById('completionChart');
        if (ctxCompletion) {
            new Chart(ctxCompletion, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Remaining'],
                    datasets: [{
                        data: [
                            data.completedLessons || 0,
                            (data.totalLessons || 0) - (data.completedLessons || 0)
                        ],
                        backgroundColor: ['#6c63ff', '#e5e7eb'],
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: baseOptions.plugins.tooltip,
                    },
                },
            });
        }

        this._chartsInitialized = true;
    }

    @action
    goToEnrollment() {
        this.router.transitionTo('app.instructor.enrollment-steps');
    }
}