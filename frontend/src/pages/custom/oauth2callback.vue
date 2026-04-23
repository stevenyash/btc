<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            oauth2callback
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref, onMounted } from 'vue';
	
	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';
	
	
	import { useRoute, useRouter } from 'vue-router';

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
			type : Boolean,
			default : false,
		},
	});
	const app = useApp();
	
	const pageReady = ref(true);
	const authUrl = ref('');
const route = useRoute();  // Vue Router instance for query params
const router = useRouter(); // Vue Router for navigation
async function initOAuthFlow() {
    try {
        const response = await ApiService.get('/getAuthUrl');
        authUrl.value = response.data.url;
        window.location.href = authUrl.value; // Redirect to Google OAuth
        } catch (error) {
        console.error('Failed to start OAuth flow:', error);
    }
}
async function handleOAuthCallback() {
    const authCode = route.query.code;
    const error = route.query.error;
    
    if (error) {
        console.error('OAuth error:', error);
        return;
    }
    
    if (authCode) {
        try {
            console.log('Received auth code:', authCode);
            await ApiService.post('components_data/oauth2callback', { code: authCode });
            router.push('/'); // Redirect to home or dashboard
            } catch (e) {
            console.error('Failed to exchange code:', e);
        }
    }
}
onMounted(() => {
    if (route.query.code) {
        handleOAuthCallback();
    }
});

</script>

<style scoped>

</style>
