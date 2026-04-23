<template>
    <main class="main-page" id="">
        <template v-if="pageReady">
            <template v-if="showHeader">
                <section class="page-section q-pa-md q-mb-md" >
                    <div class="container">
                        <div class="row justify-between items-center q-col-gutter-md">
                            <div  v-if="!isSubPage"  class="col-auto " >
                                <q-btn @click="$router.go(-1)"      flat :rounded="false"  size=""  color="primary"  no-caps  unelevated   class="" >
                                    <q-icon name="arrow_back"></q-icon>                             
                                </q-btn>
                            </div>
                            <div  class="col-md-auto " >
                                <div class=" text-h6 text-primary" >
                                    User registration
                                </div>
                            </div>
                            <div  class="col-md-4 col-12 comp-grid" >
                                <div class="">
                                    <div>
                                        Already have an account?  
                                        <q-btn     :rounded="false"  no-caps  unelevated    color="accent" icon="account_box" to="/"> Login</q-btn>
                                    </div>
                                </div>
                            </div>
                            <!--topcardactiontemplates-->
                        </div>
                    </div>
                </section>
            </template>
            <section class="page-section " >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col-md-9 col-12 comp-grid" >
                            <div >
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <q-form ref="observer" @submit.prevent="submitForm()">
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Username *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="Not available" v-model="formData.username" check-path="components_data/users_username_exist/" v-slot="checker">
                                                    <q-input   ref="ctrlusername" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.username"  label="Username" type="text" placeholder="Enter Username"      
                                                    class="" :error="isFieldValid('username') || checker.alreadyExist" :error-message="getFieldError('username') || checker.errorMsg">
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    usercode *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlusercode" v-model="formData.usercode"  label="usercode" :type="isPwd ? 'usercode' : 'text'" placeholder="Enter usercode"      
                                                    class="" :error="isFieldValid('usercode')" :error-message="getFieldError('usercode')">
                                                    <template v-slot:append>
                                                        <q-icon
                                                        :name="isPwd ? 'visibility_off' : 'visibility'"
                                                        class="cursor-pointer"
                                                        @click="isPwd = !isPwd"
                                                        />
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Confirm usercode *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrlconfirmusercode" v-model="formData.confirm_usercode" :type="isCPwd ? 'usercode' : 'text'" label="Confirm usercode" placeholder="Confirm usercode"  :error="isFieldValid('confirm_usercode')" :error-message="getFieldError('confirm_usercode')">
                                                    <template v-slot:append>
                                                        <q-icon
                                                        :name="isCPwd ? 'visibility_off' : 'visibility'"
                                                        class="cursor-pointer"
                                                        @click="isCPwd = !isCPwd"
                                                        />
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Image 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <div class="q-mb-sm">
                                                        <q-uploader-input :max-files="1" :max-file-size="3" accept=".jpg,.png,.gif,.jpeg" :multiple="false" delete-icon="clear" style="width:100%" label="Choose files or drop files here" upload-path="fileuploader/upload/image" v-model="formData.image"></q-uploader-input>
                                                        <!-- <small class="q-pa-sm text-negative"></small> -->
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Phone 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlphone" v-model.trim="formData.phone"  label="Phone" type="text" placeholder="Enter Phone"      
                                                    class="" :error="isFieldValid('phone')" :error-message="getFieldError('phone')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Email *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="Not available" v-model="formData.email" check-path="components_data/users_email_exist/" v-slot="checker">
                                                    <q-input   ref="ctrlemail" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.email"  label="Email" type="email" placeholder="Enter Email"      
                                                    class="" :error="isFieldValid('email') || checker.alreadyExist" :error-message="getFieldError('email') || checker.errorMsg">
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="showSubmitButton" class="text-center q-my-md">
                                        <q-btn    :rounded="false"  color="primary"  no-caps  unelevated   type="submit" icon-right="send" :loading="saving">
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                            </template>
                                        </q-btn>
                                    </div>
                                    </q-form>
                                    <slot :submit="submitForm" :saving="saving"></slot>
                                </q-card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
    </main>
</template>
<script setup>
	import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
	import { required, email, sameAs, } from 'src/services/validators';
	import { usePageStore } from 'src/stores/page';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAuth } from 'src/composables/auth';
	import { useAddPage } from 'src/composables/addpage';
	
	const props = defineProps({
		pageName : {
			type : String,
			default : 'users',
		},
		pageStoreKey: {
			type: String,
			default: 'REGISTER',
		},
		routeName : {
			type : String,
			default : 'usersuserregister',
		},
		apiPath : {
			type : String,
			default : 'auth/register',
		},
		submitButtonLabel: {
			type: String,
			default: "Submit",
		},
		formValidationError: {
			type: String,
			default: "Form is invalid",
		},
		formValidationMsg: {
			type: String,
			default: "Please complete the form",
		},
		msgTitle: {
			type: String,
			default: "Create Record",
		},
		msgAfterSave: {
			type: String,
			default: "Record added successfully",
		},
		msgBeforeSave: {
			type: String,
			default: "",
		},
		showHeader: {
			type: Boolean,
			default: true,
		},
		showSubmitButton: {
			type: Boolean,
			default: true,
		},
		redirect: {
			type : Boolean,
			default : true,
		},
		isSubPage: {
			type : Boolean,
			default : false,
		},
		pageData: { // use to set formData default values from another page
			type: Object,
			default: () => ({
				username: "NULL", usercode: "", confirm_usercode: "", image: "", phone: "NULL", email: "", 
			})
		},
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();// application state and methods
	const auth = useAuth();

	
	const formData = reactive({ ...props.pageData });
	
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			username: { required },
		usercode: { required },
		confirm_usercode: {required, sameAs: sameAs(formData.usercode, 'usercode') },
		email: { required, email }
		}
	});

	
	const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });// page form hook
	
	//event raised before form submit
	function beforeSubmit(){
		return true;
	}

	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		page.setFormDefaultValues(); // reset form data
		const loginData = response;
		// user registration completed. navigation to home page
		if (loginData.token) {
			auth.saveLoginData(loginData, false);
			location.href = "/";
		}
		else{
			app.flashMsg(loginData.message); //show flashMsg if available
			app.navigateTo(loginData.nextpage);// navigate to next page if available
		}

	}

	
	const {  saving, pageReady, isPwd, isCPwd, } = toRefs(page.state);
	
	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Add New User"
		}
	});

	
	onMounted(()=>{ 
	});
	
	// expose page object for other components access
	defineExpose({
		page
	});

</script>

<style scoped>

</style>
