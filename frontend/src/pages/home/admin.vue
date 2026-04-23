<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            Admin
                        </div>
                    </div>

                    <div  class="col-md-3 col-12 comp-grid" >
                        <div class="">
                            <div><ActiveUsers/></div>

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


	import Login from "src/pages/index/login.vue"
import ActiveUsers from "src/components/ActiveUsers.vue"

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

</style>
