<template>
    <q-page class="main-page contact-page">
        <section class="page-section q-pa-md">
            <div class="container-fluid">
                <!-- Page Header -->
                <div class="text-center q-mb-xl">
                    <h2 class="text-h4 text-primary text-bold">Contact Us</h2>
                    <p class="text-subtitle1 text-grey-7">We'd love to hear from you</p>
                </div>

                <div class="row q-col-gutter-xl justify-center">
                    <!-- Contact Info Column -->
                    <div class="col-12 col-md-5">
                        <!-- Contact Cards -->
                        <q-card flat bordered class="contact-card q-mb-md">
                            <q-card-section>
                                <div class="text-h6 text-weight-bold q-mb-md">
                                    <q-icon name="contact_mail" class="q-mr-sm" />
                                    Get in Touch
                                </div>
                                
                                <!-- Phone -->
                                <q-list>
                                    <q-item clickable v-model-toggle class="contact-item">
                                        <q-item-section avatar>
                                            <q-icon name="phone" color="primary" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Phone</q-item-label>
                                            <q-item-label caption class="text-primary text-weight-medium">
                                                <a :href="'tel:+254722310358'" class="contact-link">+254 722 310 358</a>
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="call" color="positive" />
                                        </q-item-section>
                                    </q-item>

                                    <q-separator />

                                    <!-- Email -->
                                    <q-item clickable class="contact-item">
                                        <q-item-section avatar>
                                            <q-icon name="email" color="primary" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Email</q-item-label>
                                            <q-item-label caption class="text-primary text-weight-medium">
                                                <a :href="'mailto:info@bitstutorconnect.co.ke'" class="contact-link">info@bitstutorconnect.co.ke</a>
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="send" color="secondary" />
                                        </q-item-section>
                                    </q-item>

                                    <q-separator />

                                    <!-- WhatsApp -->
                                    <q-item clickable class="contact-item">
                                        <q-item-section avatar>
                                            <q-icon name="chat" color="positive" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>WhatsApp</q-item-label>
                                            <q-item-label caption class="text-positive text-weight-medium">
                                                <a href="https://wa.me/254722310358" target="_blank" class="contact-link">Chat with us</a>
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="whatsapp" color="positive" />
                                        </q-item-section>
                                    </q-item>

                                    <q-separator />

                                    <!-- Address -->
                                    <q-item class="contact-item">
                                        <q-item-section avatar>
                                            <q-icon name="location_on" color="primary" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>Address</q-item-label>
                                            <q-item-label caption>
                                                P.O Box 955-90200, Kitui, Kenya
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>

                        <!-- Business Hours -->
                        <q-card flat bordered class="contact-card q-mb-md">
                            <q-card-section>
                                <div class="text-h6 text-weight-bold q-mb-md">
                                    <q-icon name="schedule" class="q-mr-sm" />
                                    Business Hours
                                </div>
                                <q-list dense>
                                    <q-item class="q-px-none">
                                        <q-item-section>Monday - Friday</q-item-section>
                                        <q-item-section side>8:00 AM - 6:00 PM</q-item-section>
                                    </q-item>
                                    <q-item class="q-px-none">
                                        <q-item-section>Saturday</q-item-section>
                                        <q-item-section side>9:00 AM - 4:00 PM</q-item-section>
                                    </q-item>
                                    <q-item class="q-px-none">
                                        <q-item-section>Sunday</q-item-section>
                                        <q-item-section side>Closed</q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>

                        <!-- Social Media -->
                        <q-card flat bordered class="contact-card">
                            <q-card-section>
                                <div class="text-h6 text-weight-bold q-mb-md">
                                    <q-icon name="share" class="q-mr-sm" />
                                    Follow Us
                                </div>
                                <div class="social-icons row q-gutter-md justify-center">
                                    <q-btn round flat color="primary" icon="facebook" size="lg" />
                                    <q-btn round flat color="info" icon="language" size="lg" />
                                    <q-btn round flat color="red" icon="play_circle" size="lg" />
                                    <q-btn round flat color="positive" icon="chat" size="lg" />
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Contact Form Column -->
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="contact-card">
                            <q-card-section>
                                <div class="text-h6 text-weight-bold q-mb-md">
                                    <q-icon name="mail" class="q-mr-sm" />
                                    Send us a Message
                                </div>

                                <q-form @submit="onSubmit" class="q-gutter-md">
                                    <q-input
                                        v-model="form.name"
                                        label="Your Name"
                                        outlined
                                        dense
                                        :rules="[val => !!val || 'Name is required']"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="person" />
                                        </template>
                                    </q-input>

                                    <q-input
                                        v-model="form.email"
                                        label="Email Address"
                                        outlined
                                        dense
                                        type="email"
                                        :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="email" />
                                        </template>
                                    </q-input>

                                    <q-input
                                        v-model="form.phone"
                                        label="Phone Number (optional)"
                                        outlined
                                        dense
                                        type="tel"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="phone" />
                                        </template>
                                    </q-input>

                                    <q-select
                                        v-model="form.subject"
                                        label="Subject"
                                        outlined
                                        dense
                                        :options="subjectOptions"
                                        :rules="[val => !!val || 'Subject is required']"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="category" />
                                        </template>
                                    </q-select>

                                    <q-input
                                        v-model="form.message"
                                        label="Your Message"
                                        outlined
                                        type="textarea"
                                        rows="5"
                                        :rules="[val => !!val || 'Message is required']"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="message" class="q-mt-md" />
                                        </template>
                                    </q-input>

                                    <q-btn
                                        type="submit"
                                        color="primary"
                                        label="Send Message"
                                        icon="send"
                                        size="lg"
                                        class="full-width q-mt-md"
                                        no-caps
                                        unelevated
                                        :loading="loading"
                                    />
                                </q-form>
                            </q-card-section>
                        </q-card>

                        <!-- Quick Actions -->
                        <div class="row q-col-gutter-md q-mt-md">
                            <div class="col-6">
                                <q-btn
                                    color="positive"
                                    icon="whatsapp"
                                    label="Chat on WhatsApp"
                                    href="https://wa.me/254722310358"
                                    target="_blank"
                                    class="full-width"
                                    no-caps
                                    unelevated
                                />
                            </div>
                            <div class="col-6">
                                <q-btn
                                    outline
                                    color="primary"
                                    icon="phone"
                                    label="Call Now"
                                    :href="'tel:+254722310358'"
                                    class="full-width"
                                    no-caps
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Map Section -->
                <div class="q-mt-xl">
                    <q-card flat bordered class="contact-card">
                        <q-card-section>
                            <div class="text-h6 text-weight-bold q-mb-md text-center">
                                <q-icon name="map" class="q-mr-sm" />
                                Find Us
                            </div>
                            <div class="map-container">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.849456584892!2d37.9876543!3d-1.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f11599999999%3A0x1234567890abcdef!2sKitui%2C%20Kenya!5e0!3m2!1sen!2ske!4v1234567890"
                                    width="100%"
                                    height="300"
                                    style="border:0;"
                                    allowfullscreen=""
                                    loading="lazy"
                                >
                                </iframe>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';

