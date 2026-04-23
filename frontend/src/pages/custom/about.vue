<template>
    <q-page class="main-page about-page">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-overlay"></div>
            <div class="hero-content text-center">
                <h1 class="text-h3 text-white text-bold">About BTC</h1>
                <p class="text-h6 text-white q-mt-md">Bridging Education Gaps Through Technology</p>
            </div>
        </section>

        <section class="page-section q-pa-md">
            <div class="container-fluid">
                <!-- Stats Section -->
                <div class="stats-section q-mb-xl">
                    <div class="row q-col-gutter-md justify-center">
                        <div class="col-6 col-sm-3">
                            <div class="stat-box text-center q-pa-md">
                                <q-icon name="people" size="40px" color="primary" />
                                <div class="text-h5 text-bold text-primary q-mt-sm">10,000+</div>
                                <div class="text-caption">Students</div>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="stat-box text-center q-pa-md">
                                <q-icon name="video_library" size="40px" color="secondary" />
                                <div class="text-h5 text-bold text-secondary q-mt-sm">500+</div>
                                <div class="text-caption">Video Lessons</div>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="stat-box text-center q-pa-md">
                                <q-icon name="school" size="40px" color="accent" />
                                <div class="text-h5 text-bold text-accent q-mt-sm">50+</div>
                                <div class="text-caption">Teachers</div>
                            </div>
                        </div>
                        <div class="col-6 col-sm-3">
                            <div class="stat-box text-center q-pa-md">
                                <q-icon name="location_on" size="40px" color="positive" />
                                <div class="text-h5 text-bold text-positive q-mt-sm">30+</div>
                                <div class="text-caption">Counties</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Who We Are Section -->
                <div class="row q-col-gutter-xl q-mb-xl">
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="about-card h-100">
                            <q-card-section>
                                <div class="text-h5 text-primary text-bold q-mb-md">
                                    <q-icon name="groups" class="q-mr-sm" />
                                    Who We Are
                                </div>
                                <p class="text-body1">
                                    BTC is a groundbreaking virtual school offering comprehensive education across all levels of Kenya's basic education curriculum. 
                                </p>
                                <p class="text-body1">
                                    Our journey began with a commitment to addressing the persistent challenges that learners face in achieving academic success, 
                                    including financial constraints, understaffing, and school absenteeism. By leveraging digital solutions, we have become a vital 
                                    partner in bridging these gaps and transforming the educational experience.
                                </p>
                                <p class="text-body1">
                                    At BTC, we empower learners and schools to achieve their academic goals through affordable and accessible lessons, delivered wherever they are. 
                                    With just a click on a phone, computer, tablet, or smart TV, we bring qualified teachers directly to learners.
                                </p>
                            </q-card-section>
                        </q-card>
                    </div>
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="about-card h-100">
                            <q-card-section>
                                <q-img
                                    src="/images/BTC Landing.jpg"
                                    class="about-image rounded-borders"
                                    contain
                                />
                            </q-card-section>
                        </q-card>
                    </div>
                </div>

                <!-- Vision & Mission Section -->
                <div class="row q-col-gutter-xl q-mb-xl">
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="about-card vision-card">
                            <q-card-section class="text-center q-pa-lg">
                                <q-icon name="visibility" size="64px" color="primary" class="q-mb-md" />
                                <div class="text-h5 text-primary text-bold q-mb-md">Our Vision</div>
                                <p class="text-body1">
                                    To be the learner's most trusted guide towards academic excellence.
                                </p>
                            </q-card-section>
                        </q-card>
                    </div>
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="about-card mission-card">
                            <q-card-section class="text-center q-pa-lg">
                                <q-icon name="flag" size="64px" color="secondary" class="q-mb-md" />
                                <div class="text-h5 text-secondary text-bold q-mb-md">Our Mission</div>
                                <p class="text-body1">
                                    We exist to remove all barriers to quality education for learners and schools by providing digital solutions to financial and staffing challenges.
                                </p>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>

                <!-- Core Values Section -->
                <div class="q-mb-xl">
                    <div class="text-center q-mb-lg">
                        <h2 class="text-h5 text-primary text-bold">Our Core Values</h2>
                    </div>
                    <div class="row q-col-gutter-md justify-center">
                        <div class="col-12 col-sm-6 col-md-4">
                            <q-card flat bordered class="value-card text-center q-pa-lg">
                                <q-icon name="verified" size="48px" color="positive" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold">Quality</div>
                                <div class="text-body2 text-grey-7 q-mt-sm">
                                    We are dedicated to delivering exceptional educational content and support.
                                </div>
                            </q-card>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <q-card flat bordered class="value-card text-center q-pa-lg">
                                <q-icon name="savings" size="48px" color="orange" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold">Affordability</div>
                                <div class="text-body2 text-grey-7 q-mt-sm">
                                    We believe every learner deserves access to education, regardless of their financial circumstances.
                                </div>
                            </q-card>
                        </div>
                        <div class="col-12 col-sm-6 col-md-4">
                            <q-card flat bordered class="value-card text-center q-pa-lg">
                                <q-icon name="devices" size="48px" color="primary" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold">Digitization</div>
                                <div class="text-body2 text-grey-7 q-mt-sm">
                                    We leverage technology to create seamless, accessible, and efficient learning experiences.
                                </div>
                            </q-card>
                        </div>
                    </div>
                </div>

                <!-- CTA Section -->
                <div class="cta-section q-mb-xl">
                    <q-card flat bordered class="cta-card q-pa-xl text-center">
                        <h3 class="text-h5 text-bold text-primary q-mb-md">Join Us in Transforming Education</h3>
                        <p class="text-body1 text-grey-7 q-mb-lg">
                            At BTC, we are redefining the boundaries of education. By combining innovation, passion, and a learner-first approach, 
                            we aim to inspire and empower the next generation of achievers.
                        </p>
                        <div class="row justify-center q-gutter-md">
                            <q-btn
                                color="primary"
                                icon="school"
                                label="Start Learning"
                                to="/viewlessons"
                                size="lg"
                                no-caps
                                unelevated
                            />
                            <q-btn
                                outline
                                color="primary"
                                icon="contact_mail"
                                label="Contact Us"
                                to="/contactus"
                                size="lg"
                                no-caps
                            />
                        </div>
                    </q-card>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    pageName: {
        type: String,
        default: 'about',
    },
    routeName: {
        type: String,
        default: 'about',
    },
    isSubPage: {
        type: Boolean,
        default: false,
    },
});

