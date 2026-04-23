<template>
    <q-page class="main-page guest-home-page">
        <!-- Hero Section -->
        <section class="page-section hero-section q-pa-md">
            <div class="container-fluid">
                <div class="row items-center q-col-gutter-md">
                    <div class="col-12 col-md-7">
                        <div class="welcome-content">
                            <h1 class="text-h4 text-h3-md text-primary text-bold welcome-title">
                                Welcome to BTC
                            </h1>
                            <p class="text-subtitle1 text-grey-7 q-mt-md q-mb-lg">
                                Your journey to quality education starts here. Learn anytime, anywhere with our expert-led video lessons.
                            </p>
                            <div class="action-buttons row q-gutter-md">
                                <q-btn
                                    color="primary"
                                    icon="school"
                                    label="Start Learning"
                                    to="/viewlessons"
                                    size="lg"
                                    no-caps
                                    unelevated
                                    class="cta-primary"
                                />
                                <q-btn
                                    outline
                                    color="primary"
                                    icon="login"
                                    label="Login"
                                    to="/customlogin"
                                    size="lg"
                                    no-caps
                                    class="cta-secondary"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-5">
                        <q-card flat bordered class="stats-card">
                            <q-card-section>
                                <div class="text-h6 text-center text-primary q-mb-md">
                                    <q-icon name="emoji_events" class="q-mr-sm" />
                                    Why Choose BTC?
                                </div>
                                <q-list>
                                    <q-item class="feature-item">
                                        <q-item-section avatar>
                                            <q-icon color="positive" name="check_circle" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Expert Qualified Teachers</q-item-label>
                                            <q-item-label caption>Learn from the best educators</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                    <q-item class="feature-item">
                                        <q-item-section avatar>
                                            <q-icon color="positive" name="check_circle" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Affordable Packages</q-item-label>
                                            <q-item-label caption>Quality education within your budget</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                    <q-item class="feature-item">
                                        <q-item-section avatar>
                                            <q-icon color="positive" name="check_circle" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Learn Anywhere</q-item-label>
                                            <q-item-label caption>Access lessons on any device</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                    <q-item class="feature-item">
                                        <q-item-section avatar>
                                            <q-icon color="positive" name="check_circle" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>All Curriculum Levels</q-item-label>
                                            <q-item-label caption>From ECDE to Senior Secondary</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick Stats Section -->
        <section class="page-section q-pa-md stats-section">
            <div class="container-fluid">
                <div class="row q-col-gutter-md justify-center">
                    <div class="col-6 col-sm-3">
                        <div class="stat-box text-center">
                            <div class="stat-icon">
                                <q-icon name="people" size="32px" color="primary" />
                            </div>
                            <div class="stat-value text-h5 text-bold text-primary">10,000+</div>
                            <div class="stat-label text-caption">Students</div>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="stat-box text-center">
                            <div class="stat-icon">
                                <q-icon name="video_library" size="32px" color="secondary" />
                            </div>
                            <div class="stat-value text-h5 text-bold text-secondary">500+</div>
                            <div class="stat-label text-caption">Lessons</div>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="stat-box text-center">
                            <div class="stat-icon">
                                <q-icon name="school" size="32px" color="accent" />
                            </div>
                            <div class="stat-value text-h5 text-bold">50+</div>
                            <div class="stat-label text-caption">Teachers</div>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="stat-box text-center">
                            <div class="stat-icon">
                                <q-icon name="verified" size="32px" color="positive" />
                            </div>
                            <div class="stat-value text-h5 text-bold text-positive">95%</div>
                            <div class="stat-label text-caption">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Education Levels Section -->
        <section class="page-section q-pa-md levels-section">
            <div class="container-fluid">
                <div class="text-center q-mb-lg">
                    <h2 class="text-h5 text-primary text-bold">Explore Learning Levels</h2>
                    <p class="text-subtitle1 text-grey-7">Choose your education level and start learning</p>
                </div>
                
                <div class="row q-col-gutter-md justify-center">
                    <div class="col-12 col-sm-6 col-md-3" v-for="level in levels" :key="level.id">
                        <q-card flat bordered class="level-card">
                            <q-card-section class="text-center">
                                <q-icon :name="level.icon" size="48px" :color="level.color" />
                                <div class="text-h6 text-bold q-mt-sm">{{ level.name }}</div>
                                <div class="text-body2 text-grey-7">{{ level.description }}</div>
                            </q-card-section>
                            <q-card-actions align="center">
                                <q-btn 
                                    color="primary" 
                                    :label="level.comingSoon ? 'Coming Soon' : 'Explore'"
                                    :to="level.comingSoon ? '' : `/viewlessons?level=${level.name}`"
                                    :disable="level.comingSoon"
                                    no-caps
                                    unelevated
                                />
                            </q-card-actions>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="page-section q-pa-md cta-section">
            <div class="container-fluid">
                <q-card flat bordered class="cta-card">
                    <q-card-section class="text-center q-pa-lg">
                        <h3 class="text-h5 text-bold text-primary">Ready to Get Started?</h3>
                        <p class="text-body1 text-grey-7 q-mb-md">
                            Subscribe today and unlock unlimited access to all lessons
                        </p>
                        <q-btn 
                            color="positive" 
                            icon="shopping_cart" 
                            label="View Packages" 
                            to="/buypackages"
                            size="lg"
                            no-caps
                            unelevated
                        />
                    </q-card-section>
                </q-card>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from 'src/composables/auth';
