<template>
    <q-page class="main-page" id="">
        <!-- Welcome Banner -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <q-card flat bordered class="welcome-banner gradient-teacher text-white q-pa-md">
                    <div class="row items-center">
                        <div class="col-12 col-md-8">
                            <div class="text-h5 text-weight-bold q-mb-xs">
                                <q-icon name="school" size="sm" class="q-mr-sm" />
                                Welcome Back, Teacher {{ auth.user?.firstname || '' }}!
                            </div>
                            <p class="text-body2 q-mb-none">
                                Manage your classes, schedules, and student progress
                            </p>
                        </div>
                        <div class="col-12 col-md-4 text-right">
                            <q-btn
                                rounded
                                outline
                                color="white"
                                icon="event"
                                label="Schedule Class"
                                no-caps
                                unelevated
                                to="/scheduler/add"
                                class="q-mt-sm q-mt-md-none"
                            />
                        </div>
                    </div>
                </q-card>
            </div>
        </section>

        <!-- Stats Overview -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-md">
                    <!-- Total Classes Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <record-count api-path="components_data/getcount_teacherclasses" max="" v-slot="record">
                            <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                                <q-card-section class="text-center">
                                    <q-icon name="class" size="48px" color="primary" />
                                    <div class="text-h5 text-weight-bold q-mt-sm">
                                        <span v-if="!record.loading">{{ record.num || dashboardData.totalClasses }}</span>
                                        <q-spinner v-else size="24px" color="primary" />
                                    </div>
                                    <div class="text-caption text-grey-7">Total Classes</div>
                                </q-card-section>
                            </q-card>
                        </record-count>
                    </div>

                    <!-- Active Students Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <record-count api-path="components_data/getcount_activestudents" max="" v-slot="record">
                            <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                                <q-card-section class="text-center">
                                    <q-icon name="people" size="48px" color="positive" />
                                    <div class="text-h5 text-weight-bold q-mt-sm">
                                        <span v-if="!record.loading">{{ record.num || dashboardData.activeStudents }}</span>
                                        <q-spinner v-else size="24px" color="positive" />
                                    </div>
                                    <div class="text-caption text-grey-7">Active Students</div>
                                    <q-badge v-if="dashboardData.weeklyGrowth > 0" color="positive" class="q-mt-sm">
                                        +{{ dashboardData.weeklyGrowth }} this week
                                    </q-badge>
                                </q-card-section>
                            </q-card>
                        </record-count>
                    </div>

                    <!-- Upcoming Sessions Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="event_available" size="48px" color="orange" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.dashboard">{{ dashboardData.upcomingSessions }}</span>
                                    <q-spinner v-else size="24px" color="orange" />
                                </div>
                                <div class="text-caption text-grey-7">Upcoming Sessions</div>
                                <q-linear-progress
                                    v-if="!loading.dashboard"
                                    :value="dashboardData.upcomingSessions / 10"
                                    color="orange"
                                    class="q-mt-sm"
                                />
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Completion Rate Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="task_alt" size="48px" color="secondary" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.dashboard">{{ dashboardData.completionRate }}%</span>
                                    <q-spinner v-else size="24px" color="secondary" />
                                </div>
                                <div class="text-caption text-grey-7">Completion Rate</div>
                                <q-circular-progress
                                    v-if="!loading.dashboard"
                                    :value="dashboardData.completionRate"
                                    size="40px"
                                    :thickness="0.15"
                                    color="secondary"
                                    track-color="grey-3"
                                    class="q-mt-sm"
                                    show-value
                                >
                                    <div class="text-caption">{{ dashboardData.completionRate }}%</div>
                                </q-circular-progress>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick Actions -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="text-h6 text-weight-medium q-mb-md">
                    <q-icon name="bolt" class="q-mr-xs" />
                    Quick Actions
                </div>
                <div class="row q-col-gutter-md">
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/scheduler/add"
                        >
                            <div class="column items-center">
                                <q-icon name="add_circle" size="32px" color="primary" />
                                <div class="text-caption q-mt-xs">New Schedule</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/scheduler"
                        >
                            <div class="column items-center">
                                <q-icon name="calendar_month" size="32px" color="secondary" />
                                <div class="text-caption q-mt-xs">View Schedule</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            @click="startLiveClass"
                        >
                            <div class="column items-center">
                                <q-icon name="videocam" size="32px" color="positive" />
                                <div class="text-caption q-mt-xs">Start Class</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            @click="viewStudents"
                        >
                            <div class="column items-center">
                                <q-icon name="groups" size="32px" color="orange" />
                                <div class="text-caption q-mt-xs">Students</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            @click="viewReports"
                        >
                            <div class="column items-center">
                                <q-icon name="assessment" size="32px" color="info" />
                                <div class="text-caption q-mt-xs">Reports</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            @click="refreshDashboard"
                        >
                            <div class="column items-center">
                                <q-icon name="refresh" size="32px" color="grey-7" />
                                <div class="text-caption q-mt-xs">Refresh</div>
                            </div>
                        </q-btn>
                    </div>
                </div>
            </div>
        </section>

        <!-- Today's Schedule & Class Stats -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-md">
                    <!-- Today's Schedule -->
                    <div class="col-12 col-md-8">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-primary text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="today" class="q-mr-xs" />
                                    Today's Schedule
                                </div>
                            </q-card-section>
                            <q-card-section>
                                <template v-if="!loading.schedule">
                                    <q-list separator>
                                        <q-item
                                            v-for="(session, index) in todaySessions"
                                            :key="index"
                                            clickable
                                            v-ripple
                                        >
                                            <q-item-section avatar>
                                                <q-avatar :color="session.color" text-color="white" :icon="session.icon" />
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">{{ session.title }}</q-item-label>
                                                <q-item-label caption>
                                                    {{ session.grade }} - {{ session.subject }}
                                                </q-item-label>
                                            </q-item-section>
                                            <q-item-section side>
                                                <q-item-label caption>{{ session.time }}</q-item-label>
                                                <q-chip
                                                    :color="session.statusColor"
                                                    text-color="white"
                                                    dense
                                                    size="sm"
                                                >
                                                    {{ session.status }}
                                                </q-chip>
                                            </q-item-section>
                                            <q-item-section side>
                                                <q-btn
                                                    flat
                                                    dense
                                                    round
                                                    icon="videocam"
                                                    color="primary"
                                                    @click="joinClass(session)"
                                                >
                                                    <q-tooltip>Join Class</q-tooltip>
                                                </q-btn>
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                    <div v-if="todaySessions.length === 0" class="text-center q-pa-lg text-grey-7">
                                        <q-icon name="event_busy" size="48px" />
                                        <div class="q-mt-sm">No classes scheduled for today</div>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="primary" />
                                        <p class="text-caption text-grey q-mt-sm">Loading schedule...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Class Statistics -->
                    <div class="col-12 col-md-4">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-secondary text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="bar_chart" class="q-mr-xs" />
                                    Class Statistics
                                </div>
                            </q-card-section>
                            <q-card-section>
                                <template v-if="!loading.stats">
                                    <div class="row q-col-gutter-sm">
                                        <div class="col-12">
                                            <div class="stat-box text-center q-pa-md bg-blue-1 rounded-borders">
                                                <q-icon name="schedule" size="32px" color="primary" />
                                                <div class="text-h6 text-weight-bold text-primary q-mt-sm">
                                                    {{ classStats.weeklyClasses }}
                                                </div>
                                                <div class="text-caption text-grey-7">Classes This Week</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="stat-box text-center q-pa-md bg-green-1 rounded-borders">
                                                <q-icon name="check_circle" size="32px" color="positive" />
                                                <div class="text-h6 text-weight-bold text-positive q-mt-sm">
                                                    {{ classStats.completedClasses }}
                                                </div>
                                                <div class="text-caption text-grey-7">Completed</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="stat-box text-center q-pa-md bg-orange-1 rounded-borders">
                                                <q-icon name="pending" size="32px" color="orange" />
                                                <div class="text-h6 text-weight-bold text-orange q-mt-sm">
                                                    {{ classStats.pendingClasses }}
                                                </div>
                                                <div class="text-caption text-grey-7">Pending</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="stat-box text-center q-pa-md bg-purple-1 rounded-borders">
                                                <q-icon name="timer" size="32px" color="purple" />
                                                <div class="text-h6 text-weight-bold text-purple q-mt-sm">
                                                    {{ classStats.avgDuration }} min
                                                </div>
                                                <div class="text-caption text-grey-7">Avg Duration</div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="secondary" />
                                        <p class="text-caption text-grey q-mt-sm">Loading stats...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Performance Overview & Recent Activity -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-md">
                    <!-- Performance Overview -->
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-info text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="trending_up" class="q-mr-xs" />
                                    Performance Overview
                                </div>
                            </q-card-section>
                            <q-card-section>
                                <template v-if="!loading.performance">
                                    <div class="q-mb-md">
                                        <div class="text-subtitle2 text-weight-medium q-mb-xs">Student Engagement</div>
                                        <q-linear-progress
                                            :value="performanceData.studentEngagement / 100"
                                            color="positive"
                                            size="20px"
                                        >
                                            <div class="absolute-full flex flex-center">
                                                <q-badge color="white" text-color="positive" :label="`${performanceData.studentEngagement}%`" />
                                            </div>
                                        </q-linear-progress>
                                    </div>
                                    <div class="q-mb-md">
                                        <div class="text-subtitle2 text-weight-medium q-mb-xs">Attendance Rate</div>
                                        <q-linear-progress
                                            :value="performanceData.attendanceRate / 100"
                                            color="primary"
                                            size="20px"
                                        >
                                            <div class="absolute-full flex flex-center">
                                                <q-badge color="white" text-color="primary" :label="`${performanceData.attendanceRate}%`" />
                                            </div>
                                        </q-linear-progress>
                                    </div>
                                    <div class="q-mb-md">
                                        <div class="text-subtitle2 text-weight-medium q-mb-xs">Content Completion</div>
                                        <q-linear-progress
                                            :value="performanceData.contentCompletion / 100"
                                            color="secondary"
                                            size="20px"
                                        >
                                            <div class="absolute-full flex flex-center">
                                                <q-badge color="white" text-color="secondary" :label="`${performanceData.contentCompletion}%`" />
                                            </div>
                                        </q-linear-progress>
                                    </div>
                                    <div>
                                        <div class="text-subtitle2 text-weight-medium q-mb-xs">Student Satisfaction</div>
                                        <q-linear-progress
                                            :value="performanceData.studentSatisfaction / 100"
                                            color="amber"
                                            size="20px"
                                        >
                                            <div class="absolute-full flex flex-center">
                                                <q-badge color="white" text-color="amber-9" :label="`${performanceData.studentSatisfaction}%`" />
                                            </div>
                                        </q-linear-progress>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="info" />
                                        <p class="text-caption text-grey q-mt-sm">Loading performance...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Recent Activity -->
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-orange text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="history" class="q-mr-xs" />
                                    Recent Activity
                                </div>
                            </q-card-section>
                            <q-card-section class="q-pa-none">
                                <template v-if="!loading.activity">
                                    <q-timeline color="primary" class="q-pa-md">
                                        <q-timeline-entry
                                            v-for="(activity, index) in recentActivity"
                                            :key="index"
                                            :icon="activity.icon"
                                            :color="activity.color"
                                            :subtitle="activity.time"
                                        >
                                            <div class="text-weight-medium">{{ activity.title }}</div>
                                            <div class="text-caption text-grey-7">{{ activity.description }}</div>
                                        </q-timeline-entry>
                                    </q-timeline>
                                    <div v-if="recentActivity.length === 0" class="text-center q-pa-lg text-grey-7">
                                        <q-icon name="history" size="48px" />
                                        <div class="q-mt-sm">No recent activity</div>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="orange" />
                                        <p class="text-caption text-grey q-mt-sm">Loading activity...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Schedule List Section -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="text-h6 text-weight-medium q-mb-md">
                    <q-icon name="calendar_today" class="q-mr-xs" />
                    Your Schedule
                </div>
                <q-card flat bordered class="shadow-2">
                    <div class="reset-grid">
                        <teachersscheduler-scheduler-page
                            ref="schedulerListPage"
                            :limit="10"
                            :show-header="false"
                            :show-breadcrumbs="false"
                            :show-footer="true"
                            :paginate="true"
                            page-store-key="TEACHER-DASHBOARD-SCHEDULER"
                            is-sub-page
                        />
                    </div>
                </q-card>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth.js';
