<template>
    <div class="testimonials-container">
        <div class="testimonial-card-wrapper">
            <transition name="fade" mode="out-in">
                <q-card 
                    :key="currentIndex" 
                    class="testimonial-card"
                    flat
                    bordered
                >
                    <q-card-section class="q-pa-lg">
                        <!-- Star Ratings -->
                        <div class="stars q-mb-md">
                            <q-icon 
                                v-for="n in 5" 
                                :key="n" 
                                name="star" 
                                color="amber" 
                                size="24px" 
                            />
                        </div>
                        
                        <!-- Testimonial Text -->
                        <p class="testimonial-text">
                            "{{ testimonials[currentIndex].text }}"
                        </p>
                        
                        <!-- Author Info -->
                        <div class="author-info q-mt-md">
                            <q-avatar 
                                size="56px" 
                                :color="getAvatarColor(currentIndex)" 
                                text-color="white"
                                class="author-avatar"
                            >
                                {{ getInitials(testimonials[currentIndex].author) }}
                            </q-avatar>
                            <div class="author-details">
                                <div class="author-name text-weight-bold">
                                    {{ testimonials[currentIndex].author }}
                                </div>
                                <div class="author-location text-caption text-grey-7">
                                    {{ testimonials[currentIndex].location }}
                                </div>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </transition>

            <!-- Navigation Dots -->
            <div class="nav-dots q-mt-md">
                <q-btn
                    v-for="(testimonial, index) in testimonials"
                    :key="index"
                    round
                    flat
                    dense
                    :class="['dot-btn', { active: currentIndex === index }]"
                    @click="currentIndex = index"
                >
                    <span class="dot"></span>
                </q-btn>
            </div>

            <!-- Navigation Arrows -->
            <div class="nav-arrows q-mt-md">
                <q-btn 
                    icon="chevron_left" 
                    @click="prevTestimonial" 
                    round 
                    flat
                    color="grey-6"
                    class="nav-btn"
                />
                <q-btn 
                    icon="chevron_right" 
                    @click="nextTestimonial" 
                    round 
                    flat
                    color="grey-6"
                    class="nav-btn"
                />
            </div>
        </div>

        <!-- Auto-play indicator -->
        <div class="autoplay-indicator q-mt-sm">
            <q-icon name="pause" size="16px" color="grey-6" v-if="isPaused" />
            <q-icon name="play_arrow" size="16px" color="grey-6" v-else />
            <span class="text-caption text-grey-7 q-ml-xs">
                {{ isPaused ? 'Paused' : 'Auto-playing' }}
            </span>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ApiService } from 'src/services/api';

const testimonials = ref([
    {
        text: "BTC has transformed my daughter's learning experience. She's now top of her class in Mathematics and Science. The video lessons are clear and easy to follow.",
        author: "Mary Wanjiku",
        location: "Nairobi, Kenya"
    },
    {
        text: "As a teacher, I recommend BTC to all my students. The quality of content is excellent and the affordability makes it accessible to everyone.",
        author: "John Ochieng",
        location: "Kisumu, Kenya"
    },
    {
        text: "I was able to catch up on my studies after missing school due to illness. The flexible learning allowed me to study at my own pace.",
        author: "Faith Akoth",
        location: "Mombasa, Kenya"
    },
    {
        text: "The JSS lessons helped me prepare for my KCSE exams. I scored an A in Geography thanks to the comprehensive video tutorials.",
        author: "David Kimani",
        location: "Kitui, Kenya"
    },
    {
        text: "My son who struggled with English now speaks confidently. The teachers are patient and the lessons are engaging. Highly recommended!",
        author: "Grace Nekesa",
        location: "Nakuru, Kenya"
    }
]);

const currentIndex = ref(0);
const isPaused = ref(false);
let autoPlayInterval = null;

const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const getAvatarColor = (index) => {
    const colors = ['primary', 'secondary', 'positive', 'accent', 'orange'];
    return colors[index % colors.length];
};

const prevTestimonial = () => {
    currentIndex.value = currentIndex.value === 0 
        ? testimonials.value.length - 1 
        : currentIndex.value - 1;
};

const nextTestimonial = () => {
    currentIndex.value = (currentIndex.value + 1) % testimonials.value.length;
};

const startAutoPlay = () => {
    autoPlayInterval = setInterval(() => {
        if (!isPaused.value) {
            nextTestimonial();
        }
    }, 5000);
};

const pauseAutoPlay = () => {
    isPaused.value = true;
};

const resumeAutoPlay = () => {
    isPaused.value = false;
};

onMounted(() => {
    startAutoPlay();
});

onUnmounted(() => {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
    }
});
</script>

<style scoped>
.testimonials-container {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
}

.testimonial-card {
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.testimonial-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stars {
    display: flex;
    justify-content: center;
    gap: 4px;
}

.testimonial-text {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #333;
    font-style: italic;
    margin: 0;
}

.author-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.author-avatar {
    font-weight: 600;
}

.author-details {
    text-align: left;
}

.author-name {
    font-size: 1rem;
    color: #333;
}

.author-location {
    font-size: 0.85rem;
}

.nav-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
}

.dot-btn {
    padding: 4px;
    min-width: 0;
    min-height: 0;
}

.dot {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ccc;
    transition: all 0.3s ease;
}

.dot-btn.active .dot,
.dot-btn:hover .dot {
    background: #1976d2;
    transform: scale(1.2);
}

.nav-arrows {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.nav-btn {
    transition: all 0.3s ease;
}

.nav-btn:hover {
    background: #e3f2fd;
}

.autoplay-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.4s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

/* Responsive */
@media (max-width: 599px) {
    .testimonial-text {
        font-size: 1rem;
    }
    
    .author-avatar {
        width: 44px !important;
        height: 44px !important;
    }
    
    .testimonial-card {
        margin: 0 8px;
    }
}
</style>