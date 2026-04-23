<template>
    <div v-if="usercode" class="usercode-strength">
        <div class="strength-meter">
            <div
                class="strength-meter-fill"
                :style="{
                    width: strength + '%',
                    backgroundColor: strengthColor,
                }"
            ></div>
        </div>
        <div class="strength-feedback">{{ feedback }}</div>
    </div>
</template>

<script setup>
import { computed, watch } from "vue";

const props = defineProps({
    usercode: String,
});

const strength = computed(() => {
    let score = 0;
    if (!props.usercode) return 0;

    // Length
    if (props.usercode.length > 10) score += 25;
    else if (props.usercode.length > 7) score += 15;
    else if (props.usercode.length > 5) score += 5;

    // Complexity
    if (/[A-Z]/.test(props.usercode)) score += 15;
    if (/[a-z]/.test(props.usercode)) score += 15;
    if (/[0-9]/.test(props.usercode)) score += 15;
    if (/[^A-Za-z0-9]/.test(props.usercode)) score += 15;

    return Math.min(100, score);
});

const strengthColor = computed(() => {
    if (strength.value < 30) return "#ff4444";
    if (strength.value < 70) return "#ffbb33";
    return "#00C851";
});

const feedback = computed(() => {
    if (!props.usercode) return "";
    if (strength.value < 30) return "Weak";
    if (strength.value < 70) return "Moderate";
    return "Strong";
});
</script>

<style scoped>
.usercode-strength {
    margin-top: 4px;
}

.strength-meter {
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
}

.strength-meter-fill {
    height: 100%;
    transition: width 0.3s, background-color 0.3s;
}

.strength-feedback {
    font-size: 0.75rem;
    color: #666;
    margin-top: 2px;
}
</style>
