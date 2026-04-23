<template>
    <q-page class="main-page custom-login-page">
        <div class="login-container">
            <Login />
        </div>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useApp } from 'src/composables/app.js';
import Login from "src/pages/index/login2.vue";

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
const pageReady = ref(true);
</script>

<style scoped>
.custom-login-page {
    background-color: #f5f5f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-container {
    width: 100%;
    max-width: 480px;
}

/* Responsive adjustments */
@media (max-width: 599px) {
    .custom-login-page {
        padding: 0;
        align-items: flex-start;
    }
}
</style>