<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class="">
                            <q-page class=" flex flex-center">
                                <q-card class="" style="width: 100%;">
                                    <div>
                                        <h3 class="text-primary text-center">BTC Platform User Guide</h3>
                                        <p class="text-center text-grey-7 text-h5">Follow these steps to navigate our platform easily.</p>
                                    </div>
                                    <q-stepper v-model="step" color="primary" animated header-nav>
                                        <q-step
                                            v-for="(section, index) in userGuide"
                                            :key="index"
                                            :name="index + 1"
                                            :title="section.title"
                                            :icon="section.icon"
                                            done-color="green"
                                            :done="step > index + 1"
                                            >
                                            <q-card-section v-html="section.content" class="text-h4"></q-card-section>
                                        </q-step>
                                        <q-stepper-navigation>
                                            <q-btn v-if="step > 1" @click="step--" label="Back" color="grey" class="q-mr-md" />
                                                <q-btn v-if="step < userGuide.length" @click="step++" label="Next" color="primary" />
                                                    </q-stepper-navigation>
                                                </q-stepper>
                                                <q-card-section v-if="step === userGuide.length" class="text-center q-mt-md">
                                                    <h4 class="text-primary">BTC: Let's Learn Digitally!</h4>
                                                </q-card-section>
                                            </q-card>
                                        </q-page>
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
	import { useAuth } from 'src/composables/auth';
	
	
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
	const auth = useAuth();
	const pageReady = ref(true);
	const step=ref(1)
const userGuide=ref([])
onMounted(()=>{
    getguide();
});
async function getguide(){
  try{
    //fetch data from the api
    const response = await ApiService.get("components_data/getguide");
    userGuide.value = response.data;
  }
  catch(e){
    console.error(e); 
  }
}
 onMounted(()=>{
    
    if(auth.userRole==="superadmin" || auth.isAdmin){
        app.navigateTo("userguide")
    }
});

</script>

<style scoped>
.q-card {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}
</style>