const pageReady = ref(true);
</script>

<style scoped>
.about-page {
    background-color: #f8f9fa;
}

.hero-section {
    position: relative;
    height: 300px;
    background: url('/images/BTC Landing.jpg') center center / cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.9) 0%, rgba(25, 101, 192, 0.8) 100%);
}

.hero-content {
    position: relative;
    z-index: 1;
    padding: 20px;
}

.stats-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-top: -60px;
    position: relative;
    z-index: 2;
}

.stat-box {
    transition: all 0.3s ease;
}

.stat-box:hover {
    transform: translateY(-4px);
}

.about-card {
    border-radius: 12px;
    background: white;
}

.about-image {
    height: 250px;
}

.vision-card {
    border-radius: 12px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-left: 4px solid #1976d2;
}

.mission-card {
    border-radius: 12px;
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    border-left: 4px solid #4caf50;
}

.value-card {
    border-radius: 12px;
    transition: all 0.3s ease;
    height: 100%;
}

.value-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.cta-card {
    border-radius: 16px;
    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}

@media (max-width: 599px) {
    .hero-section {
        height: 200px;
    }
    
    .hero-content .text-h3 {
        font-size: 1.75rem !important;
    }
    
    .stats-section {
        margin-top: -40px;
    }
    
    .stat-box {
        padding: 12px !important;
    }
}
</style>