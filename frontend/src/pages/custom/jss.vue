<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            jss
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref } from 'vue';
	
	
	import { useApp } from 'src/composables/app.js';
	
	
	
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
	
</script>

<style scoped>
/* Background styling */
.background-container {
    background-image: url('/images/landing.webp'); /* Replace with your image path */
  background-size: cover; /* Ensures the image covers the entire container */
  background-position: center; /* Centers the image */
  background-repeat: no-repeat; /* Prevents repeating of the image */
  width: 100%; /* Adjust width as needed */
  height: 100vh; /* Full viewport height */
  display: flex; /* To use flexbox for content positioning */
  align-items: center; /* Vertically center content */
  justify-content: center; /* Horizontally center content */
}
/* Optional: Overlay to enhance readability */
.background-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
  z-index: 1;
}
/* Content styling */
.content {
  position: relative; /* Ensures content appears above the overlay */
  z-index: 2;
  color: #fff; /* White text for better contrast */
  text-align: center; /* Center align text */
  font-size: 1.5rem; /* Adjust font size as needed */
}
</style>