const props = defineProps({
    pageName: {
        type: String,
        default: 'contact',
    },
    routeName: {
        type: String,
        default: 'contact',
    },
    isSubPage: {
        type: Boolean,
        default: false,
    },
});

const $q = useQuasar();
const loading = ref(false);

const form = reactive({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
});

const subjectOptions = [
    'General Inquiry',
    'Subscription Support',
    'Technical Issue',
    'Payment Inquiry',
    'Partnership',
    'Feedback',
    'Other'
];

const onSubmit = async () => {
    loading.value = true;
    try {
        // In a real app, send to API
        // await ApiService.post('components_data/contact', form);
        
        $q.notify({
            type: 'positive',
            message: 'Message sent successfully! We will get back to you soon.',
            position: 'top'
        });
        
        // Reset form
        form.name = '';
        form.email = '';
        form.phone = '';
        form.subject = '';
        form.message = '';
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: 'Failed to send message. Please try again.',
            position: 'top'
        });
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.contact-page {
    background-color: #f8f9fa;
    min-height: 100vh;
}

.contact-card {
    border-radius: 12px;
    background: #ffffff;
}

.contact-item {
    border-radius: 8px;
    margin-bottom: 4px;
}

.contact-item:hover {
    background: #f5f5f5;
}

.contact-link {
    text-decoration: none;
    color: inherit;
}

.contact-link:hover {
    text-decoration: underline;
}

.social-icons {
    padding: 16px 0;
}

.social-icons .q-btn:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}

.map-container {
    border-radius: 8px;
    overflow: hidden;
}

@media (max-width: 599px) {
    .contact-page {
        padding: 16px;
    }
    
    .social-icons {
        gap: 8px !important;
    }
}
</style>