import { ApiService } from 'src/services/api';
import teachersschedulerSchedulerPage from "../scheduler/teachersscheduler.vue";

const props = defineProps({
    pageName: {
        type: String,
        default: 'home',
    },
    routeName: {
        type: String,
        default: 'home',
    },
    isSubPage: {
        type: Boolean,
        default: false,
    },
});

const app = useApp();
const auth = useAuth();
const $q = useQuasar();

const pageReady = ref(true);
const schedulerListPage = ref(null);

// Reactive data stores
const dashboardData = ref({
    totalClasses: 0,
    activeStudents: 0,
    upcomingSessions: 0,
    completionRate: 0,
    weeklyGrowth: 0
});

const classStats = ref({
    weeklyClasses: 0,
    completedClasses: 0,
    pendingClasses: 0,
    avgDuration: 0
});

const performanceData = ref({
    studentEngagement: 0,
    attendanceRate: 0,
    contentCompletion: 0,
    studentSatisfaction: 0
});

const todaySessions = ref([]);
const recentActivity = ref([]);

// Loading states
const loading = ref({
    dashboard: false,
    schedule: false,
    stats: false,
    performance: false,
    activity: false
});

// Fetch dashboard data
const fetchDashboardData = async () => {
    loading.value.dashboard = true;
    try {
        const response = await ApiService.get("components_data/teacher_dashboard_data");
        const data = Array.isArray(response.data) ? response.data[0] || {} : response.data;

        dashboardData.value = {
            totalClasses: data.total_classes || 0,
            activeStudents: data.active_students || 0,
            upcomingSessions: data.upcoming_sessions || 0,
            completionRate: data.completion_rate || 0,
            weeklyGrowth: data.weekly_growth || 0
        };
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        dashboardData.value = {
            totalClasses: 0,
            activeStudents: 0,
            upcomingSessions: 0,
            completionRate: 0,
            weeklyGrowth: 0
        };
    } finally {
        loading.value.dashboard = false;
    }
};

