<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            BTC Learning Serv
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section class="page-section q-mb-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class="">
                            <api-data-source   api-path="components_data/products_data_repeater"  v-slot="req">
                                <div >
                                    <template v-if="!req.loading">
                                        <q-card class="q-mb-md">
                                            <q-card-section>
                                                <q-tabs v-model="activeTab" align="justify" dense>
                                                    <q-tab  v-for="(service, index) in  req.response" :key="index" :name="service.name" :label="service.label" />
                                                </q-tabs>
                                            </q-card-section>
                                            <q-separator />
                                            <q-card-section>
                                                <q-tab-panels v-model="activeTab" animated>
                                                    <q-tab-panel v-for="(service, index) in services" :key="index" :name="service.name">
                                                        <h4>{{ service.label }}</h4>
                                                        <p>{{ service.description }}</p>
                                                    </q-tab-panel>
                                                </q-tab-panels>
                                                <q-card-actions>
                                                    <q-btn icon="subscriptions" label="Subscribe Now" />
                                                    </q-card-actions>
                                                </q-card-section>
                                            </q-card>
                                        </template>
                                    </div>
                                    
                                </api-data-source>
                                
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
	const activeTab = ref("holiday");
const services = ref([
  {
    name: "holiday",
    label: "Holiday Learning Packages",
    description:
      "We are pleased to present to you a holiday package that you can subscribe to and have your child stay up to date with school work even when away for holiday. Our holiday package is cheap and accessible conveniently via smartphone, tablet, and/or PC.",
  },
  {
    name: "advanced",
    label: "Advanced Learning",
    description:
      "Post elementary learning defines future opportunities for learners. To help overcome challenges like absenteeism and workload, BTC offers makeup lessons in Math, English, Biology, and more for only 50/- per hour lesson.",
  },
  {
    name: "jss",
    label: "JSS Learning",
    description:
      "BTC provides tutorials in seven CBC learning areas, including Mathematics and Life Skills. Tutorials are presented digitally by CBC champions for your convenience.",
  },
  {
    name: "ecde",
    label: "ECDE Learning",
    description:
      "For ages 3-6, BTC offers online lessons to address challenges like teacher shortages and rising fees. Subscribe and let your child learn from home under your guidance.",
  },
  {
    name: "elementary",
    label: "Elementary Learning",
    description:
      "BTC offers affordable lessons in Math, English, Kiswahili, Science, Art, and Music, addressing common challenges like poverty and sickness.",
  },
  {
    name: "packages",
    label: "Home Schooling/School Packages",
    description:
      "BTC provides Diamond, Silver, and Gold packages for homeschoolers and schools to access affordable learning resources. Join and remove boundaries to quality learning.",
  },
]);

</script>

<style scoped>
.q-page {
  background-color: #f5f5f5;
}
</style>