import { useActivityStore } from 'src/stores/useActivityStore';
import { generateFingerprint, retrieveFingerprint } from "src/fingerprint";

defineProps({
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

const auth = useAuth();
const activityStore = useActivityStore();
const storedfingerprint = ref();

const levels = ref([
    { 
        id: 1, 
        name: 'ECDE', 
        description: 'Early Childhood Development', 
        icon: 'child_care', 
        color: 'pink',
        comingSoon: true 
    },
    { 
        id: 2, 
        name: 'Primary', 
        description: 'Grades 1-8', 
        icon: 'menu_book', 
        color: 'primary',
        comingSoon: false 
    },
    { 
        id: 3, 
        name: 'JSS', 
        description: 'Junior Secondary School', 
        icon: 'auto_stories', 
        color: 'secondary',
        comingSoon: false 
    },
    { 
        id: 4, 
        name: 'SSS', 
        description: 'Senior Secondary School', 
        icon: 'school', 
        color: 'accent',
        comingSoon: false 
    },
]);

// Initialize on mount
storedfingerprint.value = retrieveFingerprint();
activityStore.startTracking();
</script>

<style scoped>
.guest-home-page {
    background-color: #f8f9fa;
}

.hero-section {
    background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
    padding: 40px 16px;
}

.welcome-title {
    margin-bottom: 16px;
}

.action-buttons {
    margin-top: 24px;
}

.cta-primary {
    min-width: 160px;
    border-radius: 8px;
}

.cta-secondary {
    min-width: 120px;
    border-radius: 8px;
}

.stats-card {
    border-radius: 12px;
    background: #ffffff;
}

.feature-item {
    border-radius: 8px;
    margin-bottom: 8px;
}

.feature-item:hover {
    background: #f5f5f5;
}

.stats-section {
    background: #ffffff;
    padding: 32px 16px;
}

.stat-box {
    padding: 16px;
}

.stat-icon {
    margin-bottom: 8px;
}

.stat-value {
    margin-bottom: 4px;
}

.stat-label {
    color: #666;
}

.levels-section {
    padding: 40px 16px;
}

.level-card {
    border-radius: 12px;
    transition: all 0.3s ease;
    height: 100%;
}

.level-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.cta-section {
    padding: 40px 16px;
}

.cta-card {
    border-radius: 12px;
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

/* Responsive adjustments */
@media (max-width: 599px) {
    .hero-section {
        padding: 24px 16px;
    }
    
    .welcome-title {
        font-size: 1.75rem !important;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .cta-primary,
    .cta-secondary {
        width: 100%;
    }
    
    .level-card {
        margin-bottom: 16px;
    }
}

@media (min-width: 600px) and (max-width: 1023px) {
    .hero-section {
        padding: 32px 20px;
    }
    
    .level-card {
        margin-bottom: 16px;
    }
}

@media (min-width: 1024px) {
    .hero-section {
        padding: 48px 32px;
    }
}
</style>