// Fetch today's schedule
const fetchTodaySchedule = async () => {
    loading.value.schedule = true;
    try {
        const response = await ApiService.get("components_data/teacher_today_schedule");
        todaySessions.value = response.data || [];
    } catch (err) {
        console.error("Error fetching today's schedule:", err);
        todaySessions.value = [];
    } finally {
        loading.value.schedule = false;
    }
};

// Fetch class statistics
const fetchClassStats = async () => {
    loading.value.stats = true;
    try {
        const response = await ApiService.get("components_data/teacher_class_stats");
        const data = Array.isArray(response.data) ? response.data[0] || {} : response.data;

        classStats.value = {
            weeklyClasses: data.weekly_classes || 0,
            completedClasses: data.completed_classes || 0,
            pendingClasses: data.pending_classes || 0,
            avgDuration: data.avg_duration || 0
        };
    } catch (err) {
        console.error("Error fetching class stats:", err);
        classStats.value = {
            weeklyClasses: 0,
            completedClasses: 0,
            pendingClasses: 0,
            avgDuration: 0
        };
    } finally {
        loading.value.stats = false;
    }
};

// Fetch performance data
const fetchPerformanceData = async () => {
    loading.value.performance = true;
    try {
        const response = await ApiService.get("components_data/teacher_performance_data");
        const data = Array.isArray(response.data) ? response.data[0] || {} : response.data;

        performanceData.value = {
            studentEngagement: data.student_engagement || 0,
            attendanceRate: data.attendance_rate || 0,
            contentCompletion: data.content_completion || 0,
            studentSatisfaction: data.student_satisfaction || 0
        };
    } catch (err) {
        console.error("Error fetching performance data:", err);
        performanceData.value = {
            studentEngagement: 0,
            attendanceRate: 0,
            contentCompletion: 0,
            studentSatisfaction: 0
        };
    } finally {
        loading.value.performance = false;
    }
};

// Fetch recent activity
const fetchRecentActivity = async () => {
    loading.value.activity = true;
    try {
        const response = await ApiService.get("components_data/teacher_recent_activity");
        recentActivity.value = response.data || [];
    } catch (err) {
        console.error("Error fetching recent activity:", err);
        recentActivity.value = [];
    } finally {
        loading.value.activity = false;
    }
};

// Fetch all data
const fetchAllData = async () => {
    await Promise.all([
        fetchDashboardData(),
        fetchTodaySchedule(),
        fetchClassStats(),
        fetchPerformanceData(),
        fetchRecentActivity()
    ]);
};

// Methods
const startLiveClass = () => {
    $q.notify({
        type: 'info',
        message: 'Starting live class...',
        position: 'top',
    });
};

const joinClass = (session) => {
    if (session.link) {
        window.open(session.link, '_blank');
    }
    $q.notify({
        type: 'positive',
        message: `Joining ${session.title}...`,
        position: 'top',
    });
};

const viewStudents = () => {
    $q.notify({
        type: 'info',
        message: 'Student management feature coming soon!',
        position: 'top',
    });
};

const viewReports = () => {
    $q.notify({
        type: 'info',
        message: 'Reports feature coming soon!',
        position: 'top',
    });
};

const refreshDashboard = () => {
    if (schedulerListPage.value && schedulerListPage.value.load) {
        schedulerListPage.value.load();
    }
    fetchAllData();
    $q.notify({
        type: 'positive',
        message: 'Dashboard refreshed!',
        position: 'top',
        timeout: 1500,
    });
};

// Initialize on mount
onMounted(() => {
    fetchAllData();
});
</script>

<style scoped>
.welcome-banner {
    border-radius: 8px;
}

.gradient-teacher {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.action-btn {
    border-radius: 8px;
    padding: 16px 8px;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.stat-box {
    border-radius: 8px;
}

.full-height {
    height: 100%;
}
</style>
